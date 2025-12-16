import { loader } from '@monaco-editor/react';
import * as monaco from 'monaco-editor';

// 配置使用本地打包的 monaco-editor，而不是从 CDN 加载
loader.config({ monaco });

// 配置 Monaco Editor 的 worker 路径（在 Chrome 扩展环境中）
if (typeof chrome !== 'undefined' && chrome.runtime) {
  (self as any).MonacoEnvironment = {
    getWorkerUrl: function (_moduleId: string, label: string) {
      const baseUrl = chrome.runtime.getURL('monaco-workers/');
      if (label === 'json') {
        return `${baseUrl}json.worker.js`;
      }
      if (label === 'css' || label === 'scss' || label === 'less') {
        return `${baseUrl}css.worker.js`;
      }
      if (label === 'html' || label === 'handlebars' || label === 'razor') {
        return `${baseUrl}html.worker.js`;
      }
      if (label === 'typescript' || label === 'javascript') {
        return `${baseUrl}ts.worker.js`;
      }
      return `${baseUrl}editor.worker.js`;
    }
  };
}
