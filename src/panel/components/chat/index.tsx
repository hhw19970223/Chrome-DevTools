import { Bubble, Think } from "@ant-design/x";
import LineLoading from "../loading";
import XMarkdown from "@ant-design/x-markdown";
import { useEffect, useRef, useState } from "react";
import { Editor } from "@monaco-editor/react";
import type { editor as MonacoEditor } from "monaco-editor";

export function Chat({
  text,
  thinkingText,
  loading,
  md,
  json,
  setMd,
}: {
  text: string;
  thinkingText: string;
  loading: boolean;
  md?: string;
  json?: string;
  setMd?: (md: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const editorRef = useRef<MonacoEditor.IStandaloneCodeEditor | null>(null);

  useEffect(() => {
    setTimeout(() => {
      if (containerRef.current) {
        containerRef.current.scrollTo({
          top: containerRef.current.scrollHeight,
          behavior: "smooth",
        });
      }
    }, 500);
  }, [text, thinkingText, md, json]);

  const handleDoubleClick = () => {
    setIsEditing(true);
  };

  const handleBlur = () => {
    setIsEditing(false);
  };

  const handleEditorMount = (editor: MonacoEditor.IStandaloneCodeEditor) => {
    editorRef.current = editor;
    // 监听编辑器失焦事件
    editor.onDidBlurEditorText(() => {
      handleBlur();
    });
  };

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

      {md ? (
        isEditing ? (
          <Editor
            value={md}
            height="500px"
            defaultLanguage={"md"}
            onChange={(value) => setMd?.(value || "")}
            defaultValue={json}
            theme="vs-dark"
            loading={<span></span>}
            onMount={handleEditorMount}
            options={{
              minimap: { enabled: false },
            }}
          />
        ) : (
          <div onDoubleClick={handleDoubleClick} className="cursor-pointer">
            <Bubble content={<XMarkdown content={md} />} />
          </div>
        )
      ) : null}

      {json ? (
        <Editor
          height="500px"
          defaultLanguage={"json"}
          defaultValue={json}
          theme="vs-dark"
          loading={<span></span>}
          options={{
            minimap: { enabled: false },
            readOnly: true,
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
