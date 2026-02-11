import {
  getlocalStorage,
  InjectedScriptBridge,
  MESSAGE_TYPES,
  discordToken,
} from "@/utils";
import { BaseCtrl } from "../BaseCtrl";

export class DiscordCtrl extends BaseCtrl {
  private _mainDom: HTMLElement;
  private _bodyObserver: MutationObserver | null = null;
  private _mainDomObserver: MutationObserver | null = null;
  private _scrollerInnerDoms: HTMLElement[] = [];

  constructor(bridge: InjectedScriptBridge) {
    super(MESSAGE_TYPES.DISCORD, bridge);
    this._mainDom = this._getMainDom();
  }

  private _getMainDom(): HTMLElement {
    return document.querySelector('[class*="chatContent_"]') as HTMLElement;
  }

  private _getscrollerInnerDoms() {
    return document
      .querySelector('[class*="scrollerInner__"]')
      ?.querySelectorAll('li [class*="contents_"]');
  }

  /**
   * 获取 Discord 的输入框
   */
  private _getInputTextarea(): HTMLElement | null {
    // Discord 使用 contenteditable div 作为输入框
    return document
      .querySelector("[class*='slateContainer_']")
      ?.querySelector("[class*='editor__']") as HTMLElement;
  }

  /**
   * 模拟用户粘贴操作
   */
  private async _simulateUserInput(value: string): Promise<void> {
    const textarea = this._getInputTextarea();
    if (!textarea) {
      console.warn("Discord 输入框未找到");
      return;
    }

    // 聚焦到输入框
    textarea.focus();

    // 创建 ClipboardEvent 模拟粘贴
    const dataTransfer = new DataTransfer();
    dataTransfer.setData('text/plain', value);
    
    // 触发 paste 事件
    const pasteEvent = new ClipboardEvent('paste', {
      bubbles: true,
      cancelable: true,
      clipboardData: dataTransfer,
    });
    
    textarea.dispatchEvent(pasteEvent);
    console.log("已模拟粘贴操作:", value);
  }

  /**
   * 获取 Discord 的 authorization token
   */
  public getAuthorization() {
    let token = "";

    if (discordToken) {
      try {
        token = JSON.parse(discordToken);
      } catch (e) {
        token = discordToken;
      }
    }

    const value = getlocalStorage("token");
    if (value) {
      try {
        token = JSON.parse(value);
      } catch (e) {
        token = value;
      }
    }

    if (token) {
      this.sendDevToolData({
        authorization: token,
      });
    }
  }

  /**
   * 将HTML中的相对路径src添加域名
   */
  private _addDomainToSrc(html: string): string {
    const origin = window.location.origin;

    // 替换 src="/..." 为 src="域名/..."
    html = html.replace(/src="\/([^"]+)"/g, `src="${origin}/$1"`);

    // 替换 src='/...' 为 src='域名/...'
    html = html.replace(/src='\/([^']+)'/g, `src='${origin}/$1'`);

    return html;
  }

  protected _init(): void {
    this._observeBodyChildren();
    if (this._mainDom) {
      this._observeMainDomChildren(this._mainDom);
    }

    // 监听来自 DevTools 的消息（通过 bridge）
    this._bridge.onMessage(MESSAGE_TYPES.DISCORD, async (payload: any) => {
      if (payload.inputValue) {
        await this._simulateUserInput(payload.inputValue);
      }
    });
    // 获取 Discord authorization
    this.getAuthorization();
  }

  /**
   * 捕获页面中所有的CSS样式表并发送给devTool
   */
  public captureCSSStylesheets(): void {
    const linkElements = document.querySelectorAll('link[rel="stylesheet"]');
    const links = Array.from(linkElements as NodeListOf<HTMLLinkElement>)
      .map((link) => {
        return this._addDomainToSrc(link.href);
      })
      .filter((href) => href?.includes(".css"));

    this.sendDevToolData({
      links,
    });
  }

  public getChatList(): void {
    const nodes = this._getscrollerInnerDoms();
    if (nodes) {
      this._scrollerInnerDoms = nodes as unknown as HTMLElement[];

      // 将元素转成字符串数组
      const htmlStrings = Array.from(nodes).map((node) => {
        const element = node as HTMLElement;
        let html = element.outerHTML;

        // 将相对路径的src加上域名
        html = this._addDomainToSrc(html);

        return html;
      });

      // 发送给devtool渲染
      this.sendDevToolData({
        htmlStrings,
      });
    }
  }

  /**
   * 监听body的子元素数量变化
   */
  private _observeBodyChildren(): void {
    // 创建MutationObserver实例
    this._bodyObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === "childList") {
          let flag = false;
          if (mutation.addedNodes.length > 0) {
            flag = true;
          }

          // 如果有节点被删除
          if (mutation.removedNodes.length > 0) {
            flag = true;
          }

          if (flag) {
            const newMainDom = this._getMainDom();
            if (newMainDom && newMainDom !== this._mainDom) {
              const oldMainDom = this._mainDom;
              this._mainDom = newMainDom;

              // 移除旧的mainDom监听
              this._removeMainDomObserver();

              // 对新的mainDom进行监听
              this._observeMainDomChildren(newMainDom);

              console.log("MainDom已更新", {
                旧元素: oldMainDom,
                新元素: newMainDom,
              });
            }
          }
        }
      });
    });

    // 配置观察选项
    const config = {
      childList: true, // 观察直接子节点的变化
      subtree: true, // 不观察所有后代节点（只观察直接子元素）
    };

    // 开始观察body元素
    this._bodyObserver.observe(document.body, config);
    console.log("开始监听body子元素变化");
  }

  /**
   * 监听mainDom的子元素变化
   */
  private _observeMainDomChildren(mainDom: HTMLElement): void {
    if (!mainDom) return;

    // 创建新的observer监听mainDom
    this._mainDomObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === "childList") {
          const nodes = this._getscrollerInnerDoms();
          if (nodes) {
            this._scrollerInnerDoms = nodes as unknown as HTMLElement[];

            // 将元素转成字符串数组
            const htmlStrings = Array.from(nodes).map((node) => {
              const element = node as HTMLElement;
              let html = element.outerHTML;

              // 将相对路径的src加上域名
              html = this._addDomainToSrc(html);

              return html;
            });

            this.captureCSSStylesheets();

            // 获取 Discord authorization
            this.getAuthorization();

            // 发送给devtool渲染
            this.sendDevToolData({
              htmlStrings,
            });
          }
        }
      });
    });

    const config = {
      childList: true,
      subtree: true,
    };

    this._mainDomObserver.observe(mainDom, config);
    console.log("开始监听MainDom子元素变化", mainDom);
  }

  /**
   * 移除mainDom的监听
   */
  private _removeMainDomObserver(): void {
    if (this._mainDomObserver) {
      this._mainDomObserver.disconnect();
      this._mainDomObserver = null;
      console.log("已移除MainDom监听");
    }
  }

  /**
   * 清理资源
   */
  public dispose(): void {
    // 清理body观察者
    if (this._bodyObserver) {
      this._bodyObserver.disconnect();
      this._bodyObserver = null;
      console.log("停止监听body子元素变化");
    }

    // 清理mainDom观察者
    this._removeMainDomObserver();
  }
}
