import { Bubble, Think } from "@ant-design/x";
import LineLoading from "../loading";
import XMarkdown from "@ant-design/x-markdown";
import { useEffect, useRef } from "react";
import { Editor } from "@monaco-editor/react";

export function Chat({
  text,
  thinkingText,
  loading,
  md,
  json,
}: {
  text: string;
  thinkingText: string;
  loading: boolean;
  md?: string;
  json?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [text, thinkingText, md, json]);

  return (
    <div
      ref={containerRef}
      className="flex flex-col gap-4 overflow-auto p-4 py-6 max-h-full [&_.monaco-editor]:!h-[500px]"
    >
      {thinkingText ? (
        <Think
          title={"deep thinking"}
          blink
          loading={loading && !text}
          className="text-sm"
        >
          <XMarkdown content={thinkingText} />
        </Think>
      ) : null}

      {text ? <Bubble content={<XMarkdown content={text} />} /> : null}

      {md ? <Bubble content={<XMarkdown content={md} />} /> : null}

      {json ? (
        <Editor
          height="500px"
          defaultLanguage={"json"}
          defaultValue={json}
          theme="vs-dark"
          loading={<span></span>}
          options={{
            minimap: { enabled: false },
            readOnly: true
          }}
        />
      ) : null}

      {loading ? (
        <div className="mt-4">
          <LineLoading color="black" />
        </div>
      ) : null}
    </div>
  );
}
