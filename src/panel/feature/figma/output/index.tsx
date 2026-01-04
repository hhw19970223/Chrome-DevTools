import Frame from "react-frame-component";
import { useRef, useEffect, useState } from "react";

export function Output({ code, isReact }: { code: string; isReact: boolean }) {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const sandboxRef = useRef<HTMLIFrameElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  
  const handleMount = () => {
    // iframe 挂载完成后的回调
    const iframe = frameRef.current;
    if (!iframe?.contentWindow) return;
    // 可以在这里添加初始化逻辑
  };

  const handleUpdate = () => {
    // iframe 内容更新后的回调
  };

  // 监听来自沙箱的消息
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'ready') {
        setIsReady(true);
      } else if (event.data.type === 'error') {
        setError(event.data.error);
      } else if (event.data.type === 'success') {
        setError(null);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // 当代码变化时，发送消息到沙箱
  useEffect(() => {
    if (isReact && isReady && sandboxRef.current?.contentWindow && code) {
      setError(null);
      sandboxRef.current.contentWindow.postMessage({ code }, '*');
    }
  }, [code, isReact, isReady]);

  return isReact ? (
    <div className="w-full h-full overflow-auto border-none bg-white relative">
      {error && (
        <div className="absolute top-0 left-0 right-0 p-4 bg-red-50 text-red-600 z-10">
          <h3 className="font-bold mb-2">渲染错误</h3>
          <pre className="text-sm whitespace-pre-wrap">{error}</pre>
        </div>
      )}
      <iframe
        ref={sandboxRef}
        src={chrome.runtime.getURL('sandbox.html')}
        className="w-full h-full border-none"
        sandbox="allow-scripts"
      />
    </div>
  ) : (
    <Frame
      initialContent={code}
      className="w-full h-full overflow-auto border-none"
      ref={frameRef}
      contentDidMount={handleMount}
      mountTarget="body"
      contentDidUpdate={handleUpdate}
    >
      <></>
    </Frame>
  );
}