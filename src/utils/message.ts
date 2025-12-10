/**
 * 消息通信工具类 - 封装Chrome Message API
 */

export interface Message<T = any> {
  type: string;
  payload?: T;
}

export class MessageUtil {
  /**
   * 发送消息到Background
   */
  static async sendToBackground<T = any, R = any>(
    message: Message<T>
  ): Promise<R> {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(message, (response) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(response);
        }
      });
    });
  }

  /**
   * 发送消息到Content Script
   */
  static async sendToContentScript<T = any, R = any>(
    tabId: number,
    message: Message<T>
  ): Promise<R> {
    return new Promise((resolve, reject) => {
      chrome.tabs.sendMessage(tabId, message, (response) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(response);
        }
      });
    });
  }

  /**
   * 发送消息到当前激活的Tab
   */
  static async sendToActiveTab<T = any, R = any>(
    message: Message<T>
  ): Promise<R> {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab.id) {
      throw new Error('无法获取当前Tab ID');
    }
    return MessageUtil.sendToContentScript(tab.id, message);
  }

  /**
   * 监听消息
   */
  static onMessage<T = any, R = any>(
    callback: (
      message: Message<T>,
      sender: chrome.runtime.MessageSender
    ) => R | Promise<R>
  ): void {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      Promise.resolve(callback(message, sender))
        .then(sendResponse)
        .catch((error) => {
          console.error('消息处理错误:', error);
          sendResponse({ error: error.message });
        });
      return true; // 表示异步响应
    });
  }

  /**
   * 获取当前Tab信息
   */
  static async getCurrentTab(): Promise<chrome.tabs.Tab> {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) {
      throw new Error('无法获取当前Tab');
    }
    return tab;
  }
}


