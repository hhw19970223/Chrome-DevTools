# Chrome DevTools Extension

基于 **React + Mantine + Tailwind CSS** 的 Chrome Manifest V3 扩展项目，包含完整的 **DevTools ↔ Content Script ↔ Injected Script** 通讯架构。

## 🚀 技术栈

- **React 18** - UI框架
- **Mantine** - UI组件库
- **Tailwind CSS** - 样式工具
- **TypeScript** - 类型安全
- **Vite** - 构建工具
- **Chrome Manifest V3** - 扩展规范

## 📁 项目结构

```
.
├── src/
│   ├── content/           # Content Script模块
│   │   └── index.ts       # Content Script入口
│   ├── injected/          # Injected Script模块
│   │   └── index.ts       # Injected Script入口（运行在页面上下文）
│   ├── devtools/          # DevTools入口
│   │   └── index.ts
│   ├── panel/             # DevTools面板
│   │   ├── App.tsx        # 主应用组件
│   │   ├── main.tsx       # React入口
│   │   ├── feature/       # 功能组件
│   │   │   └── PageInspector.tsx  # 页面检查器示例
│   │   └── hooks/
│   │       └── useDevToolsBridge.ts  # DevTools通讯Hook
│   ├── styles/            # 样式文件
│   │   └── index.css
│   └── utils/             # 工具类
│       ├── bridge.ts      # Content ↔ Injected 通讯桥接
│       ├── devtools-bridge.ts  # DevTools ↔ Content 通讯桥接
│       ├── storage.ts     # Storage工具
│       ├── message.ts     # 消息通信工具
│       ├── message-types.ts  # 消息类型定义
│       ├── logger.ts      # 日志工具
│       ├── dom.ts         # DOM操作工具
│       └── index.ts       # 统一导出
├── manifest.json          # 扩展清单文件
├── devtools.html          # DevTools页面
├── panel.html             # 面板页面
├── vite.config.ts         # Vite配置
├── tailwind.config.js     # Tailwind配置
├── ARCHITECTURE.md        # 详细的通讯架构文档
└── package.json
```

## 🔌 通讯架构

本项目实现了完整的三层通讯架构：

```
┌─────────────────┐
│  DevTools Panel │  ← React UI，用户界面
└────────┬────────┘
         │ chrome.runtime + chrome.tabs
         │ (Chrome Extension API)
┌────────▼────────┐
│ Content Script  │  ← 页面隔离环境，消息中转
└────────┬────────┘
         │ window.postMessage
         │ (跨上下文通讯)
┌────────▼────────┐
│ Injected Script │  ← 页面上下文，可访问页面全局变量
└─────────────────┘
```

详细的架构说明和使用示例请参考 **[ARCHITECTURE.md](./ARCHITECTURE.md)**

## 🛠️ 开发指南

### 1. 安装依赖

```bash
npm install
```

### 2. 开发模式（监听文件变化）

```bash
npm run dev
```

此命令会启动Vite的watch模式，自动监听文件变化并重新构建到 `dist/` 目录。

### 3. 加载扩展到Chrome

1. 打开 Chrome 浏览器
2. 访问 `chrome://extensions/`
3. 开启右上角的 **"开发者模式"**
4. 点击 **"加载已解压的扩展程序"**
5. 选择项目的 `dist` 目录

### 4. 调试

- 在任意网页按 `F12` 打开开发者工具
- 可以看到新的 **"My Panel"** 标签页
- 修改代码后，`npm run dev` 会自动重新构建
- 在 `chrome://extensions/` 点击扩展的 **"刷新"** 按钮
- 关闭并重新打开 DevTools 即可看到更新

### 5. 生产构建

```bash
npm run build
```

构建产物会输出到 `dist/` 目录，可以打包上传到 Chrome Web Store。

## 🚀 主要功能

### 1. 页面信息获取
获取当前页面的 URL、标题、尺寸、UserAgent 等信息。

### 2. 元素查询与操作
使用 CSS 选择器查询页面元素，获取元素详细信息，高亮显示元素。

### 3. 脚本执行
在页面上下文中执行 JavaScript 代码，访问页面全局变量和函数。

