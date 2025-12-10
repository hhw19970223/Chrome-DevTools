/**
 * Content Script 主入口
 * 负责在网页中注入脚本，并在 DevTools 和 Injected Script 之间传递消息
 */

import { ContentScriptBridge } from '../utils/bridge';
import { DevToolsMessage } from '../utils/devtools-bridge';
import { MESSAGE_TYPES } from '../utils/message-types';
import { logger } from '../utils/logger';

class ContentScript {
  private bridge: ContentScriptBridge;
  private isInjected = false;

  constructor() {
    this.bridge = new ContentScriptBridge();
    this.init();
  }

  private init() {
    logger.info('Content Script 初始化');

    // 注入脚本到页面
    this.injectScript();

    // 设置消息监听
    this.setupBridgeListeners();
    this.setupRuntimeListeners();

    // 通知 DevTools Content Script 已就绪
    this.notifyReady();
  }

  /**
   * 注入脚本到页面上下文
   */
  private injectScript() {
    if (this.isInjected) {
      return;
    }

    try {
      const script = document.createElement('script');
      script.src = chrome.runtime.getURL('injected.js');
      // 移除 type="module"，使用 IIFE 格式
      script.onload = () => {
        logger.info('Injected script 加载成功');
        script.remove();
        this.isInjected = true;
      };
      script.onerror = () => {
        logger.error('Injected script 加载失败');
      };

      (document.head || document.documentElement).appendChild(script);
    } catch (error) {
      logger.error('注入脚本失败:', error);
    }
  }

  /**
   * 设置与 Injected Script 的桥接监听器
   */
  private setupBridgeListeners() {
    // 监听来自 Injected Script 的消息，转发到 DevTools
    this.bridge.onMessage(MESSAGE_TYPES.INJECTED_SCRIPT_READY, (payload) => {
      logger.info('Injected Script 已就绪');
      this.sendToDevTools(MESSAGE_TYPES.INJECTED_SCRIPT_READY, payload);
    });

    // 监听页面信息响应
    this.bridge.onMessage(MESSAGE_TYPES.PAGE_INFO_RESPONSE, (payload) => {
      this.sendToDevTools(MESSAGE_TYPES.PAGE_INFO_RESPONSE, payload);
    });

    // 监听脚本执行结果
    this.bridge.onMessage(MESSAGE_TYPES.SCRIPT_RESULT, (payload) => {
      this.sendToDevTools(MESSAGE_TYPES.SCRIPT_RESULT, payload);
    });

    // 监听事件捕获
    this.bridge.onMessage(MESSAGE_TYPES.EVENT_CAPTURED, (payload) => {
      this.sendToDevTools(MESSAGE_TYPES.EVENT_CAPTURED, payload);
    });

    // 监听数据更新
    this.bridge.onMessage(MESSAGE_TYPES.DATA_UPDATED, (payload) => {
      this.sendToDevTools(MESSAGE_TYPES.DATA_UPDATED, payload);
    });
  }

  /**
   * 设置 Chrome Runtime 消息监听器（接收来自 DevTools 的消息）
   */
  private setupRuntimeListeners() {
    chrome.runtime.onMessage.addListener(
      (message: DevToolsMessage, _sender, sendResponse) => {
        logger.debug('Content Script 收到消息:', message);

        // 根据目标转发消息
        if (message.target === 'content-script') {
          this.handleDevToolsMessage(message, sendResponse);
        } else if (message.target === 'injected-script') {
          this.forwardToInjected(message, sendResponse);
        }

        return true; // 保持消息通道开启，支持异步响应
      }
    );
  }

  /**
   * 处理来自 DevTools 的消息
   */
  private handleDevToolsMessage(
    message: DevToolsMessage,
    sendResponse: (response?: any) => void
  ) {
    switch (message.type) {
      case MESSAGE_TYPES.PING:
        sendResponse({ type: MESSAGE_TYPES.PONG, timestamp: Date.now() });
        break;

      case MESSAGE_TYPES.GET_PAGE_INFO:
        // 获取基本页面信息（Content Script 层面）
        sendResponse({
          url: window.location.href,
          title: document.title,
          readyState: document.readyState,
        });
        break;

      default:
        logger.warn('未处理的消息类型:', message.type);
        sendResponse({ error: '未知消息类型' });
    }
  }

  /**
   * 转发消息到 Injected Script
   */
  private async forwardToInjected(
    message: DevToolsMessage,
    sendResponse: (response?: any) => void
  ) {
    try {
      // 通过 bridge 发送到 injected script
      this.bridge.postToInjected(message.type, message.payload);
      
      // 某些消息需要等待响应
      if (this.needsResponse(message.type)) {
        const response = await this.bridge.requestToInjected(
          message.type,
          message.payload
        );
        sendResponse(response);
      } else {
        sendResponse({ success: true });
      }
    } catch (error) {
      logger.error('转发消息到 Injected Script 失败:', error);
      sendResponse({ error: String(error) });
    }
  }

  /**
   * 判断消息是否需要响应
   */
  private needsResponse(messageType: string): boolean {
    const responseTypes: string[] = [
      MESSAGE_TYPES.GET_PAGE_INFO,
      MESSAGE_TYPES.QUERY_ELEMENT,
      MESSAGE_TYPES.EXECUTE_SCRIPT,
    ];
    return responseTypes.includes(messageType);
  }

  /**
   * 发送消息到 DevTools
   */
  private sendToDevTools(type: string, payload?: any) {
    try {
      chrome.runtime.sendMessage({
        type,
        payload,
        target: 'devtools',
        source: 'content-script',
      });
    } catch (error) {
      logger.error('发送消息到 DevTools 失败:', error);
    }
  }

  /**
   * 通知 DevTools Content Script 已就绪
   */
  private notifyReady() {
    this.sendToDevTools(MESSAGE_TYPES.CONTENT_SCRIPT_READY, {
      url: window.location.href,
      timestamp: Date.now(),
    });
  }
}

// 初始化 Content Script
new ContentScript();
