import { DiffEditor } from "@monaco-editor/react";

// 导入配置，确保使用本地 monaco-editor 而不是 CDN
import './config';

interface Props {
  language: string;
  originalCode: string;
  modifiedCode: string;
}
export function MonacoDiffEditor({ language, originalCode, modifiedCode }: Props) {

  return (
    <DiffEditor
      height="100%"
      original={originalCode}
      modified={modifiedCode}
      language={language}
      theme="vs-dark"
      options={{
        renderSideBySide: false, // false 表示上下显示，true 表示左右显示
        readOnly: true,          // 只读模式
      }}
    />
  );
}
