import { Bubble, Think } from "@ant-design/x";
import LineLoading from "../loading";
import XMarkdown from "@ant-design/x-markdown";

export function Chat({text, thinkingText, loading, md}: {text: string, thinkingText: string, loading: boolean, md: string}) {
  return <div className="flex flex-col gap-4 overflow-auto p-4 py-6">
    {
      thinkingText ? <Think title={'deep thinking'} blink loading={loading && !text} className="text-sm"><XMarkdown content={thinkingText} /></Think> : null
    }

    {
      text ? <Bubble content={<XMarkdown content={text} />} /> : null
    }

    {
      md ? <Bubble content={<XMarkdown content={md} />} /> : null
    }

    { loading ? <div className="mt-4">
      <LineLoading color="black" />
    </div> : null }
  </div>
}