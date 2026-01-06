import { useCallback, useEffect, useMemo, useState } from "react";
import { useLoginStore } from "./useLoginStore";
import { v4 } from "uuid";
import { traceparent } from "@/utils/cursor";
import { notifications } from "@mantine/notifications";

export function useChangeJavaCode() {
  const { loginInfo } = useLoginStore();

  const [status, setStatus] = useState<
  "submitted" | "streaming" | "ready" | "error"
>("ready");

  const [text, setText] = useState<string>("");
  
  const loading = useMemo(() => status === "streaming", [status]);

  const changeCode = useCallback(async (reactComponentCode: string, onChange: (code: string) => void, setOnClose: (onClose: () => void) => void) => {
    if (loading) return;
    
    if (!loginInfo?.accessToken) {
      notifications.show({
        title: '错误',
        message: '请先登录',
        color: 'red',
      });
      return;
    }

    if (!reactComponentCode || reactComponentCode.trim() === '') {
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
      const promptText = `请分析以下 React + Tailwind CSS 组件代码，并完成以下任务：

      ## 分析要求：
      
      1. **页面模块拆分**：
         - 识别页面中的主要功能模块（如：用户信息展示、数据列表、表单提交、搜索筛选等）
         - 分析每个模块的业务功能和职责
         - 识别模块之间的数据依赖关系
         - 列出每个模块的核心功能点
      
      2. **数据源分析**：
         - 识别所有需要动态获取的数据（如：列表数据、详情数据、统计数据等）
         - 区分哪些是前端本地状态，哪些需要服务端接口
         - 分析数据的增删改查（CRUD）操作需求
         - 识别数据的关联关系和依赖关系
         - 标注数据的必填性、数据类型、验证规则
      
      3. **接口设计规范**：
         - 遵循 RESTful API 设计原则
         - 使用标准 HTTP 方法（GET、POST、PUT、DELETE、PATCH）
         - 采用合理的资源命名和 URL 结构
         - 统一的响应格式（包含 code、message、data）
         - 合理的状态码使用（200、201、400、404、500 等）
      
      4. **Java 接口生成要求**：
         - 使用 Spring Boot + Spring MVC 框架
         - Controller 层：定义 RESTful 接口，使用 @RestController、@RequestMapping 等注解
         - Service 层：定义业务逻辑接口
         - Entity/DTO 层：定义数据实体和数据传输对象
         - 添加必要的参数验证注解（@Valid、@NotNull、@NotBlank 等）
         - 添加 Swagger/OpenAPI 文档注解（@Api、@ApiOperation 等）
      
      5. **代码结构**：
         - 为每个模块生成独立的 Controller
         - 定义清晰的请求参数类（DTO/VO）
         - 定义统一的响应结果类（Result<T>）
         - 添加必要的注释说明接口用途和参数
         - 遵循 Java 命名规范和代码格式
      
      6. **安全和性能考虑**：
         - 标注需要权限控制的接口
         - 建议分页的接口添加分页参数
         - 标注需要缓存的接口
         - 标注需要事务处理的操作
      
      ## 输出格式：
      
      ### 第一部分：模块分析
      - 列出所有识别到的功能模块
      - 说明每个模块的作用和需要的数据
      
      ### 第二部分：接口清单
      - 列出所有需要的后端接口
      - 说明每个接口的用途、请求方法、URL、请求参数、响应数据
      
      ### 第三部分：Java 代码
      - 生成完整的 Java 后端代码
      - 包含 Controller、Service 接口、Entity/DTO 类
      - 代码应该可以直接在 Spring Boot 项目中使用
      - 使用 4 空格缩进，遵循 Java 代码规范
      
      不要添加任何额外的 markdown 代码块符号在 Java 代码部分。
      
      ## 前端组件代码：
      ${reactComponentCode}`;


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
            code: ''
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
    changeJavaCode: changeCode,
    loadingJava: loading,
    statusJava: status,
    textJava: text
  }
}  