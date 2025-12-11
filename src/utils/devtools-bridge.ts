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

  /**
   * 在被检查页面的 window 上下文中执行代码
   * @param expression 要执行的 JavaScript 表达式或代码
   * @param options 可选配置
   * @returns Promise，包含执行结果和可能的异常信息
   */
  evalInWindow<T = any>(
    expression: string,
    options?: chrome.devtools.inspectedWindow.EvalOptions
  ): Promise<{ result: T; isException: boolean; exceptionInfo?: any }> {
    return new Promise((resolve, reject) => {
      chrome.devtools.inspectedWindow.eval(
        expression,
        options,
        (result: any, exceptionInfo: any) => {
          console.log(exceptionInfo, result);
          resolve(result);
        }
      );
    });
  }

  /**
   * 在被检查页面的 window 上下文中调用函数
   * @param functionName window 对象上的函数名（支持链式调用，如 'console.log'）
   * @param args 函数参数数组
   * @returns Promise，包含函数执行结果
   */
  async callWindowFunction<T = any>(
    functionName: string,
    ...args: any[]
  ): Promise<any> {
    // 将参数转换为 JSON 字符串，然后构建调用表达式
    const argsStr = args.map((arg) => JSON.stringify(arg)).join(', ');
    const expression = `${functionName}(${argsStr})`;
    
    return this.evalInWindow<T>(expression);
  }

  /**
   * 获取 window 对象上的属性值
   * @param propertyPath 属性路径（支持链式访问，如 'location.href'）
   * @returns Promise，包含属性值
   */
  async getWindowProperty<T = any>(
    propertyPath: string
  ): Promise<any> {
    return this.evalInWindow<T>(propertyPath);
  }

  /**
   * 设置 window 对象上的属性值
   * @param propertyPath 属性路径
   * @param value 要设置的值
   * @returns Promise，包含设置结果
   */
  async setWindowProperty(
    propertyPath: string,
    value: any
  ): Promise<any> {
    const valueStr = JSON.stringify(value);
    const expression = `${propertyPath} = ${valueStr}`;
    
    return this.evalInWindow(expression);
  }
}

/**
 * 初始化 DevTools Bridge
 */
export function initDevToolsBridge(): DevToolsBridge | undefined {
  const tabId = chrome.devtools.inspectedWindow.tabId;
    
  if (!tabId) {
    return;
  }

  const bridge = new DevToolsBridge(tabId);
  return bridge;
}

