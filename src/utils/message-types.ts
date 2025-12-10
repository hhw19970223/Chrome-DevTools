/**
 * 消息类型定义
 */

// DevTools -> Content Script -> Injected Script
export const MESSAGE_TYPES = {
  // 页面信息相关
  GET_PAGE_INFO: 'GET_PAGE_INFO',
  PAGE_INFO_RESPONSE: 'PAGE_INFO_RESPONSE',
  
  // DOM 操作相关
  QUERY_ELEMENT: 'QUERY_ELEMENT',
  HIGHLIGHT_ELEMENT: 'HIGHLIGHT_ELEMENT',
  INSPECT_ELEMENT: 'INSPECT_ELEMENT',
  
  // 脚本执行相关
  EXECUTE_SCRIPT: 'EXECUTE_SCRIPT',
  SCRIPT_RESULT: 'SCRIPT_RESULT',
  
  // 事件监听相关
  START_LISTENING: 'START_LISTENING',
  STOP_LISTENING: 'STOP_LISTENING',
  EVENT_CAPTURED: 'EVENT_CAPTURED',
  
  // 数据同步相关
  SYNC_DATA: 'SYNC_DATA',
  DATA_UPDATED: 'DATA_UPDATED',
  
  // 通用消息
  PING: 'PING',
  PONG: 'PONG',
  ERROR: 'ERROR',
  
  // Content Script 状态
  CONTENT_SCRIPT_READY: 'CONTENT_SCRIPT_READY',
  INJECTED_SCRIPT_READY: 'INJECTED_SCRIPT_READY',
} as const;

export type MessageType = typeof MESSAGE_TYPES[keyof typeof MESSAGE_TYPES];

// 消息 Payload 类型定义
export interface PageInfo {
  url: string;
  title: string;
  width: number;
  height: number;
  userAgent: string;
  timestamp: number;
}

export interface ElementInfo {
  tagName: string;
  id: string;
  className: string;
  textContent: string;
  attributes: Record<string, string>;
  boundingRect: DOMRect;
}

export interface ScriptExecutionPayload {
  code: string;
  context?: 'page' | 'content';
}

export interface ScriptResultPayload {
  success: boolean;
  result?: any;
  error?: string;
}

export interface EventCapturePayload {
  eventType: string;
  target: string;
  timestamp: number;
  data: any;
}

