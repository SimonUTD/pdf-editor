# 文本插入功能测试指南

**更新日期:** 2026-01-28
**修复commit:** 5eb81173

---

## ✅ 已修复的关键Bug

### Bug: 文本框一闪就消失
**原因:** 点击PDF时的事件冒泡触发了"外部点击"检测，导致文本框立即关闭

**修复:** 在 `handleMouseDown` 中添加 `e.stopPropagation()`，阻止事件冒泡到外部点击检测器

**位置:** `src/components/PDFViewer/PDFCanvasInteractive.tsx` lines 168, 176

---

## 🧪 完整测试步骤

### 测试1: 基础文本插入 ✅

**目标:** 验证文本框能正常出现并保持显示

**步骤:**
1. 启动应用: `pnpm run electron:dev`
2. 打开任意PDF文件
3. 点击工具栏"插入文本"按钮
4. **预期:** 鼠标光标变为I型（text）
5. **预期:** 显示提示："点击 PDF 位置插入文本"

**点击PDF:**
6. 在PDF上点击任意位置
7. **✅ 文本框应该出现，带绿色边框**
8. **✅ 文本框应该自动聚焦**
9. **✅ 文本框应该稳定显示，不消失**

**输入文本:**
10. 输入英文："Hello"
11. **✅ 文字应该正常显示在文本框中**
12. 输入中文："你好"
13. **✅ 中文应该正常输入（使用输入法）**

**确认插入:**
14. 按 Enter 键
15. **✅ 文本框应该消失**
16. **✅ 文本对象应该出现在PDF上**
17. **✅ 显示消息："文本已插入，可拖拽调整位置"**

---

### 测试2: ESC取消 ✅

**目标:** 验证ESC键可以取消文本编辑

**步骤:**
1. 点击"插入文本"
2. 点击PDF位置
3. ✅ 文本框出现
4. 输入一些文字
5. 按 ESC 键
6. **✅ 文本框应该消失**
7. **✅ 不应该创建文本对象**

---

### 测试3: 点击外部确认 ✅

**目标:** 验证点击文本框外部也可以确认

**步骤:**
1. 点击"插入文本"
2. 点击PDF位置
3. ✅ 文本框出现
4. 输入文字："测试"
5. **在文本框之外点击**（但要在PDF范围内）
6. **✅ 文本框应该消失**
7. **✅ 文本对象应该创建**

---

### 测试4: 文本对象操作 ✅

**目标:** 验证插入的文本对象可以正常编辑

**步骤:**

#### 4.1 选择文本
1. 文本对象创建后应该自动选中
2. **✅ 显示蓝色边框**

#### 4.2 拖拽移动
3. 点击文本对象并拖拽
4. **✅ 对象应该跟随鼠标移动**

#### 4.3 调整大小
5. 拖拽8个手柄中的任意一个
6. **✅ 对象应该调整大小**
7. **✅ 最小尺寸限制：20px**

#### 4.4 旋转
8. 拖拽顶部旋转手柄
9. **✅ 对象应该旋转**
10. **✅ 显示当前角度**

#### 4.5 修改字体
11. 选中状态下，字体选择器应该出现在对象下方
12. 选择不同字体（Arial、Times New Roman等）
13. **✅ 文本应该实时更新为新字体**

#### 4.6 修改字号
14. 在字体选择器右侧，修改字号数字
15. **✅ 文本大小应该实时改变**

#### 4.7 删除
16. 按 Delete 键或 Backspace 键
17. **✅ 确认对话框应该出现**
18. 点击"确定"
19. **✅ 文本对象应该被删除**

---

### 测试5: 撤销/重做 ✅

**目标:** 验证文本对象的操作可以独立撤销

**步骤:**

#### 5.1 修改字号撤销
1. 插入文本
2. 修改字号为 24px
3. 按 Ctrl+Z
4. **✅ 字号应该恢复到默认16px**
5. **✅ 文本对象仍然存在**

#### 5.2 移动撤销
1. 拖拽文本到新位置
2. 按 Ctrl+Z
3. **✅ 文本回到原位置**
4. 按 Ctrl+Y
5. **✅ 文本再次移动到新位置**

#### 5.3 插入撤销
1. 插入文本"Test"
2. 按 Ctrl+Z
3. **✅ 文本完全消失**

---

## 🔍 故障排除

### 问题1: 文本框仍然一闪就消失

**可能原因:** stopPropagation 没有生效

