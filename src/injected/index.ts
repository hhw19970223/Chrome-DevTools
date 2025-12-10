/**
 * Injected Script 主入口
 * 运行在页面上下文中，可以访问页面的全局变量和函数
 */

import { InjectedScriptBridge } from '../utils/bridge';
import { MESSAGE_TYPES, PageInfo, ScriptExecutionPayload, ScriptResultPayload } from '../utils/message-types';

class InjectedScript {
  private bridge: InjectedScriptBridge;
  private eventListeners: Map<string, EventListener> = new Map();

  constructor() {
    this.bridge = new InjectedScriptBridge();
    this.init();
  }

  private init() {
    console.log('[Injected Script] 初始化');

    // 设置消息监听器
    this.setupMessageHandlers();

    // 通知 Content Script 已就绪
    this.notifyReady();

    // 在 window 上暴露一些调试方法（可选）
    this.exposeDebugAPI();
  }

  /**
   * 设置消息处理器
   */
  private setupMessageHandlers() {
    // 获取页面信息
    this.bridge.onMessage<void, PageInfo>(MESSAGE_TYPES.GET_PAGE_INFO, () => {
      return this.getPageInfo();
    });

    // 执行脚本
    this.bridge.onMessage<ScriptExecutionPayload, ScriptResultPayload>(
      MESSAGE_TYPES.EXECUTE_SCRIPT,
      (payload) => {
        return this.executeScript(payload);
      }
    );

    // 查询元素
    this.bridge.onMessage<string, any>(MESSAGE_TYPES.QUERY_ELEMENT, (selector) => {
      return this.queryElement(selector);
    });

    // 高亮元素
    this.bridge.onMessage<string, void>(MESSAGE_TYPES.HIGHLIGHT_ELEMENT, (selector) => {
      this.highlightElement(selector);
    });

    // 开始监听事件
    this.bridge.onMessage<string, void>(MESSAGE_TYPES.START_LISTENING, (eventType) => {
      this.startListening(eventType);
    });

    // 停止监听事件
    this.bridge.onMessage<string, void>(MESSAGE_TYPES.STOP_LISTENING, (eventType) => {
      this.stopListening(eventType);
    });

    // Ping-Pong
    this.bridge.onMessage(MESSAGE_TYPES.PING, () => {
      return { type: MESSAGE_TYPES.PONG, timestamp: Date.now() };
    });
  }

  /**
   * 获取页面信息
   */
  private getPageInfo(): PageInfo {
    return {
      url: window.location.href,
      title: document.title,
      width: window.innerWidth,
      height: window.innerHeight,
      userAgent: navigator.userAgent,
      timestamp: Date.now(),
    };
  }

  /**
   * 执行脚本
   */
  private executeScript(payload: ScriptExecutionPayload): ScriptResultPayload {
    try {
      // 使用 eval 在页面上下文中执行代码
      // 注意：这里要小心处理，确保安全性
      const result = eval(payload.code);
      
      return {
        success: true,
        result: this.serializeResult(result),
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * 序列化执行结果（处理不可序列化的对象）
   */
  private serializeResult(result: any): any {
    if (result === undefined) return 'undefined';
    if (result === null) return null;
    if (typeof result === 'function') return result.toString();
    if (result instanceof Error) return { error: result.message, stack: result.stack };
    
    // 对于 DOM 元素，返回简化信息
    if (result instanceof Element) {
      return {
        tagName: result.tagName,
        id: result.id,
        className: result.className,
        textContent: result.textContent?.substring(0, 100),
      };
    }

    // 对于对象和数组，尝试 JSON 序列化
    try {
      JSON.stringify(result);
      return result;
    } catch {
      return String(result);
    }
  }

  /**
   * 查询元素
   */
  private queryElement(selector: string): any {
    try {
      const element = document.querySelector(selector);
      
      if (!element) {
        return { found: false };
      }

      const rect = element.getBoundingClientRect();
      
      return {
        found: true,
        tagName: element.tagName,
        id: element.id,
        className: element.className,
        textContent: element.textContent?.substring(0, 100),
        attributes: this.getAttributes(element),
        boundingRect: {
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
        },
      };
    } catch (error: any) {
      return { found: false, error: error.message };
    }
  }

  /**
   * 获取元素属性
   */
  private getAttributes(element: Element): Record<string, string> {
    const attrs: Record<string, string> = {};
    for (let i = 0; i < element.attributes.length; i++) {
      const attr = element.attributes[i];
      attrs[attr.name] = attr.value;
    }
    return attrs;
  }

  /**
   * 高亮元素
   */
  private highlightElement(selector: string): void {
    try {
      const element = document.querySelector(selector);
      
      if (!element) {
        return;
      }

      // 添加高亮样式
      const originalOutline = (element as HTMLElement).style.outline;
      (element as HTMLElement).style.outline = '2px solid #ff0000';

      // 3秒后移除高亮
      setTimeout(() => {
        (element as HTMLElement).style.outline = originalOutline;
      }, 3000);
    } catch (error) {
      console.error('高亮元素失败:', error);
    }
  }

  /**
   * 开始监听事件
   */
  private startListening(eventType: string): void {
    if (this.eventListeners.has(eventType)) {
      return;
    }

    const listener = (event: Event) => {
      this.bridge.postToContent(MESSAGE_TYPES.EVENT_CAPTURED, {
        eventType,
        target: (event.target as Element)?.tagName || 'unknown',
        timestamp: Date.now(),
        data: this.serializeEvent(event),
      });
    };

    this.eventListeners.set(eventType, listener);
    document.addEventListener(eventType, listener, true);
  }

  /**
   * 停止监听事件
   */
  private stopListening(eventType: string): void {
    const listener = this.eventListeners.get(eventType);
    
    if (listener) {
      document.removeEventListener(eventType, listener, true);
      this.eventListeners.delete(eventType);
    }
  }

  /**
   * 序列化事件对象
   */
  private serializeEvent(event: Event): any {
    return {
      type: event.type,
      timeStamp: event.timeStamp,
      bubbles: event.bubbles,
      cancelable: event.cancelable,
      // 添加更多需要的事件属性
    };
  }

  /**
   * 通知 Content Script 已就绪
   */
  private notifyReady(): void {
    this.bridge.postToContent(MESSAGE_TYPES.INJECTED_SCRIPT_READY, {
      timestamp: Date.now(),
      url: window.location.href,
    });
  }

  /**
   * 暴露调试 API 到 window（可选）
   */
  private exposeDebugAPI(): void {
    (window as any).__AGENT_DEBUG__ = {
      getPageInfo: () => this.getPageInfo(),
      queryElement: (selector: string) => this.queryElement(selector),
      executeScript: (code: string) => this.executeScript({ code }),
    };
  }
}

// 初始化 Injected Script
new InjectedScript();

