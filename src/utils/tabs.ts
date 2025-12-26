/**
 * Chrome 标签页工具类 - 封装Chrome Tabs API
 */

export interface OpenTabOptions {
  /** 是否在新窗口中打开 */
  newWindow?: boolean;
  /** 是否激活标签页 */
  active?: boolean;
  /** 在指定位置打开标签页 */
  index?: number;
}

export class TabsUtil {
  /**
   * 打开新标签页
   * @param url 要打开的URL
   * @param options 打开选项
   */
  static async openTab(url: string, options: OpenTabOptions = {}): Promise<chrome.tabs.Tab> {
    const { newWindow = false, active = true, index } = options;

    return new Promise((resolve, reject) => {
      if (newWindow) {
        // 在新窗口中打开
        chrome.windows.create(
          {
            url,
            focused: active,
          },
          (window) => {
            if (chrome.runtime.lastError) {
              reject(chrome.runtime.lastError);
            } else if (window?.tabs?.[0]) {
              resolve(window.tabs[0]);
            } else {
              reject(new Error('Failed to create window'));
            }
          }
        );
      } else {
        // 在当前窗口新标签页中打开
        chrome.tabs.create(
          {
            url,
            active,
            index,
          },
          (tab) => {
            if (chrome.runtime.lastError) {
              reject(chrome.runtime.lastError);
            } else {
              resolve(tab);
            }
          }
        );
      }
    });
  }

  /**
   * 获取当前激活的标签页
   */
  static async getCurrentTab(): Promise<chrome.tabs.Tab> {
    return new Promise((resolve, reject) => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else if (tabs[0]) {
          resolve(tabs[0]);
        } else {
          reject(new Error('No active tab found'));
        }
      });
    });
  }

  /**
   * 关闭指定标签页
   */
  static async closeTab(tabId: number): Promise<void> {
    return new Promise((resolve, reject) => {
      chrome.tabs.remove(tabId, () => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * 更新标签页URL
   */
  static async updateTab(tabId: number, url: string): Promise<chrome.tabs.Tab> {
    return new Promise((resolve, reject) => {
      chrome.tabs.update(tabId, { url }, (tab) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else if (tab) {
          resolve(tab);
        } else {
          reject(new Error('Failed to update tab'));
        }
      });
    });
  }
}





