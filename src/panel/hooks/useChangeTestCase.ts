import { useCallback, useMemo, useState } from "react";
import { useLoginStore } from "./useLoginStore";
import { v4 } from "uuid";
import { traceparent } from "@/utils/cursor";
import { notifications } from "@mantine/notifications";
import { host } from "../const";

export function useChangeTestCase() {
  const { loginInfo } = useLoginStore();

  const [status, setStatus] = useState<
  "submitted" | "streaming" | "ready" | "error"
>("ready");

  const [text, setText] = useState<string>("");
  const [thinkingText, setThinkingText] = useState<string>("");
  
  const loading = useMemo(() => status === "streaming", [status]);

  const changeTestCase = useCallback(async (requirement: any, onChange: (code: string) => void, setOnClose: (onClose: () => void) => void, onError: () => void) => {
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

    if (!requirement) {
      notifications.show({
        title: '提示',
        message: '数据为空',
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

      // 生成测试用例的提示词
      const promptText = `
# 任务说明
现在需要你根据这些需求生成对应的测试用例

# 需求内容
${requirement}

# 要求
1. 先罗列出所有模块的功能点
2. 然后为每个功能点生成对应的正向测试用例和反向测试用例
3. 每个测试用例必须包含以下字段：
   - **功能模块**：所属的功能模块名称
   - **一级菜单**：所属的一级菜单名称
   - **前提**：执行测试用例的前置条件
   - **功能说明**：该功能的详细说明
   - **测试内容**：具体的测试步骤
   - **预期结果**：预期的测试结果
   - **优先级**：测试用例的优先级（P0/P1/P2）
4. 必须同时生成正向用例（正常流程）和反向用例（异常流程、边界条件）
5. 生成json数据


# 注意事项
- 生成必须是有效的JSON格式，不要有任何额外的文字说明
- 正向用例要覆盖主要业务流程
- 反向用例要覆盖异常情况、边界条件、输入验证等
- 优先级设置：P0为核心功能，P1为重要功能，P2为一般功能
- 测试内容要清晰具体，可操作性强
- 预期结果要明确，便于验证

# 生成json数据
1. 必须严格按照json格式进行输出,值里出现"等符合影响json格式请使用转义符
2. **重要：请严格按照以下JSON格式，不要包含任何其他文字说明：**
3. 生成在 @index.json

{
  "modules": [
    {
      "moduleName": "一级模块名称",
      "functionPoints": [
        {
          "pointName": "功能点名称",
          "description": "功能点描述",
          "testCases": {
            "positive": [
              {
                "功能模块": "模块名称",
                "一级菜单": "菜单名称",
                "前提": "前置条件",
                "功能说明": "功能详细说明",
                "测试内容": "具体测试步骤",
                "预期结果": "预期的测试结果",
                "优先级": "P0"
              }
            ],
            "negative": [
              {
                "功能模块": "模块名称",
                "一级菜单": "菜单名称",
                "前提": "前置条件",
                "功能说明": "功能详细说明",
                "测试内容": "异常场景测试步骤",
                "预期结果": "预期的错误提示或处理",
                "优先级": "P1"
              }
            ]
          }
        }
      ]
    }
  ]
}
`;


      try {
        await fetch(host + "/api/cursor/chat", {
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
            json: '{}'
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
      fetch(host + "/api/cursor/chat", {
        method: "DELETE",
        body: JSON.stringify({
          composerId
        }),
      })
    }
  }, [loading, loginInfo]);

  return {
    changeTestCase,
    loading,
    status,
    text,
    thinkingText,
  }
}  