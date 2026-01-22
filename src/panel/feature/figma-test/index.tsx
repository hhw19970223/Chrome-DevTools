import { useDevToolsBridge } from "@/panel/hooks/useDevToolsBridge";
import { MESSAGE_TYPES } from "@/utils";
import { useEffect, useState } from "react";
import { Text } from "@mantine/core";
import Split from "react-split";
import { BinaryImage } from "@/panel/components/binary-image";

export function FigmaTest() {
  const [isDev, setIsDev] = useState<boolean>(false);
  const { onMessage, offMessage, getWindowProperty, evalInWindow } = useDevToolsBridge();
  const [project, setProject] = useState<any>(null);
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getWindowProperty?.("figma").then((res) => {
      setIsDev(!!res);
    });

    onMessage(MESSAGE_TYPES.FIGMA, (payload) => {
      if ("isDev" in payload) {
        setIsDev(payload.isDev);
      }

      if ("project" in payload) {
        setProject(payload.project);
        setStep(0);
        setLoading(false);
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
    <div className="h-[calc(100vh-90px)] relative flex flex-col overflow-hidden">
      <div className="flex gap-4 p-4 bg-gray-50 border-b">
        <button
          onClick={() => {
            setLoading(true);
            evalInWindow?.("window.hhw.figmaCtrl.getAllPages()")
          }}
          disabled={loading}
          className="px-3 py-1.5 text-sm font-medium bg-blue-500 text-white rounded-md hover:bg-blue-600 active:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-1.5 shadow-sm hover:shadow disabled:shadow-none"
        >
          {loading && (
            <svg className="animate-spin h-3.5 w-3.5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          )}
          {loading && !project ? "分析中..." : "开始分析"}
        </button>
        <button
          onClick={() => {
            setStep((prev) => prev + 1);
          }}
          disabled={loading || step >= 2 || !project}
          className="px-3 py-1.5 text-sm font-medium bg-green-500 text-white rounded-md hover:bg-green-600 active:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-1.5 shadow-sm hover:shadow disabled:shadow-none"
        >
          {loading && (
            <svg className="animate-spin h-3.5 w-3.5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          )}
          { !project ? "下一步" : step === 0 ? "分析图片总结需求" : step === 1 ? "生成测试用例" : "完成"}
        </button>
      </div>
      <Split
        sizes={[33, 33, 34]} // 初始宽度比例
        minSize={5} // 每个面板最小宽度
        gutterSize={8} // 拖动条宽度
        style={{ display: "flex", height: "100%", width: "100%" }}
      >
        <div className="h-full w-full overflow-hidden relative max-w-full max-h-full">
          <div className="overflow-auto h-full w-full flex flex-col gap-4 p-4">
            {project?.images?.map((image: any) => (
              <div key={image.uuid} className="flex items-center gap-2 flex-col border rounded-lg p-4 bg-white shadow-sm">
                <span className="text-sm font-medium text-gray-700">{image.filename}</span>
                <BinaryImage 
                  data={image.data} 
                  filename={image.filename}
                  alt={image.name || image.filename}
                  className="max-w-full h-auto object-contain rounded"
                />
              </div>
            ))}
          </div>
        </div>
        <div className="h-full w-full overflow-hidden relative max-w-full max-h-full">
         
        </div>
        <div className="h-full w-full overflow-hidden relative max-w-full max-h-full">
          
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
