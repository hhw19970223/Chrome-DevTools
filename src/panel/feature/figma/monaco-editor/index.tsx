import { useRef } from 'react';

import Editor from '@monaco-editor/react';
import { editor } from 'monaco-editor';

// 导入配置，确保使用本地 monaco-editor 而不是 CDN
import './config';

interface Props {
  language: string
  content: string,
  onChange: (value?: string) => void
}
export function MonacoEditor({language, content, onChange}: Props) {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<any>(null);

  return (
    <Editor
      height="100%"
      defaultLanguage={ language }
      value={ content }
      onMount={(editor) => {
        editorRef.current = editor;
      }}
      className=''
      onChange={onChange}
      theme={'vs-dark'}
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