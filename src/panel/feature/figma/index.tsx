import { useDevToolsBridge } from "@/panel/hooks/useDevToolsBridge";
import { MESSAGE_TYPES } from "@/utils";
import { useEffect, useRef, useState } from "react";
import { Text, ActionIcon, Tooltip } from "@mantine/core";
import { IconSparkles } from "@tabler/icons-react";
import Split from "react-split";
import { Output } from "./output";
import { MonacoEditor } from "./monaco-editor";
import { useChangeCode } from "@/panel/hooks/useChangeCode";
import { useLoginStore } from "@/panel/hooks/useLoginStore";

export function Figma() {
  const [isDev, setIsDev] = useState<boolean>(false);
  const { onMessage, offMessage, getWindowProperty } = useDevToolsBridge();
  const [code, setCode] = useState("");
  const [isReact, setIsReact] = useState(false);
  const { loginInfo } = useLoginStore();
  const { changeCode, loading } = useChangeCode();
  const onClose = useRef<(() => void) | null>(null);

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
          onClose?.current?.();
          onClose.current = null;
          setCode(payload.html);
          setIsReact(false);
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
    <div className="h-[calc(100vh-90px)] relative">
      <Split
        sizes={[5, 95]} // 初始宽度比例
        minSize={5} // 每个面板最小宽度
        gutterSize={8} // 拖动条宽度
        style={{ display: "flex", height: "100%", width: "100%" }}
      >
        <div className="h-full w-full overflow-hidden relative max-w-full max-h-full">
          <MonacoEditor
            language={isReact ? "jsx" : "html"}
            content={code}
            onChange={(value) => {
              setCode(value || "");
            }}
          />
        </div>
        <div className="w-full h-full max-h-full overflow-hidden relative bg-[rgba(0,0,0,0.02)]">
          <div className="w-full h-full">
            <Output code={code} isReact={isReact} />
          </div>
        </div>
      </Split>
      
      {/* 右下角操作按钮组 */}
      { loginInfo ? <div
        style={{
          position: 'absolute',
          bottom: '16px',
          right: '16px',
          zIndex: 100,
          display: 'flex',
          gap: '8px',
          flexDirection: 'column',
        }}
      >
        <Tooltip label="生成可用代码" position="left">
          <ActionIcon
            size="lg"
            variant="filled"
            color="grape"
            radius="xl"
            disabled={loading}
            onClick={() => {
              changeCode(code, (newCode) => {
                setCode(newCode);
                setIsReact(true); // 切换到 React 模式
              }, (_onClose) => {
                onClose.current = _onClose;
              });
            }}
          >
            <IconSparkles size={18} />
          </ActionIcon>
        </Tooltip>
      </div>
      : null}
    </div>
  ) : (
    <div>
      <Text c="red" size="lg">
        未开启Figma调试模式
      </Text>
    </div>
  );
}
