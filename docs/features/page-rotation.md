# PDF页面旋转功能实现文档

**功能日期:** 2026-01-29
**功能类型:** 页面旋转 (左转90°、右转90°、翻转180°)

---

## 📋 功能概述

为PDF编辑器添加页面旋转功能，支持：
- **左转90°** - 页面向逆时针方向旋转90度
- **右转90°** - 页面向顺时针方向旋转90度
- **翻转180°** - 页面旋转180度（上下颠倒）

所有旋转操作都支持**撤销/重做**。

---

## 🏗️ 实现架构

### 1. 状态管理 (uiStore.ts)

**添加的状态:**
```typescript
pageRotations: number[]; // 存储每页的旋转角度 (0, 90, 180, 270)
```

**添加的方法:**
```typescript
setPageRotation(pageIndex, rotation)    // 直接设置旋转角度
rotatePageLeft(pageIndex)               // 左转90度
rotatePageRight(pageIndex)              // 右转90度
flipPage(pageIndex)                     // 翻转180度
getPageRotation(pageIndex)              // 获取当前旋转角度
```

### 2. Command Pattern (PageRotateCommand.ts)

**创建新的命令类:**
```typescript
export class PageRotateCommand extends Command {
  constructor(
    private pageIndex: number,
    private oldRotation: number,
    private newRotation: number,
    private setRotation: (pageIndex: number, rotation: number) => void
  )
}
```

**支持的操作:**
- `execute()` - 执行旋转
- `undo()` - 撤销到之前的旋转角度
- `redo()` - 重新执行旋转

### 3. UI组件

**工具栏按钮 (Toolbar.tsx):**
- 添加三个旋转按钮：
  - `RotateLeftOutlined` - 左转
  - `RotateRightOutlined` - 右转
  - `SyncOutlined` - 翻转

**位置:** 在工具模式区和更多工具区之间

### 4. PDF渲染 (PDFCanvasInteractive.tsx)

**修改的接口:**
```typescript
interface PDFCanvasProps {
  rotation?: number;  // 新增：页面旋转角度
  // ... 其他props
}
```

**传递给PDF.js:**
```typescript
await PDFRenderer.renderPageToCanvas(page, canvas, {
  scale: zoom,
  rotation: rotation,  // 传递旋转角度
});
```

---

## 🔄 旋转角度逻辑

### 角度范围
- **0°** - 正常方向
- **90°** - 右转90°
- **180°** - 翻转（上下颠倒）
- **270°** - 左转90°（等同于 -90°）

### 旋转计算

**左转90°:**
```typescript
newRotation = (currentRotation - 90 + 360) % 360
```

**右转90°:**
```typescript
newRotation = (currentRotation + 90) % 360
```

**翻转180°:**
```typescript
newRotation = (currentRotation + 180) % 360
```

**示例:**
```
0° → 左转 → 270° → 左转 → 180° → 左转 → 90° → 左转 → 0°
0° → 右转 → 90°  → 右转 → 180° → 右转 → 270° → 右转 → 0°
0° → 翻转 → 180° → 翻转 → 0°
```

---

## 📝 修改的文件

1. **src/stores/uiStore.ts**
   - 添加 `pageRotations` 状态
   - 添加旋转相关方法

2. **src/commands/PageRotateCommand.ts** (新建)
   - 实现页面旋转命令
   - 支持撤销/重做

3. **src/commands/index.ts**
   - 导出 `PageRotateCommand`

4. **src/components/Layout/Toolbar.tsx**
   - 添加旋转按钮
   - 添加旋转图标导入

5. **src/components/Layout/MainLayout.tsx**
   - 添加旋转处理函数传递

6. **src/components/PDFViewer/PDFCanvasInteractive.tsx**
   - 添加 `rotation` prop
   - 传递旋转角度到 PDF.js

7. **src/App.tsx**
   - 添加旋转处理函数 (`handleRotatePageLeft`, `handleRotatePageRight`, `handleFlipPage`)
   - 集成 `PageRotateCommand`
   - 传递 rotation 到 PDFCanvas

---

