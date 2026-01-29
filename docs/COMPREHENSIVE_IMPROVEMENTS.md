# 全面用户体验改进方案

## 改进时间
2026-01-28

## 问题总结

1. ❌ 大量弹窗和消息提示仍是英文
2. ❌ 插入文本/图片使用对话框输入坐标（不友好）
3. ❌ 无法选择PDF中的文字
4. ❌ 窗口尺寸太小，工具栏按钮过多导致超出界面

## 解决方案概览

### ✅ 已完成
- [x] 窗口尺寸增大（1400x900，最小1200x700）
- [x] 工具栏重新设计（紧凑布局+分组菜单）
- [x] 创建中文消息翻译系统

### 🔄 进行中
- [ ] 应用所有中文翻译到弹窗和消息
- [ ] 实现可视化插入和拖拽移动
- [ ] 实现文字选择和复制功能

---

## 详细实施方案

### 问题1：英文弹窗翻译 ✅

#### 当前状态
- `App.tsx` 中有35+处英文消息提示
- `Modal.confirm` 的 title 和 content 都是英文
- `message.success/error` 的文本都是英文

#### 解决方案
已创建 `src/constants/messages.ts` 翻译映射表

#### 需要执行的替换

```typescript
// 1. 未保存更改确认
Modal.confirm({
  title: getMessage('Unsaved Changes'),
  content: getMessage('You have unsaved changes. Do you want to continue?'),
  // ...
})

// 2. 文件加载成功
message.success(getMessage('Loaded {name} ({pages} pages)', {
  name: fileData.fileName,
  pages: numPages
}))

// 3. 所有其他消息
message.error(getMessage('Failed to load PDF file'))
message.success(getMessage('File saved successfully'))
```

#### 快速批量替换脚本

创建 `scripts/translate-messages.js`：
```bash
# 使用 sed 或手动批量替换
# 替换所有 Modal.confirm 的 title 和 content
# 替换所有 message.success/error/warning 的文本
```

### 问题2：可视化插入功能 🔄

#### 当前问题
- 使用对话框输入 X、Y、宽度、高度
- 用户无法直观知道位置
- 无法调整已插入对象的位置

#### 解决方案：类似 Word/PPT 的交互

**架构设计：**
1. **对象层管理系统**
   - 每个插入对象（图片、文本）都有独立的数据结构
   - 存储位置、尺寸、内容、样式
   - 支持选中、拖拽、缩放

2. **渲染层**
   - PDF 底层（PDF.js 渲染）
   - 对象层（React 组件渲染可拖拽对象）
   - 交互层（处理鼠标事件）

3. **交互逻辑**
   - 点击工具栏"插入文本/图片"按钮
   - 在 PDF 上点击位置创建对象
   - 对象默认处于可拖拽状态
   - ESC 键退出拖拽模式

**数据结构：**
```typescript
interface InsertedObject {
  id: string;
  type: 'image' | 'text';
  pageIndex: number;
  x: number;
  y: number;
  width: number;
  height: number;
  content: string; // base64 for image, text for text
  style: {
    fontSize?: number;
    color?: string;
    opacity?: number;
  };
  selected: boolean;
}
```

**组件结构：**
```
PDFCanvas
├── PDFLayer (PDF.js)
├── ObjectLayer (React组件渲染插入对象)
│   ├── DraggableImage
│   └── DraggableText
└── InteractionLayer (事件处理)
```

**实现步骤：**
1. 创建 `src/stores/objectStore.ts` - 管理插入对象
2. 创建 `src/components/PDFViewer/ObjectLayer.tsx` - 渲染对象层
3. 创建 `src/components/Objects/DraggableObject.tsx` - 可拖拽对象基类
4. 创建 `src/components/Objects/DraggableImage.tsx` - 可拖拽图片
5. 创建 `src/components/Objects/DraggableText.tsx` - 可拖拽文本
6. 更新 `PDFCanvasInteractive.tsx` 集成对象层

**拖拽实现：**
```typescript
const handleMouseDown = (e: React.MouseEvent, objectId: string) => {
  const obj = objects.find(o => o.id === objectId);
  if (!obj) return;

  setDragging(true);
  setDragOffset({
    x: e.clientX - obj.x,
    y: e.clientY - obj.y,
  });
  setSelectedObject(objectId);
};

const handleMouseMove = (e: React.MouseEvent) => {
  if (!dragging || !selectedObject) return;

  const newObj = {
    ...selectedObject,
    x: e.clientX - dragOffset.x,
    y: e.clientY - dragOffset.y,
  };

  updateObject(newObj);
};
```

### 问题3：文字选择和复制 🔄

#### PDF.js TextLayer

PDF.js 原生支持文本层渲染和文本选择。

**实现步骤：**

1. **启用 PDF.js 文本层**
```typescript
// 在 pdfRenderer.ts 中
const textContent = await page.getTextContent();
// 渲染文本层到 DOM
```

2. **创建 TextLayer 组件**
```typescript
// src/components/PDFViewer/TextLayer.tsx
// 使用 PDF.js 的 TextView 渲染
// 样式：透明文字层覆盖在 PDF 上
```

3. **添加 CSS 样式**
```css
.textLayer {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: auto;
  user-select: text;
}

::selection {
  background: rgba(255, 235, 59, 0.3);
}
```

