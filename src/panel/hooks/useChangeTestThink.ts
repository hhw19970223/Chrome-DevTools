import { useCallback, useMemo, useState } from "react";
import { useLoginStore } from "./useLoginStore";
import { v4 } from "uuid";
import { traceparent, uploadChatLargeData } from "@/utils/cursor";
import { notifications } from "@mantine/notifications";

export function useChangeTestThink() {
  const { loginInfo } = useLoginStore();

  const [status, setStatus] = useState<
  "submitted" | "streaming" | "ready" | "error"
>("ready");

  const [text, setText] = useState<string>("");
  const [thinkingText, setThinkingText] = useState<string>("");
  
  const loading = useMemo(() => status === "streaming", [status]);

  const changeTestThink = useCallback(async (images: any[], onChange: (code: string) => void, setOnClose: (onClose: () => void) => void, onError: () => void) => {
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

    if (!images?.length) {
      notifications.show({
        title: '提示',
        message: '分析数据为空',
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

      // 生成优化代码的提示词
      const promptText = `
# 任务说明
我已将 Figma 上的产品需求细化成多个模块，并转换成图片。图片的命名规则为：
\`\${一级模块名} --->\${二级模块名} ---> \${name}\`

# 要求
1. 请仔细提取每张图片中的文字内容，并进行深入分析
2. 按照一级模块和二级模块的层级结构，生成规范化的需求文案
3. 需求文案应当清晰、完整、结构化，便于后续转换成测试用例
4. 特别注意：如果图片名称（name）中包含 "default"，表示该图片是纯视觉参考图，无需进行文字提取和分析
5. 给我生成md文档

# 输出格式
请按以下格式输出：

## 一级模块名称

### 二级模块名称

- **需求描述**：详细描述该功能的具体需求
- **交互说明**：说明用户如何与该功能交互
- **预期结果**：描述功能执行后的预期效果
- **边界条件**：列出需要考虑的特殊情况或边界条件

（如有多个功能点，请重复以上结构）

# 注意事项
- 保持需求描述的精确性和可测试性
- 确保层级结构清晰，便于理解
- 跳过所有名称包含 "default" 的图片
`;


      try {
        await uploadChatLargeData(composerId, {
          text: promptText,
          token: loginInfo.accessToken,
          traceparent,
          xRequestId: requestId,
          bubbleId,
          composerId,
          requestId,
          images: images,
          richText: "",
          uuid: composerId,
          code: '',
          isThink: true,
        })

        const eventSource = new EventSource(`https://www.hhw31.com/api/cursor/chat?data=${params}`);

        let code = "";

        eventSource.onmessage = (event) => {
          const data = JSON.parse(event.data);
          if (data?.message?.streamUnifiedChatResponse) {
            const streamUnifiedChatResponse = data.message.streamUnifiedChatResponse;
            console.log(data.message);
         

            if (streamUnifiedChatResponse.text != null) {
              console.warn(streamUnifiedChatResponse.text);
              setText((text) => {
                return text + streamUnifiedChatResponse.text;
              })
            }

            if (streamUnifiedChatResponse?.thinking?.text != null) {
              console.warn(streamUnifiedChatResponse?.thinking?.text);
              setThinkingText((text) => {
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
              notifications.show({
                title: '成功',
                message: '代码生成完成',
                color: 'green',
              });
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
          notifications.show({
            title: '错误',
            message: '代码生成失败，请重试',
            color: 'red',
          });
          onError();
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
      fetch("https://www.hhw31.com/api/cursor/chat", {
        method: "DELETE",
        body: JSON.stringify({
          composerId
        }),
      })
    }
  }, [loading, loginInfo]);

  return {
    changeTestThink,
    loading,
    status,
    text,
    thinkingText,
  }
}  