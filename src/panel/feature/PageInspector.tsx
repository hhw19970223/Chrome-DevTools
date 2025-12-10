/**
 * 页面检查器组件 - 演示如何使用通讯架构
 */

import { useState, useEffect } from 'react';
import { Card, Stack, Button, Group, TextInput, Code, Text, Tabs } from '@mantine/core';
import { useDevToolsBridge } from '../hooks/useDevToolsBridge';
import { MESSAGE_TYPES, PageInfo } from '../../utils/message-types';

export function PageInspector() {
  const { sendToInjected, onMessage, isInjectedScriptReady } = useDevToolsBridge();
  
  const [pageInfo, setPageInfo] = useState<PageInfo | null>(null);
  const [elementSelector, setElementSelector] = useState('body');
  const [elementInfo, setElementInfo] = useState<any>(null);
  const [scriptCode, setScriptCode] = useState('document.title');
  const [scriptResult, setScriptResult] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [isListening, setIsListening] = useState(false);

  useEffect(() => {
    // 监听事件捕获
    onMessage(MESSAGE_TYPES.EVENT_CAPTURED, (payload) => {
      setEvents(prev => [...prev.slice(-9), payload]); // 只保留最新的10条
    });
  }, [onMessage]);

  // 获取页面信息
  const handleGetPageInfo = async () => {
    try {
      const info = await sendToInjected<void, PageInfo>(MESSAGE_TYPES.GET_PAGE_INFO);
      setPageInfo(info);
    } catch (error) {
      console.error('获取页面信息失败:', error);
    }
  };

  // 查询元素
  const handleQueryElement = async () => {
    try {
      const info = await sendToInjected(MESSAGE_TYPES.QUERY_ELEMENT, elementSelector);
      setElementInfo(info);
    } catch (error) {
      console.error('查询元素失败:', error);
    }
  };

  // 高亮元素
  const handleHighlightElement = async () => {
    try {
      await sendToInjected(MESSAGE_TYPES.HIGHLIGHT_ELEMENT, elementSelector);
    } catch (error) {
      console.error('高亮元素失败:', error);
    }
  };

  // 执行脚本
  const handleExecuteScript = async () => {
    try {
      const result = await sendToInjected(MESSAGE_TYPES.EXECUTE_SCRIPT, {
        code: scriptCode,
      });
      setScriptResult(result);
    } catch (error) {
      console.error('执行脚本失败:', error);
    }
  };

  // 切换事件监听
  const handleToggleEventListening = async () => {
    try {
      if (isListening) {
        await sendToInjected(MESSAGE_TYPES.STOP_LISTENING, 'click');
        setIsListening(false);
      } else {
        await sendToInjected(MESSAGE_TYPES.START_LISTENING, 'click');
        setIsListening(true);
        setEvents([]);
      }
    } catch (error) {
      console.error('切换事件监听失败:', error);
    }
  };

  return (
    <Stack gap="md">
      <Tabs defaultValue="page">
        <Tabs.List>
          <Tabs.Tab value="page">页面信息</Tabs.Tab>
          <Tabs.Tab value="element">元素查询</Tabs.Tab>
          <Tabs.Tab value="script">脚本执行</Tabs.Tab>
          <Tabs.Tab value="events">事件监听</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="page" pt="md">
          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Stack gap="md">
              <Text fw={500}>页面基本信息</Text>
              <Button 
                onClick={handleGetPageInfo} 
                disabled={!isInjectedScriptReady}
              >
                获取页面信息
              </Button>
              {pageInfo && (
                <Code block>{JSON.stringify(pageInfo, null, 2)}</Code>
              )}
            </Stack>
          </Card>
        </Tabs.Panel>

        <Tabs.Panel value="element" pt="md">
          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Stack gap="md">
              <Text fw={500}>元素查询与操作</Text>
              <TextInput
                label="CSS 选择器"
                placeholder="例如: div.container, #app, button"
                value={elementSelector}
                onChange={(e) => setElementSelector(e.currentTarget.value)}
              />
              <Group>
                <Button 
                  onClick={handleQueryElement} 
                  disabled={!isInjectedScriptReady}
                >
                  查询元素
                </Button>
                <Button 
                  onClick={handleHighlightElement} 
                  disabled={!isInjectedScriptReady}
                  variant="outline"
                >
                  高亮元素
                </Button>
              </Group>
              {elementInfo && (
                <Code block>{JSON.stringify(elementInfo, null, 2)}</Code>
              )}
            </Stack>
          </Card>
        </Tabs.Panel>

        <Tabs.Panel value="script" pt="md">
          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Stack gap="md">
              <Text fw={500}>在页面上下文中执行脚本</Text>
              <TextInput
                label="JavaScript 代码"
                placeholder="例如: document.title"
                value={scriptCode}
                onChange={(e) => setScriptCode(e.currentTarget.value)}
              />
              <Button 
                onClick={handleExecuteScript} 
                disabled={!isInjectedScriptReady}
              >
                执行脚本
              </Button>
              {scriptResult && (
                <>
                  <Text size="sm" fw={500}>
                    执行结果：
                  </Text>
                  <Code block>{JSON.stringify(scriptResult, null, 2)}</Code>
                </>
              )}
            </Stack>
          </Card>
        </Tabs.Panel>

        <Tabs.Panel value="events" pt="md">
          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Stack gap="md">
              <Text fw={500}>事件监听（点击事件）</Text>
              <Button 
                onClick={handleToggleEventListening} 
                disabled={!isInjectedScriptReady}
                color={isListening ? 'red' : 'blue'}
              >
                {isListening ? '停止监听' : '开始监听'}
              </Button>
              {events.length > 0 && (
                <>
                  <Text size="sm" fw={500}>
                    捕获的事件（最新10条）：
                  </Text>
                  <Code block>{JSON.stringify(events, null, 2)}</Code>
                </>
              )}
            </Stack>
          </Card>
        </Tabs.Panel>
      </Tabs>
    </Stack>
  );
}

