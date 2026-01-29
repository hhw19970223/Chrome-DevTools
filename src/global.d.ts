import "@figma/plugin-typings";
import "@mastergo/plugin-typings";

declare global {
  interface Window {
    figma: any;
    mg: any;
    libraryInfoMgr?: any;
    webpackJsonp?: any;
    hhw: {
      figmaCtrl?: any;
      mgCtrl?: any;
      
    };
    React: any;
    ReactDOM: any;
  }
}

export type TreeNodeInfo = {
  name: string;
  type: string;
  css: string;
  children: TreeNodeInfo[]
}

// 声明图片资源模块
declare module '*.jpg' {
  const value: string;
  export default value;
}

declare module '*.jpeg' {
  const value: string;
  export default value;
}

declare module '*.png' {
  const value: string;
  export default value;
}

declare module '*.gif' {
  const value: string;
  export default value;
}

declare module '*.svg' {
  const value: string;
  export default value;
}

declare module '*.webp' {
  const value: string;
  export default value;
}

export {};

