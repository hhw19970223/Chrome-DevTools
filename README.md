# Chrome DevTools Extension

基于 **React + Mantine + Tailwind CSS** 的 Chrome Manifest V3 扩展项目。

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
│   ├── devtools/          # DevTools入口
│   │   └── index.ts
│   ├── panel/             # DevTools面板
│   │   ├── App.tsx        # 主应用组件
│   │   └── main.tsx       # React入口
│   ├── styles/            # 样式文件
│   │   └── index.css
│   └── utils/             # 工具类
│       ├── storage.ts     # Storage工具
│       ├── message.ts     # 消息通信工具
│       ├── logger.ts      # 日志工具
│       ├── dom.ts         # DOM操作工具
│       └── index.ts       # 统一导出
├── manifest.json          # 扩展清单文件
├── devtools.html          # DevTools页面
├── panel.html             # 面板页面
├── vite.config.ts         # Vite配置
├── tailwind.config.js     # Tailwind配置
└── package.json
```

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

