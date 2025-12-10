/**
 * React Hook for DevTools Bridge
 * 用于在 Panel 中使用 DevTools 通讯桥接
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { DevToolsBridge, initDevToolsBridge } from '../../utils/devtools-bridge';
import { MESSAGE_TYPES, MessageType } from '../../utils/message-types';
import { logger } from '../../utils/logger';

export interface UseDevToolsBridgeResult {
  bridge: DevToolsBridge | null;
  isReady: boolean;
  isContentScriptReady: boolean;
  isInjectedScriptReady: boolean;
  sendToContent: <T = any, R = any>(type: MessageType, payload?: T) => Promise<R>;
  sendToInjected: <T = any, R = any>(type: MessageType, payload?: T) => Promise<R>;
  onMessage: <T = any>(type: MessageType, handler: (payload: T) => void) => void;
  offMessage: (type: MessageType) => void;
}

export function useDevToolsBridge(): UseDevToolsBridgeResult {
  const [bridge, setBridge] = useState<DevToolsBridge | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isContentScriptReady, setIsContentScriptReady] = useState(false);
  const [isInjectedScriptReady, setIsInjectedScriptReady] = useState(false);
  const bridgeRef = useRef<DevToolsBridge | null>(null);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        const newBridge = await initDevToolsBridge();
        
        if (!mounted) return;

        bridgeRef.current = newBridge;
        setBridge(newBridge);
        setIsReady(true);

        // 监听 Content Script 就绪
        newBridge.onMessage(MESSAGE_TYPES.CONTENT_SCRIPT_READY, (payload) => {
          logger.info('Content Script 已就绪', payload);
          setIsContentScriptReady(true);
        });

        // 监听 Injected Script 就绪
        newBridge.onMessage(MESSAGE_TYPES.INJECTED_SCRIPT_READY, (payload) => {
          logger.info('Injected Script 已就绪', payload);
          setIsInjectedScriptReady(true);
        });

        // 发送 Ping 检查连接状态
        setTimeout(() => {
          newBridge.sendToContent(MESSAGE_TYPES.PING).catch((err) => {
            logger.warn('Content Script 可能未就绪:', err);
          });
        }, 500);

      } catch (error) {
        logger.error('初始化 DevTools Bridge 失败:', error);
      }
    };

    init();

    return () => {
      mounted = false;
      if (bridgeRef.current) {
        bridgeRef.current.disconnect();
      }
    };
  }, []);

  const sendToContent = useCallback(
    async <T = any, R = any>(type: MessageType, payload?: T): Promise<R> => {
      if (!bridge) {
        throw new Error('Bridge 未初始化');
      }
      return bridge.sendToContent<T, R>(type, payload);
    },
    [bridge]
  );

  const sendToInjected = useCallback(
    async <T = any, R = any>(type: MessageType, payload?: T): Promise<R> => {
      if (!bridge) {
        throw new Error('Bridge 未初始化');
      }
      return bridge.sendToInjected<T, R>(type, payload);
    },
    [bridge]
  );

  const onMessage = useCallback(
    <T = any>(type: MessageType, handler: (payload: T) => void) => {
      if (!bridge) {
        logger.warn('Bridge 未初始化，无法注册消息监听');
        return;
      }
      bridge.onMessage<T>(type, handler);
    },
    [bridge]
  );

  const offMessage = useCallback(
    (type: MessageType) => {
      if (!bridge) return;
      bridge.offMessage(type);
    },
    [bridge]
  );

  return {
    bridge,
    isReady,
    isContentScriptReady,
    isInjectedScriptReady,
    sendToContent,
    sendToInjected,
    onMessage,
    offMessage,
  };
}

