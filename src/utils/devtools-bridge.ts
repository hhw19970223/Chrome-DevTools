/**
 * DevTools Panel 与 Content Script 之间的通信桥接
 * 使用 chrome.runtime 和 chrome.tabs API
 */

import { Message } from './message';
import { logger } from './logger';
import { MessageType } from './message-types';

export interface DevToolsMessage<T = any> extends Message<T> {
  target: 'content-script' | 'devtools' | 'injected-script';
  tabId?: number;
}

export class DevToolsBridge {
  private tabId: number;
  private messageHandlers: Map<string, Function> = new Map();
  private connectionPort: chrome.runtime.Port | null = null;

  constructor(tabId: number) {
    this.tabId = tabId;
    this.init();
  }

  private init() {
    // 创建长连接
    this.connectionPort = chrome.runtime.connect({
      name: `devtools-${this.tabId}`,
    });

    // 监听来自 background/content script 的消息
    this.connectionPort.onMessage.addListener((message: DevToolsMessage) => {
      this.handleMessage(message);
    });

    this.connectionPort.onDisconnect.addListener(() => {
      logger.warn('DevTools connection disconnected');
      this.connectionPort = null;
    });

    // 也监听 runtime 消息（从 content script 发来的消息）
    chrome.runtime.onMessage.addListener(
      (message: DevToolsMessage, sender: chrome.runtime.MessageSender) => {
        // 只处理目标为 devtools 且来自当前标签页的消息
        if (message.target === 'devtools' && sender.tab?.id === this.tabId) {
          this.handleMessage(message);
        }
      }
    );
  }

  private handleMessage(message: DevToolsMessage) {
    logger.debug('DevTools received message:', message);
    
    const handler = this.messageHandlers.get(message.type);
    if (handler) {
      handler(message.payload, message);
    }
  }

  /**
   * 发送消息到 Content Script
   */
  async sendToContent<T = any, R = any>(type: MessageType, payload?: T): Promise<R> {
    const message: DevToolsMessage<T> = {
      type,
      payload,
      target: 'content-script',
      tabId: this.tabId,
    };

    return new Promise((resolve, reject) => {
      chrome.tabs.sendMessage(this.tabId, message, (response) => {
        if (chrome.runtime.lastError) {
          logger.error('Send to content script error:', chrome.runtime.lastError);
          reject(chrome.runtime.lastError);
        } else {
          resolve(response);
        }
      });
    });
  }

  /**
   * 发送消息到 Injected Script (通过 Content Script 转发)
   */
  async sendToInjected<T = any, R = any>(type: MessageType, payload?: T): Promise<R> {
    const message: DevToolsMessage<T> = {
      type,
      payload,
      target: 'injected-script',
      tabId: this.tabId,
    };

    return new Promise((resolve, reject) => {
      chrome.tabs.sendMessage(this.tabId, message, (response) => {
        if (chrome.runtime.lastError) {
          logger.error('Send to injected script error:', chrome.runtime.lastError);
          reject(chrome.runtime.lastError);
        } else {
          resolve(response);
        }
      });
    });
  }

  /**
   * 通过长连接发送消息
   */
  postMessage<T = any>(type: MessageType, payload?: T): void {
    if (!this.connectionPort) {
      logger.error('Connection port is not available');
      return;
    }

    const message: DevToolsMessage<T> = {
      type,
      payload,
      target: 'content-script',
      tabId: this.tabId,
    };

    this.connectionPort.postMessage(message);
  }

  /**
   * 监听消息
   */
  onMessage<T = any>(type: MessageType, handler: (payload: T, message: DevToolsMessage) => void): void {
    this.messageHandlers.set(type, handler);
  }

  /**
   * 移除消息监听器
   */
  offMessage(type: MessageType): void {
    this.messageHandlers.delete(type);
  }

  /**
   * 获取当前 Tab ID
   */
  getTabId(): number {
    return this.tabId;
  }

  /**
   * 断开连接
   */
  disconnect(): void {
    if (this.connectionPort) {
      this.connectionPort.disconnect();
      this.connectionPort = null;
    }
    this.messageHandlers.clear();
  }
}

/**
 * 初始化 DevTools Bridge
 */
export function initDevToolsBridge(): Promise<DevToolsBridge> {
  return new Promise((resolve, reject) => {
    chrome.devtools.inspectedWindow.tabId;
    const tabId = chrome.devtools.inspectedWindow.tabId;
    
    if (!tabId) {
      reject(new Error('无法获取 Tab ID'));
      return;
    }

    const bridge = new DevToolsBridge(tabId);
    resolve(bridge);
  });
}

