import { useEffect, useRef } from "react";
import { DiscordChatItem } from "./item";
export function DiscordChat({ 
  scrollerInnerDoms, 
  cacheMap, 
  language,
  prompt
}: { 
  scrollerInnerDoms: string[]; 
  cacheMap: Map<string, string>;
  language: string;
  prompt: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setTimeout(() => {
      if (containerRef.current) {
        containerRef.current.scrollTo({
          top: containerRef.current.scrollHeight,
        });
      }
    }, 1000);
  }, [scrollerInnerDoms.length]);

  return (
    <div
      ref={containerRef}
      className="flex flex-col gap-4 overflow-auto p-4 py-6 max-h-full [&_.monaco-editor]:!h-[500px]"
    >
      {
        scrollerInnerDoms.map((htmlString) => {
          return <div key={htmlString}>
            <DiscordChatItem htmlString={htmlString} cacheMap={cacheMap} language={language} prompt={prompt} />
          </div>
        })
      }
    </div>
  );
}