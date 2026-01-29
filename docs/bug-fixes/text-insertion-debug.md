# 文本插入功能诊断和修复指南

**日期:** 2026-01-28
**问题:** 文本插入功能完全无效

---

## 🔍 诊断步骤

### 步骤1: 检查应用是否正常启动

```bash
pnpm run electron:dev
```

**预期:**
- Electron 窗口打开
- Vite 开发服务器运行在 http://localhost:5176
- 无编译错误

---

### 步骤2: 检查工具栏按钮

1. 点击"插入文本"按钮
2. 检查以下内容：
   - ✅ 按钮应该变为"按下"状态或显示为激活
   - ✅ 鼠标光标应该变为文本输入光标（I型）
   - ✅ 应该显示消息提示："点击 PDF 位置插入文本"

**如果以上都不发生:**
- 问题在按钮点击事件
- 检查 App.tsx line 1037-1040
- 检查 setToolMode 是否正确调用

---

### 步骤3: 检查点击PDF是否触发

1. 在 PDF 上点击任意位置
2. 打开浏览器控制台（DevTools）
3. 查看是否有以下日志：

**应该看到的日志:**
```
Auto-focusing textarea  (来自 PDFCanvasInteractive.tsx line 61)
```

**如果看不到日志:**
- onClick 事件没有被触发
- 检查 PDFCanvasInteractive.tsx line 153-158
- 检查 toolMode 是否为 'insert-text'

---

### 步骤4: 检查 editingText 状态

在浏览器控制台输入：

```javascript
// 检查当前 toolMode
window.$r = require('electron').ipcRenderer
window.$r.send('debug-state')
```

或者添加调试日志到 App.tsx:

```typescript
const handleInsertTextAtPosition = useCallback((pageIndex: number, x: number, y: number) => {
  console.log('handleInsertTextAtPosition called', { pageIndex, x, y });

  if (!pdfBytes) {
    message.error(getMessage('No PDF loaded'));
    return;
  }

  console.log('Setting editingText state...');
  setEditingText({
    pageIndex,
    position: { x, y },
    content: '',
  });

  console.log('editingText state set successfully');
}, [pdfBytes]);
```

---

## 🐛 可能的问题和修复方案

### 问题A: toolMode 未正确设置

**症状:** 点击"插入文本"后，鼠标光标不变为文本光标

**原因:** setToolMode 调用失败

**修复:**
```typescript
// App.tsx line 1037
onInsertText={() => {
  console.log('Setting toolMode to insert-text');
  setToolMode('insert-text');
  message.info('点击 PDF 位置插入文本');
}}
```

检查 uiStore.ts 中的 setToolMode 实现：

```typescript
setToolMode: (mode) => {
  console.log('setToolMode called with:', mode);
  set({ toolMode: mode });
}
```

---

### 问题B: onClick 事件未触发

**症状:** 点击PDF什么都没有发生

**原因:** 事件被阻止或未正确绑定

**诊断:**
在 PDFCanvasInteractive.tsx 的 handleMouseDown 添加日志：

```typescript
const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
  console.log('handleMouseDown called, toolMode:', toolMode);

  if (!containerRef.current) return;

  if (toolMode === 'insert-text') {
    console.log('Insert-text mode detected');
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoom;
    const y = (e.clientY - rect.top) / zoom;
    console.log('Calling onInsertTextAtPosition with:', { pageIndex: pageNumber - 1, x, y });
    onInsertTextAtPosition?.(pageNumber - 1, x, y);
    return;
  }

  // ... rest of handler
}
```

---

### 问题C: editingText 状态未正确传递

**症状:** 点击PDF后没有textarea出现

**原因:** Props传递链断裂

**检查:**
1. App.tsx line 1066-1069: editingText props 是否传递
2. PDFCanvasInteractive.tsx line 297: 条件渲染是否正确
3. 检查条件: `editingText && editingText.pageIndex === pageNumber - 1`

**调试:**
在 PDFCanvasInteractive.tsx 添加日志：

```typescript
console.log('Rendering check:', {
  editingText,
  pageNumber,
  shouldRender: editingText && editingText.pageIndex === pageNumber - 1
});
```

---

### 问题D: textarea 被其他元素覆盖

**症状:** textarea 存在但不可见或不可点击

**原因:** z-index 或 pointer-events 问题

**修复:**
确保 z-index 足够高（当前是1000）
确保 pointer-events 没有被禁用

检查 ObjectLayer 是否覆盖了 textarea：

```typescript
{/* 对象层 */}
{!loading && (
  <ObjectLayer
    style={{ pointerEvents: toolMode === 'view' ? 'auto' : 'none' }}
  />
)}
```

---

## 🚀 快速修复方案

如果时间紧迫，可以直接简化实现：

### 方案1: 恢复使用弹窗输入文本

**优点:** 简单，肯定能工作
**缺点:** 用户体验差

```typescript
const handleInsertTextAtPosition = useCallback((pageIndex: number, x: number, y: number) => {
  if (!pdfBytes) {
    message.error(getMessage('No PDF loaded'));
    return;
  }

  // 使用弹窗输入
  Modal.confirm({
    title: '插入文本',
    content: (
      <Input
        placeholder="请输入文本内容"
        maxLength={500}
        autoFocus
      />
    ),
    onOk: async () => {
      // 直接创建文本对象
      const newObject: TextObject = {
        // ... 对象创建逻辑
      };

      addObject(newObject);
      message.success('文本已插入');
    }
  });
}, [pdfBytes]);
```

---

### 方案2: 添加调试日志定位问题

在每个关键步骤添加 console.log：

1. App.tsx handleInsertTextAtPosition
2. PDFCanvasInteractive handleMouseDown
3. PDFCanvasInteractive textarea 渲染条件
4. App.tsx handleFinishEditingText

然后操作并查看控制台，定位具体哪一步失败。

---

## 📝 完整测试流程

1. **启动应用**
   ```bash
   pnpm run electron:dev
   ```

2. **打开PDF文件**
   - 点击"打开"按钮
   - 选择任意PDF文件

3. **点击插入文本**
   - 点击工具栏"插入文本"按钮
   - ✅ 鼠标光标应该变为I型
   - ✅ 显示提示："点击 PDF 位置插入文本"

4. **点击PDF**
   - 在PDF上点击位置
   - ✅ 应该看到绿色边框的文本框
   - ✅ 文本框自动聚焦

5. **输入文本**
   - 输入文字："测试文本"
   - 可以输入中文或英文

6. **确认插入**
   - 按Enter键
   - ✅ 文本框消失
   - ✅ 文本对象出现在PDF上
   - ✅ 显示消息："文本已插入，可拖拽调整位置"

7. **测试对象操作**
   - ✅ 拖拽文本移动位置
   - ✅ 拖拽手柄调整大小
   - ✅ 拖拽旋转手柄旋转
   - ✅ 选中后修改字体和字号
   - ✅ 按Delete删除

---

## 🎯 下一步

请按照以上诊断步骤操作，然后告诉我：

1. **在哪一步失败了？**
   - 点击"插入文本"按钮？
   - 点击PDF？
   - 文本框出现？
   - 输入文本？
   - 按Enter确认？

2. **控制台有什么错误或日志？**
   - 复制所有错误信息
   - 复制所有console.log输出

3. **您看到什么现象？**
   - 完全没反应？
   - 鼠标光标变了但点击没反应？
   - 其他现象？

根据您的反馈，我会针对性地修复问题！