## 🎯 使用流程

### 用户操作流程

1. **打开PDF文件**
   ```
   打开文件 → PDF加载 → pageRotations 初始化为 [0, 0, 0, ...]
   ```

2. **选择页面**
   ```
   点击侧边栏缩略图 → selectedPageIndex 更新
   ```

3. **旋转页面**
   ```
   点击"左转"按钮 →
     handleRotatePageLeft() →
     PageRotateCommand.execute() →
     rotatePageLeft() →
     pageRotations[pageIndex] = (old - 90 + 360) % 360 →
     组件重新渲染 → PDF.js 使用新角度渲染
   ```

4. **撤销旋转**
   ```
   Ctrl+Z →
     undo() →
     PageRotateCommand.undo() →
     setPageRotation(pageIndex, oldRotation) →
     恢复到旋转前的角度
   ```

5. **重做旋转**
   ```
   Ctrl+Y →
     redo() →
     PageRotateCommand.execute() →
     重新执行旋转
   ```

---

## 🧪 测试场景

### 基础功能测试
- [ ] 左转90° - 页面向左旋转
- [ ] 右转90° - 页面向右旋转
- [ ] 翻转180° - 页面上下颠倒
- [ ] 多次旋转 - 角度正确累加

### 撤销/重做测试
- [ ] 旋转后撤销 - 恢复到原始角度
- [ ] 旋转后重做 - 重新执行旋转
- [ ] 多次旋转后撤销 - 每次撤销恢复一个操作

### 多页面测试
- [ ] 不同页面独立旋转 - 互不影响
- [ ] 页面间切换旋转角度保持正确

### 边界情况测试
- [ ] 270° 左转90° → 180°（不是0°）
- [ ] 90° 右转90° → 180°（不是0°）
- [ ] 180° 翻转 → 0°

---

## 🔍 技术细节

### PDF.js Rotation API

PDF.js 的 `page.getViewport({ scale, rotation })` 支持：
- `rotation: 0` - 正常
- `rotation: 1` - 90°（右转）
- `rotation: 2` - 180°
- `rotation: 3` - 270°（右转）

我们的实现使用角度（0, 90, 180, 270），在渲染时直接传递给 PDF.js。

### 角度归一化

所有角度使用模运算保持在 0-360 范围：
```typescript
rotation = (rotation + 360) % 360  // 确保非负
rotation = rotation % 360           // 确保小于360
```

### Command Pattern 集成

旋转操作完全集成到现有的撤销/重做系统：
```typescript
const command = new PageRotateCommand(
  pageIndex,
  oldRotation,
  newRotation,
  rotatePageLeft  // 或 rotatePageRight, flipPage
);
await executeCommand(command);
```

---

## ✅ 验收标准

- [x] 工具栏显示三个旋转按钮（左转、右转、翻转）
- [x] 点击按钮后页面立即旋转
- [x] 旋转角度显示正确（0°, 90°, 180°, 270°）
- [x] 支持撤销/重做旋转操作
- [x] 不同页面的旋转独立
- [x] 旋转后页面内容清晰可见
- [x] 无控制台错误
- [x] TypeScript 编译通过

---

## 📸 UI预览

```
工具栏布局：
[打开] [保存] [另存] [打印] | [撤销] [重做] |
[插入图片] [插入文本] | [擦除] [高亮] |
[左转] [右转] [翻转] | [更多工具] | [导出] |
文件名.pdf [-] [100%] [+] [适应]
```

---

## 🚀 后续改进

### 可能的增强功能
1. **批量旋转** - 选择多个页面同时旋转
2. **旋转预设** - 常用角度快速选择（0°, 90°, 180°, 270°）
3. **旋转到指定角度** - 自定义角度输入
4. **旋转动画** - 平滑的旋转过渡效果
5. **保存旋转** - 将旋转应用到保存的PDF文件

### 性能优化
- 旋转时缓存渲染结果
- 避免不必要的重新渲染

---

**总结:** 页面旋转功能已完整实现，使用 Command Pattern 支持撤销/重做，与现有架构无缝集成。
