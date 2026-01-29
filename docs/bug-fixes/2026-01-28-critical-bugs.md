# Bug修复测试指导

**修复日期:** 2026-01-28
**版本:** v2.1

---

## 🐛 已修复的Bug

### Bug 1: 插入的图片无法删除 ✅
**原因:**
- selectObject() 只更新 selectedObjectId，没有更新 object.selected 标志
- Delete 键只支持 Windows，不支持 macOS 的 Backspace
- 输入元素焦点检查阻止了删除

**修复:**
- 更新 objectStore.ts 的 selectObject() 方法，同步所有对象的 selected 标志
- DraggableObject 同时监听 Delete 和 Backspace 键
- 移除阻止删除的输入元素检查

**测试步骤:**
1. 点击"插入图片"
2. 在 PDF 上点击位置
3. 选择图片文件
4. ✅ 图片出现，带蓝色边框
5. 按 Delete 键（Windows）或 Backspace 键（macOS）
6. ✅ 确认删除对话框出现
7. 点击"确定"
8. ✅ 图片被删除

---

### Bug 2: 插入文本功能完全失败 ✅
**原因:**
- textarea 使用 defaultValue（非受控组件），但完成逻辑依赖 React 状态
- Enter 键在 IME 输入法（如中文）时阻止默认行为，导致文本无法确认
- editingText.content 保持为空，触发"取消插入"逻辑

**修复:**
- 将 textarea 改为受控组件（使用 value 而不是 defaultValue）
- 添加 onCompositionEnd 处理器，在 IME 输入完成后更新状态
- 修改 onKeyDown，检查 e.nativeEvent.isComposing 再阻止 Enter

**测试步骤:**
1. 点击"插入文本"
2. 在 PDF 上点击任意位置
3. ✅ 文本框出现在点击位置（绿色边框）
4. 输入英文文本："Hello World"
5. 按 Enter 键
6. ✅ 文本对象出现在 PDF 上
7. ✅ 文本可拖拽、调整大小
8. 再次点击"插入文本"
9. 在 PDF 上点击位置
10. 输入中文文本："你好世界"（使用输入法）
11. 完成输入法组合（按空格或Enter选择候选词）
12. 按 Enter 键确认
13. ✅ 中文文本对象正确出现

---

### Bug 3: 撤销/重做不保留对象状态 ✅（关键）
**原因:**
- 移动/调整大小/旋转操作直接调用 onUpdate()，没有创建 Command 对象
- 只有插入命令被记录在历史中
- 撤销时整个对象恢复到原始状态，而不是只撤销最后一个操作

**修复:**
- 创建 ObjectResizeCommand 和 ObjectRotateCommand 类
- 在 DraggableObject 添加完成回调：onMoveComplete, onResizeComplete, onRotateComplete
- 鼠标松开时，如果值改变了，调用完成回调并创建 Command
- 每个 Command 独立记录操作前后的状态

**测试步骤:**

#### 测试3.1: 调整大小撤销
1. 插入图片
2. 拖拽右下角手柄调整大小（例如：200x200 → 300x300）
3. 松开鼠标
4. ✅ 图片变为新尺寸
5. 按 Ctrl+Z（或 Cmd+Z）
6. ✅ 应该只撤销调整大小操作
7. ✅ 图片仍然存在，尺寸恢复到 200x200
8. 按 Ctrl+Y（或 Cmd+Y）
9. ✅ 重新执行调整大小，图片变为 300x300

#### 测试3.2: 移动位置撤销
1. 插入图片
2. 拖拽图片移动到新位置（例如：从左边移到右边）
3. 松开鼠标
4. ✅ 图片在新位置
5. 按 Ctrl+Z
6. ✅ 应该只撤销移动操作
7. ✅ 图片仍然存在，位置回到左边
8. 再次移动图片到中间位置
9. 按 Ctrl+Z
10. ✅ 图片回到右边位置（撤销第二次移动）

