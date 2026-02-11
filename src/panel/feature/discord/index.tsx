import { useDevToolsBridge } from "@/panel/hooks/useDevToolsBridge";
import { MESSAGE_TYPES } from "@/utils";
import { useEffect, useRef, useState } from "react";
import Split from "react-split";
import { TextInput } from "@mantine/core";
import { MonacoEditor } from "../figma/monaco-editor";
import { DiscordChat } from "@/panel/components/discord-chat";
import { useLoginStore } from "@/panel/hooks/useLoginStore";
import { SendChat } from "@/panel/components/discord-chat/SendChat";
import { StorageUtil } from "@/utils/storage";

const DISCORD_PROMPT_CACHE_KEY = 'discord_prompt_cache';
const DEFAULT_PROMPT = `请帮我根据海外用户的表达习惯以及用户的聊天习惯，自动调整并且翻译。`;

export function Discord() {
  const { onMessage, offMessage, evalInWindow } = useDevToolsBridge();
  const [language, setLanguage] = useState('');
  const [authorization, setAuthorization] = useState('');
  const [prompt, setPrompt] = useState(DEFAULT_PROMPT);
  const cache = useRef<Map<string, string>>(new Map());//翻译的内容缓存
  const [scrollerInnerDoms, setScrollerInnerDoms] = useState<string[]>([]);
  const { loginInfo } = useLoginStore();

  // 初始化时从 chrome.storage 获取缓存的 prompt
  useEffect(() => {
    StorageUtil.get<string>(DISCORD_PROMPT_CACHE_KEY).then((cachedPrompt) => {
      if (cachedPrompt) {
        setPrompt(cachedPrompt);
      }
    });
  }, []);

  // 当 prompt 变化时，保存到 chrome.storage
  useEffect(() => {
    StorageUtil.set(DISCORD_PROMPT_CACHE_KEY, prompt);
  }, [prompt]);

  useEffect(() => {

    evalInWindow?.("window.hhw.discordCtrl.captureCSSStylesheets");
    evalInWindow?.("window.hhw.discordCtrl.getChatList");
    evalInWindow?.("window.hhw.discordCtrl.getAuthorization");

    onMessage(MESSAGE_TYPES.DISCORD, (payload) => {
      if (payload.htmlStrings) {
        setScrollerInnerDoms(payload.htmlStrings);
      }

      if (payload.authorization) {
        setAuthorization(payload.authorization);
      }

      if (payload.links) {
        // 判断每个link是否已经加载过，未加载的加入head进行加载
        payload.links.forEach((linkHref: string) => {
          // 检查该link是否已经存在于head中
          const existingLink = document.head.querySelector(`link[href="${linkHref}"]`);
          
          if (!existingLink) {
            // 如果不存在，创建新的link元素并添加到head
            const linkElement = document.createElement('link');
            linkElement.rel = 'stylesheet';
            linkElement.href = linkHref;
            document.head.appendChild(linkElement);
          }
        });
      }
    });
    return () => {
      offMessage(MESSAGE_TYPES.DISCORD);
    };
  }, []);


  return !loginInfo?.accessToken ? <div>请先登录cursor账号</div> :<div className="h-[calc(100vh-90px)] relative flex flex-col overflow-hidden">
  <div className="flex gap-4 p-4 bg-gray-50 border-b">
    <TextInput
      placeholder="请输入翻译的语言, (不输入使用用户语言)"
      className="!w-[350px]"
      value={language}
      onChange={(e) => { setLanguage(e.target.value) }}
    />
  </div>
  <Split
    sizes={[0, 100, 0]} // 初始宽度比例
    minSize={5} // 每个面板最小宽度
    gutterSize={8} // 拖动条宽度
    style={{ display: "flex", flex: "1 1 0%", overflow: "hidden" }}
  >
  <div className="h-full w-full overflow-hidden relative max-w-full max-h-full">
    <DiscordChat scrollerInnerDoms={scrollerInnerDoms} cacheMap={cache.current} language={language} prompt={prompt} />
  </div>
  <div className="h-full w-full overflow-hidden relative max-w-full max-h-full">
    <SendChat authorization={authorization} language={language} prompt={prompt} />
  </div>
  <div className="h-full w-full overflow-hidden relative max-w-full max-h-full">
    <MonacoEditor language="md" content={prompt} onChange={setPrompt} /> 
  </div>
</Split></div>;
}
