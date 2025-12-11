/**
 * Content Script 与 Injected Script 之间的通信桥接
 * 使用 window.postMessage 进行通讯
 */

import { MessageType } from "./message-types";

export interface BridgeMessage<T = any> {
  source: 'content-script' | 'injected-script';
  type: string;
  payload?: T;
  id?: string; // 用于请求-响应模式
}

export class ContentScriptBridge {
  private messageHandlers: Map<string, Function> = new Map();
  private pendingRequests: Map<string, { resolve: Function; reject: Function }> = new Map();

  constructor() {
    this.init();
  }

  private init() {
    // 监听来自 injected script 的消息
    window.addEventListener('message', (event) => {
      // 只接收来自同一窗口的消息
      if (event.source !== window) return;

      const message: BridgeMessage = event.data;
      
      // 只处理来自 injected-script 的消息
      if (message.source === 'injected-script') {
        this.handleMessage(message);
      }
    });
  }

  private handleMessage(message: BridgeMessage) {
    // 处理响应消息
    if (message.id && this.pendingRequests.has(message.id)) {
      const { resolve } = this.pendingRequests.get(message.id)!;
      this.pendingRequests.delete(message.id);
      resolve(message.payload);
      return;
    }

    // 处理普通消息
    const handler = this.messageHandlers.get(message.type);
    if (handler) {
      handler(message.payload);
    }
  }

  /**
   * 发送消息到 Injected Script
   */
  postToInjected<T = any>(type: MessageType, payload?: T): void {
    const message: BridgeMessage<T> = {
      source: 'content-script',
      type,
      payload,
    };
    window.postMessage(message, '*');
  }

  /**
   * 发送请求到 Injected Script 并等待响应
   */
  requestToInjected<T = any, R = any>(type: MessageType, payload?: T): Promise<R> {
    return new Promise((resolve, reject) => {
      const id = this.generateId();
      const message: BridgeMessage<T> = {
        source: 'content-script',
        type,
        payload,
        id,
      };

      this.pendingRequests.set(id, { resolve, reject });
      
      // 设置超时
      setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id);
          reject(new Error('Request timeout'));
        }
      }, 5000);

      window.postMessage(message, '*');
    });
  }

  /**
   * 监听来自 Injected Script 的消息
   */
  onMessage<T = any>(type: MessageType, handler: (payload: T) => void): void {
    this.messageHandlers.set(type, handler);
  }

  /**
   * 移除消息监听器
   */
  offMessage(type: MessageType): void {
    this.messageHandlers.delete(type);
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

export class InjectedScriptBridge {
  private messageHandlers: Map<string, Function> = new Map();
  private pendingRequests: Map<string, { resolve: Function; reject: Function }> = new Map();

  constructor() {
    this.init();
  }

  private init() {
    // 监听来自 content script 的消息
    window.addEventListener('message', (event) => {
      // 只接收来自同一窗口的消息
      if (event.source !== window) return;

      const message: BridgeMessage = event.data;
      
      // 只处理来自 content-script 的消息
      if (message.source === 'content-script') {
        this.handleMessage(message);
      }
    });
  }

  private handleMessage(message: BridgeMessage) {
    // 处理响应消息
    if (message.id && this.pendingRequests.has(message.id)) {
      const { resolve } = this.pendingRequests.get(message.id)!;
      this.pendingRequests.delete(message.id);
      resolve(message.payload);
      return;
    }

    // 处理普通消息
    const handler = this.messageHandlers.get(message.type);
    if (handler) {
      const result = handler(message.payload);
      
      // 如果有 id，说明需要响应
      if (message.id) {
        Promise.resolve(result).then((response) => {
          this.respond(message.id!, response);
        });
      }
    }
  }

  /**
   * 发送消息到 Content Script
   */
  postToContent<T = any>(type: MessageType, payload?: T): void {
    const message: BridgeMessage<T> = {
      source: 'injected-script',
      type,
      payload,
    };
    window.postMessage(message, '*');
  }

   /**
   * 发送消息到 Content Script
   */
   postToDevTool<T = any>(type: MessageType, payload?: T): void {
    const message: BridgeMessage<T> = {
      source: 'injected-script',
      type: 'to-devtool',
      payload: { type, payload } as any,
    };
    window.postMessage(message, '*');
  }

  /**
   * 响应请求
   */
  private respond<T = any>(id: string, payload?: T): void {
    const message: BridgeMessage<T> = {
      source: 'injected-script',
      type: 'response',
      payload,
      id,
    };
    window.postMessage(message, '*');
  }

  /**
   * 监听来自 Content Script 的消息
   */
  onMessage<T = any, R = any>(
    type: MessageType,
    handler: (payload: T) => R | Promise<R>
  ): void {
    this.messageHandlers.set(type, handler);
  }

  /**
   * 移除消息监听器
   */
  offMessage(type: string): void {
    this.messageHandlers.delete(type);
  }
}