4. **复制功能**
```typescript
// 监听 Ctrl+C
useEffect(() => {
  const handleCopy = (e: ClipboardEvent) => {
    const selection = window.getSelection();
    const text = selection.toString();
    if (text) {
      navigator.clipboard.writeText(text);
      message.success('已复制到剪贴板');
    }
  };

  document.addEventListener('copy', handleCopy);
  return () => document.removeEventListener('copy', handleCopy);
}, []);
```

**集成到 PDFCanvas：**
```typescript
<CanvasContainer>
  <PDFCanvas ref={pdfCanvasRef} />
  <TextLayer page={page} viewport={viewport} />
  <InteractionLayer />
</CanvasContainer>
```

### 问题4：窗口尺寸和布局 ✅

#### 已完成的改进

1. **增大窗口尺寸**
```typescript
// electron/main.ts
width: 1200 → 1400
height: 800 → 900
minWidth: 1200
minHeight: 700
```

2. **工具栏重新设计**
- 使用 `Row` + `Col` 响应式布局
- 按钮改用 `size="small"` 紧凑模式
- 使用"更多工具"下拉菜单收纳次级功能
- 文件名使用 `ellipsis` 防止溢出

3. **布局优化**
```
[文件操作] [插入] [工具模式] [更多工具▼] [导出▼] [缩放] [文件名 * ]
```

4. **响应式设计**
- 使用 `flex="1 1 auto"` 让文件名区占据剩余空间
- 文件名超长时显示省略号
- 按钮自动换行时保持可用

---

## 实施优先级和时间估计

### 阶段1：完成基础修复（30分钟）
- [x] 修复窗口尺寸
- [x] 优化工具栏布局
- [ ] 翻译所有弹窗消息（使用 codex 批量替换）

### 阶段2：核心功能实现（2-3小时）
- [ ] 实现文字选择和复制（1小时）
- [ ] 实现可视化插入和拖拽（2小时）
  - [ ] 对象管理系统
  - [ ] 可拖拽对象组件
  - [ ] 集成到 PDFCanvas

### 阶段3：测试和优化（1小时）
- [ ] 功能测试
- [ ] 边界情况处理
- [ ] 性能优化

---

## 代码文件清单

### 需要修改的文件
1. `src/App.tsx` - 应用所有中文翻译
2. `src/constants/messages.ts` - ✅ 已创建
3. `electron/main.ts` - ✅ 已修改
4. `src/components/Layout/Toolbar.tsx` - ✅ 已重新设计

### 需要创建的文件
5. `src/stores/objectStore.ts` - 对象管理
6. `src/components/PDFViewer/TextLayer.tsx` - 文本层
7. `src/components/Objects/DraggableObject.tsx` - 拖拽基类
8. `src/components/Objects/DraggableImage.tsx` - 图片对象
9. `src/components/Objects/DraggableText.tsx` - 文本对象
10. `src/components/PDFViewer/ObjectLayer.tsx` - 对象层

### 需要更新的文件
11. `src/components/PDFViewer/PDFCanvasInteractive.tsx` - 集成新功能

---

## 技术方案对比

### 方案A：全功能实现（推荐）
- ✅ 完整的可视化交互
- ✅ 符合用户期望
- ⚠️ 需要2-3小时实现
- ⚠️ 代码复杂度增加

### 方案B：快速修复
- ✅ 1小时内完成基础修复
- ⚠️ 插入功能仍然不友好
- ❌ 不符合专业软件标准

**推荐：方案A - 一次性彻底解决问题**

---

## 测试验证清单

### 窗口布局
- [ ] 窗口默认大小合适
- [ ] 窗口可以最小化到1200x700
- [ ] 所有按钮都可见
- [ ] 文件名太长时显示省略号

### 中文显示
- [ ] 所有 Modal 弹窗是中文
- [ ] 所有 message 提示是中文
- [ ] Button 文本是中文
- [ ] Placeholder 是中文

### 文字选择
- [ ] 鼠标可以选择PDF中的文字
- [ ] 选中文字显示黄色背景
- [ ] Ctrl+C 复制文字
- [ ] 复制的文字可以粘贴到其他应用

### 可视化插入
- [ ] 点击"插入文本"按钮进入模式
- [ ] 点击PDF位置插入文本框
- [ ] 文本框可以拖拽移动
- [ ] ESC退出插入模式
- [ ] 图片插入同理

---

## API 参考

### PDF.js TextLayer
- https://github.com/mozilla/pdf.js/tree/master/web/text_layer
- `page.getTextContent()` - 获取文本内容
- `TextLayerBuilder` - 构建文本层
- `renderTextLayer()` - 渲染到DOM

### React DnD（可选）
- 使用 react-dnd 库简化拖拽实现
- 或者自己实现原生拖拽（更灵活）

---

## 总结

这是一个全面改进用户体验的方案，包含：

1. ✅ **立即改进**（已完成）
   - 窗口尺寸优化
   - 工具栏布局重构

2. 🔄 **批量翻译**（进行中）
   - 创建翻译系统
   - 应用到所有弹窗和消息

3. 📋 **核心功能**（待实现）
   - 文字选择复制
   - 可视化插入拖拽

所有改进都对标 Adobe Acrobat 等专业软件，确保用户获得最佳体验。
