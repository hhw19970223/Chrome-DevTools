import { InjectedScriptBridge, MESSAGE_TYPES } from "@/utils";
import { BaseCtrl } from "../BaseCtrl";
import "@figma/plugin-typings";
import { TreeNodeInfo } from "@/global";
export class FigmaCtrl extends BaseCtrl {
  public figma: PluginAPI | undefined;
  constructor(bridge: InjectedScriptBridge) {
    super(MESSAGE_TYPES.FIGMA, bridge);
  }
  protected _init() {
    this.figma = window.figma;

    const self = this;
    self.sendDevToolData({ isDev: !!this.figma });
    Object.defineProperty(window, "figma", {
      configurable: true,
      get() {
        return this.figma;
      },
      set(value) {
        self.sendDevToolData({ isDev: !!value });
        this.figma = value;
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

    const blob = new Blob([uint8Arr], { type: "image/png" });

    // 生成临时 URL
    const url = URL.createObjectURL(blob);
  
    // 创建 <a> 自动触发下载
    const a = document.createElement("a");
    a.href = url;
    a.download = '图片';
    a.click();
  
    // 释放 URL
    URL.revokeObjectURL(url);
  }
}
