import { InjectedScriptBridge, MESSAGE_TYPES } from "@/utils";
import { BaseCtrl } from "../BaseCtrl";
import { logger } from "../../utils/logger";
import { mgNodeToHTML } from "./ast";


export class MgCtrl extends BaseCtrl {
  private _mg: PluginAPI | undefined;
  private _selectedNode: SceneNode | undefined;
  private _timeOut: NodeJS.Timeout | undefined;
  private _appFun: any;
  private _args: any[] | undefined;

  public get mg(): PluginAPI | undefined {
    return this._mg;
  }

  public set mg(value: PluginAPI) {
    if (value) {
      if (value !== this._mg) {
        logger.info("已开启mastergo调试模式");
        document.addEventListener("click", this._onClick.bind(this), true);
      }
    } else {
      if (this._mg) {
        logger.warn("已开启mastergo调试模式");
        document.removeEventListener("click", this._onClick.bind(this), true);
      }
    }
    this._mg = value;
    this.sendDevToolData({ isDev: !!value });
  }
  constructor(bridge: InjectedScriptBridge) {
    super(MESSAGE_TYPES.FIGMA, bridge);
  }


  public getModule(key: string = '9966') {
    return this._args?.[2]?.(key);
  }

  protected _init() {
    this.mg = window.mg;

    const self = this;
    self.sendDevToolData({ isDev: !!self.mg });
    Object.defineProperty(window, "mg", {
      configurable: false,
      enumerable:false,
      get() {
        return self.mg;
      },
      set(value) {
        if (value) {
          self.mg = value;
        }
      },
    });

    // 保留已存在的 webpackJsonp 数组,避免丢失已加载的模块
    const existingJsonp = (window.webpackJsonp as any) || [];
    const webpackJsonp = new Proxy(existingJsonp, {
      set(target, key, value, receiver) {

        if (key === 'push') {
          const fuc = function(...args: any[]) {
            const list = args[0];
            if (list?.[0]?.[0] === 'app') {
              self._appFun = list[1]?.['9966'];

              (list[1] as any)['9966'] = function(...args: any[]) {
                self._args = args;
                return self._appFun.apply(null, args);
              }
            }
            value.apply(null, args);
          }
          return Reflect.set(target, key, fuc, receiver)
        }

 
        return Reflect.set(target, key, value, receiver)
      }
    })

    window.webpackJsonp = webpackJsonp;
  }

  public getCurrentElement(): SceneNode | undefined {
    return this.mg?.document?.currentPage?.selection?.[0];
  }

  /**
   * 将指定节点转换为 HTML 结构
   * @param node - MasterGo 节点
   * @param options - 转换选项
   * @returns HTML 字符串、DOM 元素和 AST
   */
  public async nodeToHTML(
    node: SceneNode,
    options: {
      format?: 'string' | 'dom' | 'both';
    }
  ) {
    return await mgNodeToHTML(node, options);
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

        // 生成 AST 和 HTML
        const info = await this.nodeToHTML(node, { format: 'dom' });
      
        this.sendDevToolData({
          selected: node,
          html: info.html,
          ast: info.ast
        });
      }
    }, 500);
  }
}

