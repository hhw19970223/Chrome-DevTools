import { useEffect, useMemo, useRef, useState } from "react";
import LineLoading from "../loading";
import XMarkdown from "@ant-design/x-markdown";
import { useLoginStore } from "@/panel/hooks/useLoginStore";
import { useTranslationToChinese } from "@/panel/hooks/useTranslationToChinese";
export function DiscordChatItem({
  htmlString,
  cacheMap,
}: {
  htmlString: string;
  cacheMap: Map<string, string>;
  language: string;
  prompt: string;
}) {
  const [translation, setTranslation] = useState<string>("");
  const { changeTranslation, loading } = useTranslationToChinese();
  const onClose = useRef<(() => void) | null>(null);
  const { loginInfo } = useLoginStore();

  const textContent = useMemo(() => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlString, "text/html");

    const text = doc.body.querySelector(
      '[id*="message-content-"]'
    )?.textContent;

  return text?.trim() || "";
}, [htmlString]);

// 监听元素是否在可视区域内
const containerRef = useRef<HTMLDivElement>(null);
const [isVisible, setIsVisible] = useState(false);

useEffect(() => {
  const element = containerRef.current;
  if (!element) return;

  const observer = new IntersectionObserver(
    ([entry]) => {
      setIsVisible(entry.isIntersecting);
    },
  );

  observer.observe(element);

  return () => {
    observer.disconnect();
  };
}, []);


  useEffect(() => {
    if (textContent && !translation && loginInfo?.accessToken && isVisible) {
      const _translation = cacheMap.get(textContent);
      if (_translation) {
        setTranslation(_translation);
      }

      changeTranslation(
        textContent,
        (code) => {
          setTranslation(() => {
            return code;
          });

          cacheMap.set(textContent, code);
        },
        (_onClose) => {
          onClose.current = _onClose;
        }
      );
    }
  }, [textContent, translation, changeTranslation, loginInfo?.accessToken, isVisible]);

  useEffect(() => {
    return () => {
      onClose.current?.();
    };
  }, [onClose.current]);

  return (
    <div ref={containerRef} className="flex flex-col gap-2 bg-black/5 rounded-lg">
      <div className="flex flex-col gap-2 relative py-[2px] pl-[72px] pr-[24px] [&_[class*='messageContent']]:!mt-2 [&_[class*='timestampVisibleOnHover']]:!hidden">
        <div dangerouslySetInnerHTML={{ __html: htmlString }}></div>
      </div>
      {textContent ? (
        <div className="flex flex-col px-2">
          <div className="h-px bg-black/15 min-h-px w-full"></div>
          <div className="flex gap-2 flex-col p-2 text-xs text-black/45">
            <XMarkdown content={translation} />
            {loading ? (
              <div className="mt-4">
                <LineLoading color="black" />
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