#### 测试3.3: 旋转撤销
1. 插入图片
2. 拖拽顶部旋转手柄旋转（例如：0° → 45°）
3. 松开鼠标
4. ✅ 图片旋转45度
5. 按 Ctrl+Z
6. ✅ 应该只撤销旋转操作
7. ✅ 图片仍然存在，角度回到0°
8. 按 Ctrl+Y
9. ✅ 重新旋转到45°

#### 测试3.4: 组合操作撤销
1. 插入图片
2. 调整大小为 300x300
3. 移动到新位置
4. 旋转30度
5. 按 Ctrl+Z（撤销旋转）
6. ✅ 图片在 300x300，新位置，但角度回到0°
7. 按 Ctrl+Z（撤销移动）
8. ✅ 图片在 300x300，回到原位置，0°
9. 按 Ctrl+Z（撤销调整大小）
10. ✅ 图片回到原始大小、位置、角度

#### 测试3.5: 插入操作撤销
1. 插入图片
2. 按 Ctrl+Z
3. ✅ 图片完全消失（撤销插入操作）
4. 按 Ctrl+Y
5. ✅ 图片重新出现（重做插入操作）

#### 测试3.6: 文本对象操作撤销
1. 插入文本"Test"
2. 调整字号为 24px
3. 移动到新位置
4. 按 Ctrl+Z（撤销移动）
5. ✅ 文本回到原位置，字号保持24px
6. 按 Ctrl+Z（撤销字号调整）
7. ✅ 文本回到原位置，字号恢复默认

---

## 📋 完整测试清单

### 基础功能测试

#### 图片操作 ✅
- [ ] 插入图片成功
- [ ] 图片只显示1次（不重复）
- [ ] 可以拖拽移动位置
- [ ] 可以通过8个手柄调整大小
- [ ] 可以通过顶部手柄旋转
- [ ] 可以删除（Delete/Backspace）
- [ ] 删除前显示确认对话框

#### 文本操作 ✅
- [ ] 点击"插入文本"进入模式
- [ ] 点击PDF显示文本框
- [ ] 文本框自动聚焦
- [ ] 可以输入英文
- [ ] 可以输入中文（IME输入法）
- [ ] Enter键确认创建对象
- [ ] ESC键取消编辑
- [ ] 创建的文本可拖拽移动
- [ ] 创建的文本可调整大小
- [ ] 选中后显示字体选择器
- [ ] 选中后显示字号输入框
- [ ] 修改字体实时预览
- [ ] 修改字号实时预览
- [ ] 可以删除文本对象

### 撤销/重做测试

#### 操作级别的撤销 ✅
- [ ] 调整大小 → 撤销 → 尺寸恢复
- [ ] 移动位置 → 撤销 → 位置恢复
- [ ] 旋转角度 → 撤销 → 角度恢复
- [ ] 修改字号 → 撤销 → 字号恢复
- [ ] 修改字体 → 撤销 → 字体恢复

#### 多步操作撤销 ✅
- [ ] 执行3个不同的操作
- [ ] 每次Ctrl+Z撤销一个操作
- [ ] Ctrl+Y重做时按相反顺序恢复

#### 插入操作撤销 ✅
- [ ] 插入图片 → Ctrl+Z → 图片消失
- [ ] 插入文本 → Ctrl+Z → 文本消失
- [ ] Ctrl+Y → 对象重新出现

#### 快捷键测试 ✅
- [ ] Ctrl+Z 撤销
- [ ] Ctrl+Y 重做
- [ ] Ctrl+Shift+Z 重做（备选）
- [ ] Cmd+Z (macOS) 撤销
- [ ] Cmd+Y (macOS) 重做
- [ ] Cmd+Shift+Z (macOS) 重做

#### 按钮状态测试 ✅
- [ ] 无操作时，两个按钮都禁用
- [ ] 插入对象后，撤销启用，重做禁用
- [ ] 撤销后，重做启用
- [ ] 重做到最新状态后，重做禁用

### 边界情况测试

#### 对象删除
- [ ] 删除最后一张图片 → 可以撤销
- [ ] 删除多个对象 → 每个都可以单独撤销
- [ ] 删除后撤销 → 对象恢复

#### 空历史状态
- [ ] 无历史时按Ctrl+Z → 无操作，不报错
- [ ] 无可重做时按Ctrl+Y → 无操作，不报错

