import { InjectedScriptBridge, MESSAGE_TYPES } from "@/utils";
import { BaseCtrl } from "../BaseCtrl";
import { TreeNodeInfo } from "@/global";
import { logger } from "../../utils/logger";
import { figmaNodeToHTML, getSelectedNodeHTML, map } from "./ast";
import { assert } from "console";
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
      logger.info("已开启Figma调试模式");
      document.addEventListener("click", this._onClick.bind(this), true);
    } else {
      if (this._figma) {
        logger.warn("已关闭Figma调试模式");
      }
      document.removeEventListener("click", this._onClick.bind(this), true);
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
      configurable: true,
      get() {
        return self.figma;
      },
      set(value) {
        self.figma = value;
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
        const tree = await this.generateTree(node);
        const info = await this.nodeToHTML(node, { includeStyles: true, format: 'dom' })
        console.log(info);
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
}

const type_object = {
  "0": "BOOLEAN",
  "1": "FLOAT",
  "2": "STRING",
  "3": "ALIAS",
  "4": "COLOR",
  "5": "EXPRESSION",
  "6": "MAP",
  "7": "SYMBOL_ID",
  "8": "FONT_STYLE",
  "9": "TEXT_DATA",
  "10": "INVALID",
  "11": "NODE_FIELD_ALIAS",
  "12": "CMS_ALIAS",
  "13": "PROP_REF",
  "14": "IMAGE",
  "15": "MANAGED_STRING_ALIAS",
  "16": "LINK",
  "17": "JS_RUNTIME_ALIAS",
  "18": "SLOT_CONTENT_ID",
  "19": "DATE",
  "20": "KEYFRAME_TRACK_ID",
  "21": "KEYFRAME_TRACK_PARAMETER_DATA",
  "BOOLEAN": 0,
  "FLOAT": 1,
  "STRING": 2,
  "ALIAS": 3,
  "COLOR": 4,
  "EXPRESSION": 5,
  "MAP": 6,
  "SYMBOL_ID": 7,
  "FONT_STYLE": 8,
  "TEXT_DATA": 9,
  "INVALID": 10,
  "NODE_FIELD_ALIAS": 11,
  "CMS_ALIAS": 12,
  "PROP_REF": 13,
  "IMAGE": 14,
  "MANAGED_STRING_ALIAS": 15,
  "LINK": 16,
  "JS_RUNTIME_ALIAS": 17,
  "SLOT_CONTENT_ID": 18,
  "DATE": 19,
  "KEYFRAME_TRACK_ID": 20,
  "KEYFRAME_TRACK_PARAMETER_DATA": 21
}