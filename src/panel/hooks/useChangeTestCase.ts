import { useCallback, useEffect, useMemo, useState } from "react";
import { useLoginStore } from "./useLoginStore";
import { v4 } from "uuid";
import { traceparent } from "@/utils/cursor";
import { notifications } from "@mantine/notifications";

export function useChangeTestCase() {
  const { loginInfo } = useLoginStore();

  const [status, setStatus] = useState<
  "submitted" | "streaming" | "ready" | "error"
>("ready");

  const [text, setText] = useState<string>("");
  
  const loading = useMemo(() => status === "streaming", [status]);

  const changeCode = useCallback(async (requirement: any, onChange: (code: string) => void, setOnClose: (onClose: () => void) => void) => {
    if (loading) return;
    
    if (!loginInfo?.accessToken) {
      notifications.show({
        title: '错误',
        message: '请先登录',
        color: 'red',
      });
      return;
    }

    if (!requirement) {
      notifications.show({
        title: '提示',
        message: '需求为空',
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
      const promptText = `你是一个后端架构师和 Mock 数据专家。
下面是一个页面的 UI 结构树（不是 HTML）。

你的任务：
1. 推断该页面涉及的【领域实体】
2. 推断每个实体的字段、类型、是否必填
3. 推断页面涉及的操作（查询 / 新增 / 编辑 / 删除）
4. 设计标准 RESTful API（资源名 + HTTP 方法）
5. 为每个 API 生成完整的 TypeScript 类型定义
6. 为每个 API 生成真实、合理的 Mock 数据

输出要求：
- 使用 TypeScript 语法
- 所有内容生成在一个完整的 .ts 文件中
- 文件结构应包含：
  1. TypeScript 接口定义（请求/响应类型）
  2. RESTful API 路径和方法定义
  3. Mock 数据生成函数
  4. 导出所有内容供使用

约束：
- 严格遵循 RESTful 规范（GET/POST/PUT/DELETE）
- 不要发明 UI 中不存在的字段
- Mock 数据必须真实、合理、符合业务场景
- 使用标准的分页、排序、筛选参数（如果需要）
- 添加必要的注释说明

示例输出格式：
\`\`\`typescript
// ==================== 类型定义 ====================
export interface User {
  id: number;
  name: string;
  email: string;
  // ...
}

// ==================== API 定义 ====================
export const API_ENDPOINTS = {
  // GET /api/users - 获取用户列表
  getUsers: { method: 'GET', path: '/api/users' },
  // POST /api/users - 创建用户
  createUser: { method: 'POST', path: '/api/users' },
  // ...
};

// ==================== Mock 数据 ====================
export const mockUsers: User[] = [
  { id: 1, name: '张三', email: 'zhangsan@example.com' },
  // ...
];

export function getMockUserList() {
  return { data: mockUsers, total: mockUsers.length };
}
\`\`\`

## UI 结构树：
${JSON.stringify(requirement)}

请直接输出完整的 TypeScript 代码文件。`;


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
            code: '',
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
              console.log(streamUnifiedChatResponse.text);
              setText((text) => {
                return text + streamUnifiedChatResponse.text;
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
    changeMockCode: changeCode,
    loadingMock: loading,
    statusMock: status,
    textMock: text
  }
}  