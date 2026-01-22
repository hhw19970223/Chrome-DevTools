import { useDevToolsBridge } from "@/panel/hooks/useDevToolsBridge";
import { MESSAGE_TYPES } from "@/utils";
import { useEffect, useState } from "react";
import { Text } from "@mantine/core";

export function FigmaTest() {
  const [isDev, setIsDev] = useState<boolean>(false);
  const { onMessage, offMessage, getWindowProperty } = useDevToolsBridge();

  useEffect(() => {
    getWindowProperty?.("figma").then((res) => {
      setIsDev(!!res);
    });

    onMessage(MESSAGE_TYPES.FIGMA, (payload) => {
      if ("isDev" in payload) {
        setIsDev(payload.isDev);
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
      <Text>Figma测试用例</Text>
    </div>
  ) : (
    <div>
      <Text c="red" size="lg">
        未开启Figma调试模式
      </Text>
    </div>
  );
}
