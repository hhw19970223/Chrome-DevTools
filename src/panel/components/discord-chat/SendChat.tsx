import { useEffect, useRef, useState } from "react";
import { Textarea, ActionIcon } from "@mantine/core";
import { IconSend } from "@tabler/icons-react";
import { Notifications } from "@mantine/notifications";
import { useTranslation } from "@/panel/hooks/useTranslation";
import { Actions, Bubble, Think } from "@ant-design/x";
import XMarkdown from "@ant-design/x-markdown";
import LineLoading from "../loading";

export function SendChat({
  authorization,
  language,
  prompt,
}: {
  authorization: string;
  language: string;
  prompt: string;
}) {
  const [messages, setMessages] = useState<
    {
      text: string;
      value: string;
      thinkingText: string;
      loading: boolean;
      md?: string;
    }[]
  >([]);
  const [inputValue, setInputValue] = useState("");
  const [isSending, setIsSending] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const onClose = useRef<(() => void) | null>(null);
  const { changeTranslation, loading } = useTranslation();
  const [_currentMessage, setCurrentMessage] = useState<{
    text: string;
    value: string;
    thinkingText: string;
    loading: boolean;
    md?: string;
  }[] | null>(null);

  useEffect(() => {
    return () => {
      onClose.current?.();
    };
  }, []);

  useEffect(() => {
    setTimeout(() => {
      if (containerRef.current) {
        containerRef.current.scrollTo({
          top: containerRef.current.scrollHeight,
          behavior: "smooth",
        });
      }
    }, 500);
  }, [messages]);

  const handleSend = async () => {
    if (!inputValue.trim() || isSending) return;

    setIsSending(true);
    try {
      // TODO: 在这里添加发送消息的逻辑
      console.log("发送消息:", inputValue);
      console.log("Authorization:", authorization);

      // 从当前页面的URL中获取channelId
      // 例如: https://discord.com/channels/@me/1468063254436909244
      const getChannelId = (): Promise<string | null> => {
        return new Promise((resolve) => {
          chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            const currentTab = tabs[0];
            if (currentTab?.url) {
              const match = currentTab.url.match(/\/channels\/[^\/]+\/(\d+)/);
              resolve(match ? match[1] : null);
            } else {
              resolve(null);
            }
          });
        });
      };

      const channelId = await getChannelId();

      if (!channelId) {
        throw new Error("无法获取 Channel ID");
      }

      console.log("Channel ID:", channelId);

      const resUser = await fetch(
        `https://discord.com/api/v9/channels/${channelId}`,
        { headers: { authorization: authorization } }
      ).then((res) => res.json());
      const res = await fetch(
        `https://discord.com/api/v9/channels/${channelId}/messages?limit=30`,
        { headers: { authorization: authorization } }
      ).then((res) => res.json());

      const userId = resUser.recipients?.[0]?.id;

      const data = res.map((item: any) => {
        const isMe = item.author.id !== userId;
        return `${isMe ? "我" : "用户"}: ${item.content}`;
      });

      setCurrentMessage(() => {
        const info = {
          text: "",
          value: inputValue,
          thinkingText: "",
          loading: true,
          md: "",
        };
        setMessages((messages) => {
          return [...messages, info];
        });
        return [info];
      });

      changeTranslation(
        inputValue,
        language,
        prompt,
        data,
        (code) => {
          setCurrentMessage((currentMessage) => {
            if (currentMessage?.[0]) {
              currentMessage[0].md = code;
            }
            return currentMessage ? [...currentMessage] : null;
          });
          setMessages((messages) => {
            return [...messages];
          });
        },
        (_onClose) => {
          onClose.current = _onClose;
        },
        (text: string, thinkingText: string) => {
          setCurrentMessage((currentMessage) => {
            if (currentMessage?.[0]) {
              if (text) {
                currentMessage[0].text = text;
              }
              if (thinkingText) {
                currentMessage[0].thinkingText = thinkingText;
              }
            }

            return currentMessage ? [ ...currentMessage ] : null;
          });
          setMessages((messages) => {
            console.log('messages', messages);
            return [...messages];
          });
        },
        () => {
          setInputValue("");
        }
      );
    } catch (error) {
      console.error("发送失败:", error);
      Notifications.show({
        title: "发送失败",
        message: "发送失败",
        color: "red",
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  useEffect(() => {
    if (!loading) {
      setMessages((messages) => {
        return messages.map((item) => ({ ...item, loading: false }));
      });
      setCurrentMessage(null);
    }
  }, [loading]);

  const actionItems = (content: string) => [
    {
      key: 'copy',
      label: 'copy',
      actionRender: () => {
        return <Actions.Copy text={content} />;
      },
    }
  ];

  return (
    <div className="flex flex-col gap-4 overflow-hidden h-full max-h-full w-full px-4">
      <div
        ref={containerRef}
        className="flex flex-col gap-4 overflow-auto p-4 py-2 max-h-full flex-1"
      >
        {messages.map((item, index) => (
          <div
            key={index}
            className="flex flex-col gap-2 bg-black/5 rounded-lg w-[80%] p-6"
          >
            <Bubble content={<XMarkdown content={item.value} />} />
            {item.thinkingText ? (
              <Think
                title={"deep thinking"}
                blink
                loading={loading && !item.text}
                className="text-sm"
              >
                <XMarkdown content={item.thinkingText} />
              </Think>
            ) : null}

            {item.text ? (
              <Bubble content={<XMarkdown content={item.text} />} />
            ) : null}

            {item.md ? (
              <Bubble content={<XMarkdown content={item.md} />}  footer={() => (
                <Actions items={actionItems(item.md!)} onClick={() => navigator.clipboard.writeText(item.md!)} />
              )} />
            ) : null}

            {item.loading ? (
              <div className="mt-4">
                <LineLoading color="black" />
              </div>
            ) : null}
          </div>
        ))}
      </div>
      <div className="h-px bg-black/15 min-h-px w-full"></div>
      <div className="flex items-center gap-2">
        <Textarea
          value={inputValue}
          onChange={(e) => setInputValue(e.currentTarget.value)}
          onKeyDown={handleKeyDown}
          placeholder="请输入翻译内容"
          autosize
          minRows={1}
          maxRows={6}
          disabled={isSending || loading}
          className="flex-1"
          styles={{
            input: {
              fontSize: "14px",
              borderRadius: "12px",
            },
          }}
        />
        <ActionIcon
          onClick={handleSend}
          disabled={!inputValue.trim() || isSending || loading || !authorization}
          loading={isSending || loading}
          size="lg"
          radius="xl"
          variant="filled"
          color="blue"
          aria-label="发送消息"
        >
          <IconSend size={20} />
        </ActionIcon>
      </div>
    </div>
  );
}
