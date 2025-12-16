import Frame from "react-frame-component";
import { useRef, useState } from "react";

export function Output({ code }: { code: string }) {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [_iframeDocument, setIframeDocument] = useState<Document | null>(null);
  const handleMount = () => {
    const iframe = frameRef.current;
    if (!iframe?.contentWindow) return;

    if (iframe.contentDocument) {
      setIframeDocument(iframe.contentDocument);
    }
  };

  const handleUpdate = () => {};

  return (
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