import { GMitt } from "@/utils";

export class Figma extends GMitt {
  constructor() {
    super();
    this._init();
  }

  private _init() {
    let _figma = window.figma; // 保存原始值

    

    Object.defineProperty(window, "figma", {
      configurable: true,
      get() {
        return _figma;
      },

      set(value) {

        _figma = value; // 更新内部保存值
      },
    });
  }
}