**解决方案:**
1. 打开浏览器控制台（DevTools）
2. 查看 console.log 输出
3. 应该看到 "Auto-focusing textarea"
4. 如果看到 "Clicked outside textarea"，说明事件冒泡修复失败

**进一步调试:**
```javascript
// 在 PDFCanvasInteractive.tsx handleMouseDown 中添加更多日志
if (toolMode === 'insert-text') {
  console.log('Before onInsertTextAtPosition');
  onInsertTextAtPosition?.(pageNumber - 1, x, y);
  console.log('After onInsertTextAtPosition');
  e.stopPropagation();
  e.preventDefault(); // 添加这个
  console.log('Events stopped');
  return;
}
```

---

### 问题2: 文本框出现但无法输入

**可能原因:** IME输入法冲突

**解决方案:**
1. 检查 `onCompositionEnd` 事件是否正常
2. 尝试只输入英文（不使用输入法）
3. 如果英文可以，中文不行，说明IME支持有问题

---

### 问题3: 按Enter无反应

**可能原因:** onKeyDown 事件处理有问题

**检查:**
```typescript
onKeyDown={(e) => {
  console.log('Key pressed:', e.key);
  console.log('Is composing:', e.nativeEvent.isComposing);

  if (e.key === 'Escape') {
    e.preventDefault();
    onCancelEditingText?.();
  } else if (e.key === 'Enter' && !e.shiftKey) {
    if (!e.nativeEvent.isComposing) {
      console.log('Enter key detected, finishing editing');
      e.preventDefault();
      onFinishEditingText?.();
    }
  }
}
```

---

### 问题4: 文本对象创建但看不见

**可能原因:**
1. 对象在PDF页面范围外
2. z-index 太低被遮挡
3. 颜色与背景色相同

**检查:**
1. 打开控制台，查看对象创建日志
2. 检查对象的 position 和 size
3. 尝试拖拽看看能否移动

---

## 📊 代码修改摘要

### 关键修复: 事件冒泡阻止

**文件:** `src/components/PDFViewer/PDFCanvasInteractive.tsx`

**修改前:**
```typescript
if (toolMode === 'insert-text') {
  const rect = containerRef.current.getBoundingClientRect();
  const x = (e.clientX - rect.left) / zoom;
  const y = (e.clientY - rect.top) / zoom;
  onInsertTextAtPosition?.(pageNumber - 1, x, y);
  return;
}
```

**修改后:**
```typescript
if (toolMode === 'insert-text') {
  const rect = containerRef.current.getBoundingClientRect();
  const x = (e.clientX - rect.left) / zoom;
  const y = (e.clientY - rect.top) / zoom;
  onInsertTextAtPosition?.(pageNumber - 1, x, y);
  e.stopPropagation();  // ← 关键修复：阻止事件冒泡
  e.preventDefault();   // ← 额外保护：阻止默认行为
  return;
}
```

---

## ✅ 成功标准

文本插入功能完全正常当满足以下所有条件：

- [ ] 点击"插入文本"后鼠标变为text光标
- [ ] 点击PDF后文本框立即出现
- [ ] 文本框保持聚焦，不闪退
- [ ] 可以输入英文
- [ ] 可以输入中文（使用输入法）
- [ ] Enter键确认创建对象
- [ ] ESC键取消编辑
- [ ] 点击外部确认创建对象
- [ ] 创建的文本对象可拖拽
- [ ] 创建的文本对象可调整大小
- [ ] 创建的文本对象可旋转
- [ ] 可以修改字体
- [ ] 可以修改字号
- [ ] 可以删除
- [ ] 所有操作都可以独立撤销/重做

---

## 🎯 如果仍然有问题

请提供以下信息：

1. **控制台日志**
   - 复制所有 console.log 输出
   - 复制所有错误信息

2. **具体现象**
   - 文本框是否出现？
   - 出现后立即消失还是停留一会儿？
   - 能看到文本框但无法输入？

3. **您使用的输入法**
   - 系统输入法（如微软拼音）
   - 第三方输入法（如搜狗拼音）

4. **操作步骤**
   - 详细描述您的每一步操作
   - 什么时候出现问题

根据您的反馈，我会进一步诊断和修复！

---

**总结:** 关键修复是添加了 `e.stopPropagation()` 来阻止事件冒泡，这应该完全解决文本框闪退的问题。请重新测试并告诉我结果。
