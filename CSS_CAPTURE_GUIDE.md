# CSS 捕获和加载指南

## 概述
这个功能实现了从注入脚本中捕获网页的CSS样式表，并将其发送到DevTool面板进行加载和应用。

## 工作流程

### 1. 注入脚本端 (src/injected/dicord/index.ts)

在 `_init()` 方法中调用 `_captureCSSStylesheets()` 来捕获页面中的所有CSS：

```typescript
protected _init(): void {
  this._observeBodyChildren();
  if (this._mainDom) {
    this._observeMainDomChildren(this._mainDom);
  }
  
  // 捕获CSS样式表
  this._captureCSSStylesheets();
}
```

### 2. CSS捕获机制

`_captureCSSStylesheets()` 方法会：

1. **捕获 `<link>` 标签的CSS**
   - 查找所有 `link[rel="stylesheet"]` 元素
   - 提取 `href` 属性（已经是绝对路径）
   - 提取 `media` 属性

2. **捕获 `<style>` 标签的CSS**
   - 查找所有 `<style>` 元素
   - 提取内联样式内容

3. **监听动态添加的CSS**
   - 使用 `MutationObserver` 监听 `<head>` 和 `<body>` 的变化
   - 当检测到新的 `<link>` 或 `<style>` 标签时，立即发送给DevTool

### 3. 数据格式

CSS数据以以下格式发送：

```typescript
{
  type: 'css', // 或 'css-added' (动态添加的CSS)
  cssData: [
    {
      type: 'link',
      href: 'https://example.com/styles.css',
      media: 'all'
    },
    {
      type: 'style',
      content: '.class { color: red; }'
    }
  ]
}
```

### 4. DevTool面板端 (src/panel/feature/discord/index.tsx)

接收CSS数据并传递给子组件：

```typescript
useEffect(() => {
  onMessage(MESSAGE_TYPES.DISCORD, (payload) => {
    // 处理CSS数据
    if (payload.type === 'css' && payload.cssData) {
      setCssData(payload.cssData);
    }
    
    // 处理动态添加的CSS
    if (payload.type === 'css-added' && payload.cssData) {
      setCssData(prev => [...prev, ...payload.cssData]);
    }
  });
}, []);
```

### 5. CSS加载 (src/panel/components/discord-chat/index.tsx)

`DiscordChat` 组件负责实际加载CSS：

```typescript
useEffect(() => {
  cssData.forEach((css) => {
    // 加载 link 标签的CSS
    if (css.type === 'link' && css.href) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = css.href;
      document.head.appendChild(link);
    }
    
    // 加载内联样式
    if (css.type === 'style' && css.content) {
      const style = document.createElement('style');
      style.textContent = css.content;
      document.head.appendChild(style);
    }
  });
}, [cssData]);
```

## 防止重复加载

使用 `useRef` 创建的 `loadedStylesRef` 来跟踪已加载的样式：
- 对于 `link` 标签：使用 `href` 作为唯一标识
- 对于 `style` 标签：使用内容的前100个字符作为唯一标识

## 使用场景

当你需要在DevTool面板中渲染来自原网页的HTML内容时，这些HTML可能依赖原网页的CSS样式。通过这个机制，可以确保：

1. 原网页的所有样式都被正确捕获
2. 样式被同步到DevTool面板
3. 渲染的HTML保持原有的外观

## 注意事项

1. **跨域问题**：某些CSS文件可能因为CORS限制无法在DevTool中加载
2. **性能考虑**：对于大量CSS文件，可能需要考虑按需加载或懒加载
3. **样式冲突**：DevTool自身的样式可能与加载的CSS产生冲突，需要适当的样式隔离


