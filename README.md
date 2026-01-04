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

## 🎨 Tailwind 动态类名支持

项目中的 `sandbox.html` 支持 Tailwind CSS 动态类名（如 `text-[7px]`、`w-[123px]` 等任意值）。

### 自动扫描
系统会自动监听 DOM 变化并注入动态样式。**当组件渲染完成后，会自动扫描并生成对应的 CSS 类**，无需手动操作。

### 组件渲染时的自动扫描

每当通过 `postMessage` 动态生成组件时，系统会：

1. ✅ 等待组件渲染完成
2. ✅ 自动扫描组件中的所有动态类名
3. ✅ 注入对应的 CSS 样式
4. ✅ 触发 Tailwind CDN 刷新
5. ✅ 在控制台显示扫描结果

```javascript
// 示例：组件渲染后自动扫描
// 控制台输出：
// 🔍 [动态样式] 扫描 Tailwind 任意值类名...
// ✅ [动态样式] 注入了 5 个新样式
// 📋 [新样式] text-[7px], w-[123px], h-[45px], p-[13px], gap-[8px]
// 🔄 [Tailwind CDN] 触发刷新
// ✅ 组件渲染完成 (5 个动态样式, CDN 已刷新)
```

### 手动扫描 API

如果需要手动控制扫描，可以使用以下函数：

```javascript
// 🎯 推荐：使用统一的扫描函数
scanComponentTailwindStyles(element, {
  verbose: true,        // 显示详细日志
  showNewStyles: true,  // 显示新注入的样式列表
  refreshCDN: true      // 触发 CDN 刷新
})
// 返回: { customStyles: 5, cdnRefreshed: true, newStyles: [...] }

// 扫描整个页面
scanComponentTailwindStyles(document.body)

// 只扫描不显示日志（安静模式）
scanComponentTailwindStyles(element, { verbose: false, showNewStyles: false })
```

#### 底层 API（高级用法）

在浏览器控制台中可以使用以下底层函数：

```javascript
// 手动扫描整个页面的动态类名
scanTailwindClasses()
// 返回: { total: 10, newStyles: 5 }

// 扫描特定元素
scanTailwindClasses(document.querySelector('#myDiv'))

// 预注册类名（在渲染前注入样式）
registerTailwindClasses(['text-[7px]', 'w-[123px]', 'h-[45px]'])
// 返回: 3 (新增的样式数量)

// 预注册单个类名
registerTailwindClasses('text-[7px]')

// 触发 Tailwind CDN 重新扫描
refreshTailwind()

// 暂停自动扫描（性能优化）
enableAutoTailwindScan(false)

// 恢复自动扫描
enableAutoTailwindScan(true)

// 清除所有动态样式
clearDynamicTailwindStyles()

// 查看已生成的样式列表
getGeneratedTailwindStyles()
// 返回: ['text-[7px]', 'w-[123px]', ...]
```

### 支持的动态类名前缀

| 类别 | 前缀 | 示例 | 生成的 CSS |
|------|------|------|-----------|
| **文本** | `text` | `text-[7px]` | `font-size: 7px` |
| | `leading` | `leading-[1.5]` | `line-height: 1.5` |
| | `tracking` | `tracking-[2px]` | `letter-spacing: 2px` |
| **宽度** | `w` | `w-[123px]` | `width: 123px` |
| | `min-w` | `min-w-[100px]` | `min-width: 100px` |
| | `max-w` | `max-w-[500px]` | `max-width: 500px` |
| **高度** | `h` | `h-[45px]` | `height: 45px` |
| | `min-h` | `min-h-[100px]` | `min-height: 100px` |
| | `max-h` | `max-h-[500px]` | `max-height: 500px` |
| **内边距** | `p` | `p-[13px]` | `padding: 13px` |
| | `pt/pr/pb/pl` | `pt-[10px]` | `padding-top: 10px` |
| | `px/py` | `px-[20px]` | `padding-left/right: 20px` |
| **外边距** | `m` | `m-[25px]` | `margin: 25px` |
| | `mt/mr/mb/ml` | `mt-[10px]` | `margin-top: 10px` |
| | `mx/my` | `mx-[auto]` | `margin-left/right: auto` |
| **间距** | `gap` | `gap-[8px]` | `gap: 8px` |
| **颜色** | `bg` | `bg-[#ff6b6b]` | `background-color: #ff6b6b` |
| | `text` | `text-[rgb(255,0,0)]` | `color: rgb(255,0,0)` |
| **边框** | `border` | `border-[2px]` | `border-width: 2px` |
| | `rounded` | `rounded-[12px]` | `border-radius: 12px` |
| **定位** | `top/left/right/bottom` | `top-[10px]` | `top: 10px` |
| | `z` | `z-[999]` | `z-index: 999` |
| **变换** | `opacity` | `opacity-[85]` | `opacity: 0.85` |
| | `rotate` | `rotate-[45deg]` | `transform: rotate(45deg)` |
| | `scale` | `scale-[1.5]` | `transform: scale(1.5)` |
| | `translate-x/y` | `translate-x-[10px]` | `transform: translateX(10px)` |

