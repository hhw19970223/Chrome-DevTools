/**
 * 消息类型定义
 */

// DevTools -> Content Script -> Injected Script
export const MESSAGE_TYPES = {

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

  //功能模块
  FIGMA: 'FIGMA',

} as const;

export type MessageType = typeof MESSAGE_TYPES[keyof typeof MESSAGE_TYPES];
