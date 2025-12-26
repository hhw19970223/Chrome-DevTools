import Frame from "react-frame-component";
import { useRef, useMemo } from "react";
import * as Babel from '@babel/standalone';
import React from 'react';

export function Output({ code, isReact }: { code: string; isReact: boolean }) {
  const frameRef = useRef<HTMLIFrameElement>(null);
  
  const handleMount = () => {
    // iframe 挂载完成后的回调
    const iframe = frameRef.current;
    if (!iframe?.contentWindow) return;
    // 可以在这里添加初始化逻辑
  };

  const handleUpdate = () => {
    // iframe 内容更新后的回调
  };

  // 使用 useMemo 缓存渲染结果，避免不必要的重新编译
  const renderedContent = useMemo(() => {
    if (!isReact) return null;
    return renderReact(code);
  }, [code, isReact]);

  return isReact ? (
    <div className="w-full h-full overflow-auto border-none bg-white">
      {renderedContent}
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

function renderReact(code: string) {
  try {
    // 转换 JSX 代码为普通 JavaScript
    const transformed = Babel.transform(code, {
      presets: ['react'],
      filename: 'virtual.tsx',
    });

    if (!transformed.code) {
      throw new Error('代码转换失败');
    }

    // 创建一个安全的执行环境
    // 注意：使用 Function 构造器仍有安全风险，在生产环境中应考虑使用 sandboxed iframe
    const executeCode = new Function('React', transformed.code + '; return Component || null;');
    const Component = executeCode(React);

    if (!Component) {
      return <div className="p-4 text-red-500">无法渲染组件：未找到有效的 React 组件</div>;
    }

    return typeof Component === 'function' ? <Component /> : Component;
  } catch (error) {
    console.error('渲染 React 组件时出错:', error);
    return (
      <div className="p-4 text-red-500">
        <h3 className="font-bold mb-2">渲染错误</h3>
        <pre className="text-sm">{error instanceof Error ? error.message : String(error)}</pre>
      </div>
    );
  }
}