> 💡 **提示**: 任意值语法支持各种单位（px, rem, em, %, vh, vw 等）和颜色格式（hex, rgb, hsl 等）。

### API 快速参考

| 函数 | 用途 | 返回值 |
|------|------|--------|
| `scanComponentTailwindStyles(el, opts)` | 🎯 扫描并注入动态样式（推荐） | `{ customStyles, cdnRefreshed, newStyles }` |
| `scanTailwindClasses(el)` | 🔍 底层扫描函数 | `{ total, newStyles }` |
| `registerTailwindClasses(classes)` | 📝 预注册类名 | `number` |
| `refreshTailwind()` | 🔄 触发 CDN 刷新 | `void` |
| `enableAutoTailwindScan(bool)` | ⏸️ 控制自动扫描 | `void` |
| `clearDynamicTailwindStyles()` | 🗑️ 清除所有样式 | `void` |
| `getGeneratedTailwindStyles()` | 📋 查看已生成样式 | `string[]` |

### 在代码中使用

```tsx
// 动态类名会自动被识别和注入
<div className="text-[7px] w-[123px] h-[45px] p-[13px]">
  自定义尺寸元素
</div>

// 可以与普通 Tailwind 类混用
<div className="flex items-center text-[14px] bg-[#f0f0f0] rounded-[8px]">
  混合使用
</div>

// 程序化生成的动态类名也支持
const size = 15;
<div className={`text-[${size}px]`}>
  动态生成的类名
</div>
```

### 实际案例演示

```tsx
// 一个使用大量动态类名的组件示例
export default function CustomCard() {
  return (
    <div className="w-[350px] h-[200px] p-[20px] rounded-[16px] bg-[#f8f9fa]">
      <h2 className="text-[18px] mb-[12px] text-[#333]">
        自定义卡片
      </h2>
      <p className="text-[14px] leading-[1.6] text-[#666]">
        这个组件使用了大量的任意值类名
      </p>
      <button className="mt-[16px] px-[24px] py-[10px] bg-[#007bff] text-[#fff] rounded-[8px]">
        点击按钮
      </button>
    </div>
  );
}

// 当这个组件渲染时，控制台会显示：
// 🔍 [动态样式] 扫描 Tailwind 任意值类名...
// ✅ [动态样式] 注入了 13 个新样式
// 📋 [新样式] w-[350px], h-[200px], p-[20px], rounded-[16px], bg-[#f8f9fa], ...
// ✅ 组件渲染完成 (13 个动态样式, CDN 已刷新)
```

### 性能优化建议

1. **批量预注册**: 如果知道会用到哪些动态类名，可以提前注册：
   ```javascript
   registerTailwindClasses([
     'text-[7px]', 'text-[8px]', 'text-[9px]',
     'w-[100px]', 'w-[200px]', 'w-[300px]'
   ]);
   ```

2. **关闭自动扫描**: 在大量 DOM 操作时暂停自动扫描，完成后再手动扫描一次：
   ```javascript
   enableAutoTailwindScan(false);
   // ... 执行大量 DOM 操作 ...
   scanComponentTailwindStyles(document.body);
   enableAutoTailwindScan(true);
   ```

3. **安静模式**: 不需要日志时使用安静模式：
   ```javascript
   scanComponentTailwindStyles(element, { 
     verbose: false, 
     showNewStyles: false 
   });
   ```

4. **查看日志**: 打开控制台可以看到样式注入的实时日志，便于调试。

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


