import { useCallback, useEffect, useMemo, useState } from "react";
import { useLoginStore } from "./useLoginStore";
import { v4 } from "uuid";
import { traceparent } from "@/utils/cursor";
import { notifications } from "@mantine/notifications";

export function useChangeCode() {
  const { loginInfo } = useLoginStore();

  const [status, setStatus] = useState<
  "submitted" | "streaming" | "ready" | "error"
>("ready");

  const [text, setText] = useState<string>("");
  const [thinkingText, setThinkingText] = useState<string>("");
  
  const loading = useMemo(() => status === "streaming", [status]);

  const changeCode = useCallback(async (html: string, onChange: (code: string) => void, setOnClose: (onClose: () => void) => void) => {
    if (loading) return;
    
    if (!loginInfo?.accessToken) {
      notifications.show({
        title: '错误',
        message: '请先登录',
        color: 'red',
      });
      return;
    }

    if (!html || html.trim() === '') {
      notifications.show({
        title: '提示',
        message: '请先生成或输入代码',
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
      const promptText = `@index.html 请将以下 HTML 代码转换为 React + Tailwind CSS 组件，具体要求：

## 转换要求：
1. **HTML 结构转换**：
   - 将 HTML 转换为 React TSX 语法
   - class 改为 className
   - style 改为对应的 Tailwind CSS
   - 不要生成额外的子组件
   - 参数都在组件内处理，不通过外部传参。 组件内需要使用 useState 管理状态，不要使用 useRef
   - 在视觉效果上必现百分百还原


2. **CSS 变量处理**（重要）：
   - 识别并分析所有 CSS 变量，特别是 Figma 生成的变量（如 --figma-xxx, --color-xxx, --spacing-xxx 等）
   - 将颜色变量转换为 Tailwind 颜色类（如 text-[#xxx], bg-[#xxx]）
   - 将间距变量转换为 Tailwind 间距类（如 p-4, m-2, gap-3）
   - 将字体变量转换为 Tailwind 字体类（如 text-sm, font-bold）
   - 将圆角变量转换为 Tailwind 圆角类（如 rounded-lg）
   - 将阴影变量转换为 Tailwind 阴影类（如 shadow-md）

3. **样式转换**：
   - 将所有内联样式和 style 标签中的 CSS 转换为 Tailwind CSS 类
   - 如果Tailwind CSS 类是默认的样式直接帮我去掉不要生成到代码中
   - Flexbox 布局转换为 flex 相关类
   - Grid 布局转换为 grid 相关类
   - 定位属性转换为 relative/absolute/fixed 类
   - 响应式设计使用 sm:/md:/lg: 前缀

4. **组件化**：
   - 将代码封装为一个独立的 React 函数组件
   - 添加必要的 props 类型定义（使用 TypeScript）
   - 不要生成额外的子组件。

5. **代码质量**：
   - 确保代码格式规范，使用 2 空格缩进
   - 添加必要的注释说明复杂逻辑
   - 确保可读性和可维护性
   
6. **svg**
   - 在同文件中生成svg组件进行引入，不要生成额外的文件。 不要生成额外的子组件。不要用export default导出。



## 输出格式：
只返回完整的 React 组件代码，不要添加任何额外说明、markdown 标记或代码块符号。
代码应该可以直接在 React 项目中使用。
`;


      try {
        await fetch("https://www.hhw31.com/api/cursor/chat", {
          method: "POST",
          body: JSON.stringify({
            text: promptText,
            token: loginInfo.accessToken,
            traceparent,
            xRequestId: requestId,
            bubbleId,
            composerId,
            requestId,
            images: [],
            richText: "",
            uuid: composerId,
            code: html,
            isThink: true,
          }),
        });

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

  useEffect(() => {
    if (!loading) {
      setText("");
    }
  }, [loading])

  return {
    changeCode,
    loading,
    status,
    text
  }
}  