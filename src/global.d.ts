import "@figma/plugin-typings";

declare global {
  interface Window {
    figma: any;
    hhw: {
      figmaCtrl?: any;
    }
  }
}

export type TreeNodeInfo = {
  name: string;
  type: string;
  css: string;
  children: TreeNodeInfo[]
}

export {};