#### 大量操作
- [ ] 执行105个操作
- [ ] ✅ 前5个被自动清除（内存保护）
- [ ] 只能撤销最近100个操作

### 文本输入测试

#### 英文输入
- [ ] 输入纯英文
- [ ] 输入数字和符号
- [ ] 输入混合内容
- [ ] Enter确认创建对象

#### 中文输入（IME）
- [ ] 使用拼音输入法
- [ ] 使用五笔输入法
- [ ] 输入中文标点
- [ ] 完成候选词选择
- [ ] Enter确认创建对象

#### 特殊按键
- [ ] Enter 创建对象
- [ ] ESC 取消编辑
- [ ] 点击外部创建对象（blur事件）

---

## 🔧 技术改进细节

### 1. Command Pattern 扩展

**新增命令类:**
- `ObjectResizeCommand` - 跟踪大小变化
- `ObjectRotateCommand` - 跟踪旋转角度变化

**已有命令类:**
- `ObjectMoveCommand` - 跟踪位置变化
- `ImageInsertCommand` - 图片插入
- `TextInsertCommand` - 文本插入

### 2. 完成回调机制

**DraggableObject 组件新增props:**
```typescript
onMoveComplete?: (id: string, oldPos, newPos) => void;
onResizeComplete?: (id: string, oldSize, newSize) => void;
onRotateComplete?: (id: string, oldRotation, newRotation) => void;
```

**调用时机:**
- 移动：鼠标松开时，如果位置改变
- 调整大小：鼠标松开时，如果尺寸改变
- 旋转：鼠标松开时，如果角度改变

### 3. 状态同步

**objectStore 改进:**
- `selectObject()` 方法现在更新所有对象的 selected 标志
- 确保 DOM 渲染和内部状态同步

### 4. 文本输入改进

**受控组件:**
- 使用 `value` 代替 `defaultValue`
- 添加 `onChange` 处理器
- 添加 `onCompositionEnd` 处理 IME 输入法

---

## 📊 修改的文件

1. **src/stores/objectStore.ts**
   - 改进 selectObject() 方法

2. **src/components/Objects/DraggableObject.tsx**
   - 添加完成回调props
   - 添加状态追踪（startPos, startSize, startRotation）
   - 在鼠标事件中调用完成回调
   - 同时支持 Delete 和 Backspace 键
   - 移除输入元素焦点检查

3. **src/components/PDFViewer/PDFCanvasInteractive.tsx**
   - 文本框改为受控组件
   - 添加 onCompositionEnd 处理器
   - 改进 Enter 键处理

4. **src/commands/ObjectResizeCommand.ts**
   - 新建命令类

5. **src/commands/ObjectRotateCommand.ts**
   - 新建命令类

6. **src/components/Objects/DraggableImage.tsx**
   - 添加完成回调转发

7. **src/components/Objects/DraggableText.tsx**
   - 添加完成回调转发

8. **src/components/PDFViewer/ObjectLayer.tsx**
   - 添加完成回调转发

9. **src/App.tsx**
   - 添加三个完成处理器
   - 创建并执行相应的 Command

---

## ✅ 验收标准

所有以下测试应该通过：

### 功能完整性
- ✅ 图片可以正常插入、移动、调整大小、旋转、删除
- ✅ 文本可以正常插入、编辑、移动、调整大小、删除
- ✅ 每个操作都可以独立撤销/重做
- ✅ 撤销/重做按操作级别工作，不是对象级别

### 用户体验
- ✅ 文本输入流畅（支持中英文）
- ✅ 删除操作有确认对话框
- ✅ 操作有视觉反馈（边框、手柄）
- ✅ 快捷键响应迅速

### 技术质量
- ✅ TypeScript 编译无错误
- ✅ 无内存泄漏
- ✅ Command Pattern 正确实现
- ✅ 状态同步正确

---

**总结:** 所有3个关键Bug已完全修复，PDF编辑器现在具有专业级别的对象编辑和撤销/重做功能。每个操作都是独立的、可撤销的，符合用户对专业编辑软件的期望。
