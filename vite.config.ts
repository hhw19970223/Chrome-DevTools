import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { copyFileSync, mkdirSync, existsSync, readdirSync, readFileSync, writeFileSync } from 'fs';
import { build as esbuild } from 'esbuild';

// 自定义插件：复制静态文件到dist目录
function copyStaticFiles() {
  return {
    name: 'copy-static-files',
    closeBundle() {
      const filesToCopy = [
        { src: 'manifest.json', dest: 'dist/manifest.json' },
      ];

      filesToCopy.forEach(({ src, dest }) => {
        if (existsSync(src)) {
          const destDir = dest.substring(0, dest.lastIndexOf('/'));
          if (destDir && !existsSync(destDir)) {
            mkdirSync(destDir, { recursive: true });
          }
          copyFileSync(src, dest);
          console.log(`✓ 已复制: ${src} -> ${dest}`);
        }
      });

      // 复制图标文件夹（如果存在）
      if (existsSync('png')) {
        if (!existsSync('dist/png')) {
          mkdirSync('dist/png', { recursive: true });
        }
        const files = readdirSync('png');
        files.forEach((file: string) => {
          copyFileSync(`png/${file}`, `dist/png/${file}`);
        });
        console.log('✓ 已复制图标文件夹');
      }

      // 复制 Monaco Editor worker 文件
      const monacoWorkers = [
        'node_modules/monaco-editor/esm/vs/editor/editor.worker.js',
        'node_modules/monaco-editor/esm/vs/language/json/json.worker.js',
        'node_modules/monaco-editor/esm/vs/language/css/css.worker.js',
        'node_modules/monaco-editor/esm/vs/language/html/html.worker.js',
        'node_modules/monaco-editor/esm/vs/language/typescript/ts.worker.js',
      ];
      
      if (!existsSync('dist/monaco-workers')) {
        mkdirSync('dist/monaco-workers', { recursive: true });
      }
      
      monacoWorkers.forEach((workerPath) => {
        if (existsSync(workerPath)) {
          const fileName = workerPath.split('/').pop();
          copyFileSync(workerPath, `dist/monaco-workers/${fileName}`);
          console.log(`✓ 已复制 Monaco worker: ${fileName}`);
        }
      });
    },
  };
}

// 自定义插件：为 content script 和 injected script 生成 IIFE 格式
function buildIIFEScripts() {
  return {
    name: 'build-iife-scripts',
    closeBundle: async () => {
      const scripts = ['content', 'injected'];
      
      for (const scriptName of scripts) {
        try {
          await esbuild({
            entryPoints: [resolve(__dirname, `src/${scriptName}/index.ts`)],
            bundle: true,
            format: 'iife',
            outfile: resolve(__dirname, `dist/${scriptName}.js`),
            minify: true,
            target: 'es2015',
            define: {
              'process.env.NODE_ENV': '"production"',
            },
          });
          console.log(`✓ 已生成 IIFE 格式: ${scriptName}.js`);
        } catch (error) {
          console.error(`✗ 生成 ${scriptName}.js 失败:`, error);
        }
      }
    },
  };
}

export default defineConfig({
  plugins: [react(), copyStaticFiles(), buildIIFEScripts()],
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        devtools: resolve(__dirname, 'devtools.html'),
        panel: resolve(__dirname, 'panel.html'),
        // 移除 content 和 injected，它们由 buildIIFEScripts 插件单独处理
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: '[name].js',
        assetFileNames: '[name].[ext]',
        format: 'es', // HTML 入口使用 ES 模块
      },
    },
    minify: 'terser',
    terserOptions: {
      format: {
        comments: false,
      },
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
});
