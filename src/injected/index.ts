/**
 * Injected Script 主入口
 * 运行在页面上下文中，可以访问页面的全局变量和函数
 */

import { InjectedScriptBridge } from '../utils/bridge';
import { MESSAGE_TYPES, ScriptExecutionPayload, ScriptResultPayload } from '../utils/message-types';

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
      executeScript: (code: string) => this.executeScript({ code }),
    };
  }
}

// 初始化 Injected Script
new InjectedScript();

