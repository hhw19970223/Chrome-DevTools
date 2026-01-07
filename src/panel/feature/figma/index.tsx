import { useDevToolsBridge } from "@/panel/hooks/useDevToolsBridge";
import { MESSAGE_TYPES } from "@/utils";
import { useEffect, useRef, useState } from "react";
import { Text, ActionIcon, Tooltip } from "@mantine/core";
import { IconLighter, IconSparkles } from "@tabler/icons-react";
import Split from "react-split";
import { Output } from "./output";
import { MonacoEditor } from "./monaco-editor";
import { useChangeCode } from "@/panel/hooks/useChangeCode";
import { useLoginStore } from "@/panel/hooks/useLoginStore";
import { LineBreak } from "@/panel/components/line-break";
import Loading from "@/panel/components/loading";
import { useChangeMockCode } from "@/panel/hooks/useChangeMockCode";

export function Figma() {
  const [isDev, setIsDev] = useState<boolean>(false);
  const { onMessage, offMessage, getWindowProperty } = useDevToolsBridge();
  const [code, setCode] = useState("");
  const [ast, setAst] = useState<any>(null);
  const [isReact, setIsReact] = useState(false);
  const { loginInfo } = useLoginStore();
  const { changeCode, loading, text } = useChangeCode();
  const { changeMockCode, loadingMock, textMock } = useChangeMockCode();
  const onClose = useRef<(() => void) | null>(null);
  const onCloseMock = useRef<(() => void) | null>(null);
  const [mock, setMock] = useState('');

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
          onCloseMock.current?.();
          onCloseMock.current = null;
          setCode(payload.html);
          setAst(payload.ast);
          setIsReact(false);
          setMock('');
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
        sizes={[5, 5, 95]} // 初始宽度比例
        minSize={5} // 每个面板最小宽度
        gutterSize={8} // 拖动条宽度
        style={{ display: "flex", height: "100%", width: "100%" }}
      >
        <div className="h-full w-full overflow-hidden relative max-w-full max-h-full">
          <MonacoEditor
            language={"typescript"}
            content={mock}
            onChange={(value) => {
              setMock(value || "");
            }}
            theme="vs"
          />
        </div>
        <div className="h-full w-full overflow-hidden relative max-w-full max-h-full">
          <MonacoEditor
            language={isReact ? "typescript" : "html"}
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
        {
          <Tooltip label={ loadingMock ? <div className="flex flex-col gap-4 px-4 py-2 pb-4">
            <div>
              <LineBreak text={textMock} />
            </div>
            <div className="flex justify-end px-4">
              <Loading />
            </div>
          </div> : "分析生成mock数据" } position="left" opened={ loadingMock ? true : undefined }>
            <ActionIcon
              size="lg"
              variant="filled"
              color="grape"
              radius="xl"
              disabled={loadingMock}
              onClick={() => {
                changeMockCode(ast, (newCode) => {
                  setMock(newCode);
                }, (_onClose) => {
                  onCloseMock.current = _onClose;
                });
              }}
            >
              <IconLighter size={18} />
            </ActionIcon>
          </Tooltip>
        }

        {
          isReact ? null : <Tooltip label={ loading ? <div className="flex flex-col gap-4 px-4 py-2 pb-4">
            <div>
              <LineBreak text={text} />
            </div>
            <div className="flex justify-end px-4">
              <Loading />
            </div>
          </div> : "生成可用代码" } position="left" opened={ loading ? true : undefined }>
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
        }
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
