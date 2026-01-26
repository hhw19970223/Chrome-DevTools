import { InjectedScriptBridge, MESSAGE_TYPES } from "@/utils";
import { BaseCtrl } from "../BaseCtrl";
import { TreeNodeInfo } from "@/global";
import { logger } from "../../utils/logger";
import { figmaNodeToHTML, getSelectedNodeHTML, map } from "./ast";
import { v4 } from "uuid";
export class FigmaCtrl extends BaseCtrl {
  private _figma: PluginAPI | undefined;
  private _selectedNode: SceneNode | undefined;
  private _timeOut: NodeJS.Timeout | undefined;
  private _map: Record<string, string> = map;

  public get figma(): PluginAPI | undefined {
    return this._figma;
  }

  public set figma(value: PluginAPI) {
    if (value) {
      if (value !== this._figma) {
        logger.info("已开启Figma调试模式");
        document.addEventListener("click", this._onClick.bind(this), true);
      }
    } else {
      if (this._figma) {
        logger.warn("已关闭Figma调试模式");
        document.removeEventListener("click", this._onClick.bind(this), true);
      }
    }
    this._figma = value;
    this.sendDevToolData({ isDev: !!value });
  }
  constructor(bridge: InjectedScriptBridge) {
    super(MESSAGE_TYPES.FIGMA, bridge);
  }
  protected _init() {
    this.figma = window.figma;

    const self = this;
    self.sendDevToolData({ isDev: !!self.figma });
    Object.defineProperty(window, "figma", {
      configurable: false,
      enumerable:false,
      get() {
        return self.figma;
      },
      set(value) {
        if (value) {
          self.figma = value;
        }
      },
    });
  }

  public getCurrentElement(): SceneNode | undefined {
    return this.figma?.currentPage?.selection?.[0];
  }

  public async genCssCode(): Promise<string> {
    const node = this.getCurrentElement();

    if (!node) return "";
    const nodeToCSS = (name: string, css: any) => {
      return `.${name} {
      ${Object.keys(css)
        .map((k) => `${k}: ${css[k]};`)
        .join("\n  ")}
      }`;
    };

    const css = await node.getCSSAsync();
    const formatCss = nodeToCSS(node.name, css);
    return formatCss;
  }

  public async generateTree(
    node: SceneNode,
    resolve?: (value: TreeNodeInfo) => void
  ): Promise<any> {
    // 获取相应的css。
    const css = await node.getCSSAsync();
    const cssString = JSON.stringify(css, null, 2);
    const tree: TreeNodeInfo = {
      name: node.name,
      type: node.type,
      css: cssString,
      children: [],
    };
    if ("children" in node) {
      for (const child of node.children) {
        const childTree = await this.generateTree(child);
        tree.children.push(childTree);
      }
      resolve?.(tree);
    } else {
      resolve?.(tree);
    }
    return tree;
  }

  public async toImg(node: SceneNode): Promise<any> {
    const uint8Arr = await node.exportAsync({ format: "PNG" });

    const blob = new Blob([uint8Arr as any], { type: "image/png" });

    // 生成临时 URL
    const url = URL.createObjectURL(blob);

    // 创建 <a> 自动触发下载
    const a = document.createElement("a");
    a.href = url;
    a.download = "图片";
    a.click();

    // 释放 URL
    URL.revokeObjectURL(url);
  }

  /**
   * 将选中的节点转换为 HTML 结构
   * @param options - 转换选项
   * @returns HTML 字符串、DOM 元素和 AST
   */
  public async toHTML(options?: {
    includeStyles?: boolean;
    format?: 'string' | 'dom' | 'both';
  }) {
    if (!this.figma) {
      throw new Error('Figma API 未初始化');
    }
    return await getSelectedNodeHTML(this.figma, options);
  }

  /**
   * 将指定节点转换为 HTML 结构
   * @param node - Figma 节点
   * @param options - 转换选项
   * @returns HTML 字符串、DOM 元素和 AST
   */
  public async nodeToHTML(
    node: SceneNode,
    options?: {
      includeStyles?: boolean;
      format?: 'string' | 'dom' | 'both';
    }
  ) {
    return await figmaNodeToHTML(node, options);
  }

  private async _onClick() {
    if (this._timeOut) {
      clearTimeout(this._timeOut);
    }

    this._timeOut = setTimeout(async () => {
      this._timeOut = undefined;

      const node = this.getCurrentElement();
      if (node && this._selectedNode !== node) {
        this._selectedNode = node;

        console.log(node);

        const tree = await this.generateTree(node);
        const info = await this.nodeToHTML(node, { includeStyles: true, format: 'dom' })
        this.sendDevToolData({
          selected: node,
          tree,
          html: info.html,
          ast: info.ast
        });
      }
    }, 500);
  }

  public async toSvg(): Promise<string> {
    const node = this.getCurrentElement();
    const svgBytes = await (node as any).exportAsync({
      format: 'SVG',
      svgOutlineText: false,
    });
    const svgString = new TextDecoder().decode(svgBytes);

    this.sendDevToolData({
      selected: node,
      html: svgString,
    });

    return svgString;
  }

  public async getAllPages(): Promise<void> {
    // const pages = this.figma?.root.findAll(n => n.type === 'PAGE' && !['封面', 'UI稿', '基础信息', '(删除)', '（删除）'].some(name => n.name?.includes(name))) as PageNode[] || [];
    const pages = [figma.currentPage];
    const getImg = async (node: SceneNode, sectionName?: string): Promise<{ data: Uint8Array, name: string }[] | null> => {

      // 判断节点是否符合导出条件
      if (node.type === 'FRAME' && ['default', 'Frame'].some(name => node.name?.toLocaleLowerCase()?.includes(name.toLocaleLowerCase()))) {
        try {
          // 导出节点为 PNG 图片
          const bytes = await node.exportAsync({
            format: 'PNG',
          });

          console.log(node);
          
          // 如果导出成功,直接返回 bytes,不继续遍历子节点
          return [{
            data: bytes,
            name: sectionName ? sectionName + '--->' + node.name : node.name,
          }];
        } catch (error) {
          console.warn(`无法导出 image 节点 ${node.name}:`, error);
        }
      }

      if ('children' in node) {
        if (node.type === 'SECTION') {
          sectionName = node.name
        }
        const images: any[] = [];
        for (const child of node.children) {
          const imgs = await getImg(child, sectionName);
          if (imgs) {
            images.push(...imgs);
          }
        }
        if (images?.length) {
          return images;
        }
      }

      return null;
    }
    
    const images: any[] = [];
    for (const page of pages) {
      const layers = page.findAll()?.filter(n => n.type === 'SECTION') || [];
      if (layers?.length) {
        for (let i = 0; i < layers.length; i++) {
          const layer = layers[i];
          const imgs = await getImg(layer);
          if (imgs?.length) {
            for(const img of imgs) {
              if (img.data) {
                images.push({
                  data: Array.from(img.data), // 转换为普通数组以便序列化
                  uuid: v4(),
                  type: 'image/png',
                  filename: page.name + '--->' + img.name,
                });
              }
            }
          }
        }
      }
     
    }  

    console.log(images);
   
    this.sendDevToolData({
      project: {
        name: this.figma?.root?.name,
        images,
      }
    });
  }
}