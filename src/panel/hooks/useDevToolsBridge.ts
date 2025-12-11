/**
 * React Hook for DevTools Bridge
 * 用于在 Panel 中使用 DevTools 通讯桥接
 */

import { MessageType } from '../../utils/message-types';
import { logger } from '../../utils/logger';
import { initDevToolsBridge } from '@/utils';
import { useEffect, useRef } from 'react';



export function useDevToolsBridge() {
  const bridge = useRef(initDevToolsBridge());

  useEffect(() => {
    return () => {
      bridge.current?.disconnect();
    }
  }, [])

  const sendToContent =  async <T = any, R = any>(type: MessageType, payload?: T): Promise<R> => {
    if (!bridge.current) {
      throw new Error('Bridge 未初始化');
    }
    return bridge.current.sendToContent<T, R>(type, payload);
  };

  const sendToInjected = 
    async <T = any, R = any>(type: MessageType, payload?: T): Promise<R> => {
      if (!bridge.current) {
        throw new Error('Bridge 未初始化');
      }
      return  bridge.current.sendToInjected<T, R>(type, payload);
    }
  const onMessage =  <T = any>(type: MessageType, handler: (payload: T) => void) => {
    if (!bridge.current) {
      logger.warn('Bridge 未初始化，无法注册消息监听');
      return;
    }
    bridge.current.onMessage<T>(type, handler);
  }

  const offMessage = (type: MessageType) => {
    if (!bridge.current) return;
    bridge.current.offMessage(type);
  };

  return {
    bridge: bridge.current,
    sendToContent,
    sendToInjected,
    onMessage,
    offMessage,
    getWindowProperty: bridge.current?.getWindowProperty.bind(bridge.current),
    setWindowProperty: bridge.current?.setWindowProperty.bind(bridge.current),
    callWindowFunction: bridge.current?.callWindowFunction.bind(bridge.current),
    evalInWindow: bridge.current?.evalInWindow.bind(bridge.current),
  };
}

