import { useCallback, useMemo, useState } from "react";
import { useLoginStore } from "./useLoginStore";
import { v4 } from "uuid";
import { traceparent } from "@/utils/cursor";
import { notifications } from "@mantine/notifications";
import { host } from "../const";

export function useTranslation() {
  const { loginInfo } = useLoginStore();

  const [status, setStatus] = useState<
  "submitted" | "streaming" | "ready" | "error"
>("ready");

  const [text, setText] = useState<string>("");
  const [thinkingText, setThinkingText] = useState<string>("");
  
  const loading = useMemo(() => status === "streaming", [status]);

  const changeTranslation = useCallback(async (context: string, language: string, promptText: string, data: any[], onChange: (code: string) => void, setOnClose: (onClose: () => void) => void, onUpdate?: (text: string, thinkingText: string) => void, onOk?: () => void) => {
    if (loading) return;

    setThinkingText('');
    setText('');
    onChange('');
    
    if (!loginInfo?.accessToken) {
      notifications.show({
        title: '错误',
        message: '请先登录',
        color: 'red',
      });
      return;
    }

    if (!context) {
      notifications.show({
        title: '提示',
        message: '翻译内容为空，请输入翻译内容',
        color: 'orange',
      });
      return;
    }

    const composerId = v4();

    try {
      const bubbleId = v4();
      const requestId = v4();

      const params = encodeURIComponent(
        JSON.stringify({
          uuid: composerId,
        })
      );

      setStatus("streaming");
      const prompt = `
      # 角色
      你是一个资深的海外客服
      
      # 任务说明
      现在需要你将中文翻译成用户使用的语言,阿拉伯数字不需要翻译保持阿拉伯数字不变.

      ${language ? `
        # 用户使用的语言
        ${language}
        ` : '请结合之前聊天记录判断用户使用的语言,如果用户没有使用过语言,则使用英文'}

      # 聊天记录 
      ${
        data?.length > 0 ? data.reverse().map((item) => {
          return item
        }).join('\n') : ''
      }

      # 翻译要求
      ${promptText}
      
      # 翻译内容
      ${context}

      # 生成最终的翻译, md文件输出, 只需要翻译的结果, 不要包含任何其他内容
      `
      

      try {
        await fetch(host + "/api/cursor/chat", {
          method: "POST",
          body: JSON.stringify({
            text: prompt,
            token: loginInfo.accessToken,
            traceparent,
            xRequestId: requestId,
            bubbleId,
            composerId,
            requestId,
            images: [],
            richText: "",
            uuid: composerId,
            code: '',
            json: '',
            isThink: true,
          }),
        });

        const eventSource = new EventSource(host + `/api/cursor/chat?data=${params}`);

        let code = "";

        eventSource.onmessage = (event) => {
          const data = JSON.parse(event.data);
          if (data?.message?.streamUnifiedChatResponse) {
            const streamUnifiedChatResponse = data.message.streamUnifiedChatResponse;
            console.log(data.message);
         

            if (streamUnifiedChatResponse.text != null) {
              console.warn(streamUnifiedChatResponse.text);
              setText((text) => {
                onUpdate?.(text + streamUnifiedChatResponse.text, '');
                return text + streamUnifiedChatResponse.text;
              })
            }

            if (streamUnifiedChatResponse?.thinking?.text != null) {
              console.warn(streamUnifiedChatResponse?.thinking?.text);
              setThinkingText((text) => {
                onUpdate?.('', text + streamUnifiedChatResponse.thinking.text);
                return text + streamUnifiedChatResponse.thinking.text;
              })
            }

            if (streamUnifiedChatResponse.toolCall) {
              const toolCall = streamUnifiedChatResponse.toolCall;
              if (toolCall.rawArgs) {
                try {
                  const args = JSON.parse(toolCall.rawArgs);
                  const contents = args.contents;
                  if (contents) {
                    if (!code) {
                      code = contents;
                      onChange(code);
                    } else {
                      code += contents;
                      onChange(code);
                    }
                  }
                  
                } catch (e) {
                  console.error('Parse tool call error:', e);
                }
              }
            }

            if (streamUnifiedChatResponse.parallelToolCallsComplete && code) {
              onClose();
              onOk?.();
            }
          }
        };

        const onClose = () => {
          eventSource?.close();
          setStatus("ready");
        };

        setOnClose(onClose);

        eventSource.onerror = (err) => {
          console.error("SSE error:", err);
          eventSource.close();
          setStatus("error");
          if (!code) {
            notifications.show({
              title: '错误',
              message: '翻译失败，请重试',
              color: 'red',
            });
          }
        };
      } catch (error) {
        console.error('Fetch error:', error);
        setStatus("error");
        notifications.show({
          title: '错误',
          message: '网络请求失败',
          color: 'red',
        });
      }
    } catch (error) {
      console.error('Change code error:', error);
      setStatus("error");
      notifications.show({
        title: '错误',
        message: '发生未知错误',
        color: 'red',
      });
    } finally {
      fetch(host + "/api/cursor/chat", {
        method: "DELETE",
        body: JSON.stringify({
          composerId
        }),
      })
    }
  }, [loading, loginInfo]);

  return {
    changeTranslation,
    loading,
    status,
    text,
    thinkingText,
  }
}  