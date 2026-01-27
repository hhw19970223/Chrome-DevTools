import { useRef, useEffect } from 'react';

import Editor from '@monaco-editor/react';
import { editor } from 'monaco-editor';

// 导入配置，确保使用本地 monaco-editor 而不是 CDN
import './config';

interface Props {
  language: string
  content: string,
  onChange: (value: string) => void,
  theme?: 'light' | 'vs-dark'
}
export function MonacoEditor({language, content, onChange, theme = 'vs-dark'}: Props) {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<any>(null);

  // 组件卸载时销毁编辑器实例，这会自动清理相关的 worker 进程
  useEffect(() => {
    return () => {
      if (editorRef.current) {
        editorRef.current.dispose();
        editorRef.current = null;
      }
    };
  }, []);

  return (
    <Editor
      height="100%"
      defaultLanguage={ language }
      value={ content }
      onMount={(editor) => {
        editorRef.current = editor;
      }}
      className=''
      onChange={(value) => {
        onChange(value || '')
      }}
      theme={theme}
      loading={<span></span>}
      options={{
        minimap: { enabled: false },
      }}
      beforeMount={(monacoInstance) => {
        console.log(monacoInstance.languages.getLanguages());
        monacoRef.current = monacoInstance;
      }}
    />
  );
}