### 4. 事件监听
监听页面事件（如点击、滚动等），捕获事件信息并在 DevTools 中显示。

## 💡 快速使用

### 在 Panel 中使用通讯桥接

```typescript
import { useDevToolsBridge } from './hooks/useDevToolsBridge';
import { MESSAGE_TYPES } from '../utils/message-types';

function MyComponent() {
  const { sendToInjected, onMessage } = useDevToolsBridge();

  // 获取页面信息
  const getPageInfo = async () => {
    const info = await sendToInjected(MESSAGE_TYPES.GET_PAGE_INFO);
    console.log('页面信息:', info);
  };

  // 执行脚本
  const runScript = async () => {
    const result = await sendToInjected(MESSAGE_TYPES.EXECUTE_SCRIPT, {
      code: 'document.querySelectorAll("a").length'
    });
    console.log('链接数量:', result.result);
  };

  // 高亮元素
  const highlightElement = async () => {
    await sendToInjected(MESSAGE_TYPES.HIGHLIGHT_ELEMENT, 'button');
  };

  return (
    <div>
      <button onClick={getPageInfo}>获取页面信息</button>
      <button onClick={runScript}>执行脚本</button>
      <button onClick={highlightElement}>高亮按钮</button>
    </div>
  );
}
```

### 调试 API

在页面控制台中可以直接使用调试 API：

```javascript
// 获取页面信息
window.__AGENT_DEBUG__.getPageInfo()

// 查询元素
window.__AGENT_DEBUG__.queryElement('div.container')

// 执行脚本
window.__AGENT_DEBUG__.executeScript('document.title')
```

## 🔧 工具类使用示例

### StorageUtil - 数据存储

```typescript
import { StorageUtil } from '@/utils';

// 保存数据
await StorageUtil.set('key', { data: 'value' });

// 获取数据
const value = await StorageUtil.get<{ data: string }>('key');

// 删除数据
await StorageUtil.remove('key');

// 监听变化
StorageUtil.onChanged((changes) => {
  console.log('Storage changed:', changes);
});
```

### MessageUtil - 消息通信

```typescript
import { MessageUtil } from '@/utils';

// 发送消息到Background
const response = await MessageUtil.sendToBackground({
  type: 'GET_DATA',
  payload: { id: 123 }
});

// 监听消息
MessageUtil.onMessage(async (message, sender) => {
  if (message.type === 'GET_DATA') {
    return { success: true, data: {} };
  }
});
```

### LogUtil - 日志输出

```typescript
import { LogUtil } from '@/utils';

LogUtil.info('信息日志');
LogUtil.success('成功日志');
LogUtil.warning('警告日志');
LogUtil.error('错误日志');
LogUtil.debug('调试日志');

// 分组日志
LogUtil.group('分组名称');
LogUtil.info('组内日志');
LogUtil.groupEnd();

// 表格输出
LogUtil.table([{ id: 1, name: 'Test' }]);
```

### DOMUtil - DOM操作

```typescript
import { DOMUtil } from '@/utils';

// 等待元素出现
const element = await DOMUtil.waitForElement('.target-class');

// 注入CSS
DOMUtil.injectCSS('.my-class { color: red; }', 'my-styles');

// 创建元素
const div = DOMUtil.createElement('div', {
  id: 'my-div',
  className: 'container',
  textContent: 'Hello World',
  styles: { color: 'blue' }
});
```

## 📝 注意事项

1. **开发模式热更新**: 每次修改代码后，需要在 Chrome 扩展页面刷新扩展，并重新打开 DevTools
2. **图标文件**: 记得在 `dist/icons/` 目录添加 16x16、48x48、128x128 的图标文件
3. **权限配置**: 如需更多权限，在 `manifest.json` 中添加
4. **Tailwind与Mantine**: 已配置 `preflight: false` 避免样式冲突

## 📦 打包发布

1. 执行 `npm run build` 生成生产构建
2. 将 `dist` 目录打包成 ZIP 文件
3. 访问 [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole/)
4. 上传 ZIP 文件并填写相关信息

## 📄 许可证

MIT


