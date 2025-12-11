/**
 * Injected Script 主入口
 * 运行在页面上下文中，可以访问页面的全局变量和函数
 */

import { InjectedScriptBridge } from '../utils/bridge';
import { MESSAGE_TYPES } from '../utils/message-types';
import { FigmaCtrl } from './figma';

window.hhw = {};

class InjectedScript {
  private _bridge: InjectedScriptBridge;
  private _eventListeners: Map<string, EventListener> = new Map();
  private _figmaCtrl: FigmaCtrl;

  constructor() {
    this._bridge = new InjectedScriptBridge();
    this.init();
    this._figmaCtrl = new FigmaCtrl(this._bridge);
    window.hhw.figmaCtrl = this._figmaCtrl;
  }

  private init() {
    console.log('[Injected Script] 初始化');

    // 设置消息监听器
    this.setupMessageHandlers();

    // 通知 Content Script 已就绪
    this._notifyReady();

    // 在 window 上暴露一些调试方法（可选）
    this.exposeDebugAPI();
  }

  /**
   * 设置消息处理器
   */
  private setupMessageHandlers() {
    // 开始监听事件
    this._bridge.onMessage<string, void>(MESSAGE_TYPES.START_LISTENING, (eventType) => {
      this._startListening(eventType);
    });

    // 停止监听事件
    this._bridge.onMessage<string, void>(MESSAGE_TYPES.STOP_LISTENING, (eventType) => {
      this._stopListening(eventType);
    });

    // Ping-Pong
    this._bridge.onMessage(MESSAGE_TYPES.PING, () => {
      return { type: MESSAGE_TYPES.PONG, timestamp: Date.now() };
    });
  }

  /**
   * 开始监听事件
   */
  private _startListening(eventType: string): void {
    if (this._eventListeners.has(eventType)) {
      return;
    }

    const listener = (event: Event) => {
      this._bridge.postToContent(MESSAGE_TYPES.EVENT_CAPTURED, {
        eventType,
        target: (event.target as Element)?.tagName || 'unknown',
        timestamp: Date.now(),
        data: this._serializeEvent(event),
      });
    };

    this._eventListeners.set(eventType, listener);
    document.addEventListener(eventType, listener, true);
  }

  /**
   * 停止监听事件
   */
  private _stopListening(eventType: string): void {
    const listener = this._eventListeners.get(eventType);
    
    if (listener) {
      document.removeEventListener(eventType, listener, true);
      this._eventListeners.delete(eventType);
    }
  }

  /**
   * 序列化事件对象
   */
  private _serializeEvent(event: Event): any {
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
  private _notifyReady(): void {
    this._bridge.postToContent(MESSAGE_TYPES.INJECTED_SCRIPT_READY, {
      timestamp: Date.now(),
      url: window.location.href,
    });
  }

  /**
   * 暴露调试 API 到 window（可选）
   */
  private exposeDebugAPI(): void {
    (window as any).__AGENT_DEBUG__ = {

    };
  }
}

// 初始化 Injected Script
new InjectedScript();

