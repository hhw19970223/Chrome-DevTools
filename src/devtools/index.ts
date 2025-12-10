// DevTools入口文件
// 创建DevTools面板
chrome.devtools.panels.create(
  'HHW',
  'png/ai.png', 
  'panel.html', // 面板HTML文件
  (panel) => {
    console.log('DevTools面板已创建');
  }
);

