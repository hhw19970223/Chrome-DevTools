import { useDevToolsBridge } from "@/panel/hooks/useDevToolsBridge";
import { MESSAGE_TYPES } from "@/utils";
import { useEffect, useState } from "react";
import { Card, Stack, Text } from "@mantine/core";
import Split from "react-split";
import { Output } from "./output";
import { MonacoEditor } from "./monaco-editor";

export function Figma() {
  const [isDev, setIsDev] = useState<boolean>(false);
  const { onMessage, offMessage, getWindowProperty } = useDevToolsBridge();
  const [html, setHtml] = useState("");

  useEffect(() => {
    getWindowProperty?.("figma").then((res) => {
      setIsDev(!!res);
    });

    onMessage(MESSAGE_TYPES.FIGMA, (payload) => {
      if ("isDev" in payload) {
        setIsDev(payload.isDev);
      }

      if ("selected" in payload) {
        if (payload.selected) {
          setHtml(payload.html);
        }
      }
    });
    return () => {
      offMessage(MESSAGE_TYPES.FIGMA);
    };
  }, []);

  useEffect(() => {
    console.log(isDev);
  }, [isDev]);

  return isDev ? (
    <div className="h-[calc(100vh-90px)]">
      <Split
        sizes={[50, 50]} // 初始宽度比例
        minSize={5} // 每个面板最小宽度
        gutterSize={8} // 拖动条宽度
        style={{ display: "flex", height: "100%", width: "100%" }}
      >
        <div className="h-full w-full overflow-hidden relative max-w-full max-h-full">
          <MonacoEditor
            language={"html"}
            content={html}
            onChange={(value) => {
              setHtml(value || "");
            }}
          />
        </div>
        <div className="w-full h-full max-h-full overflow-hidden relative bg-[rgba(0,0,0,0.02)]">
          <div className="w-full h-full">
            <Output code={html} />
          </div>
        </div>
      </Split>
    </div>
  ) : (
    <div>
      <Text c="red" size="lg">
        未开启Figma调试模式
      </Text>
    </div>
  );
}
