# Phase 5: 完整功能增强 - 设计文档

> **创建日期**: 2026-01-30
> **状态**: 设计完成，待实现

---

## 功能概述

本阶段新增17个功能，分为4大类：

### A. 核心查看增强（3个）
1. **查看模式切换** - 1:1/完整显示/宽度100%/双页并排
2. **快捷跳转** - 快速跳转到指定页码
3. **文本搜索** - PDF内全文搜索与高亮

### B. PDF转换工具（4个）
4. **PDF转换器** - PDF转TXT/Word/图片
5. **图片转PDF** - 批量选择、排序、生成PDF
6. **提取图像** - 从PDF提取页面或嵌入图片
7. **JPG转PDF** - 简化版图片转PDF

### C. PDF编辑工具（5个）
8. **PDF拆分** - 从指定页拆分成2个PDF
9. **页面提取** - 支持范围语法（1-9,12,15-20）
10. **页面重排** - 拖拽调整页面顺序
11. **添加页码** - 自定义页码样式和位置
12. **标记密文** - 永久删除敏感信息

### D. 高级功能（5个）
13. **PDF压缩** - 三级压缩（低/中/高）
14. **图像签名** - 在PDF上放置签名图片
15. **密码保护** - 用户密码+所有者密码
16. **移除密码** - 移除PDF密码保护
17. **PDF优化** - 优化结构提升加载速度

---

## 架构设计

### 服务层结构

```
src/services/
├── pdf/                                    # PDF 操作服务
│   ├── PDFSplitService.ts                  # PDF 拆分
│   ├── PDFCompressService.ts               # PDF 压缩
│   ├── PDFSignatureService.ts              # PDF 签名（图像）
│   ├── PDFConvertService.ts                # PDF 转换（txt/Word/图片）
│   ├── ImageToPDFService.ts                # 图片转PDF
│   ├── PDFExtractService.ts                # 从PDF提取图片
│   ├── PDFSecurityService.ts               # 密码保护/移除
│   ├── PDFPageExtractService.ts            # 页面提取（支持范围语法）
│   ├── PDFReorderService.ts                # 页面重排
│   ├── PDFPageNumberService.ts             # 添加页码
│   ├── PDFOptimizeService.ts               # PDF 优化
│   ├── PDFRedactService.ts                 # 标记密文
│   └── PDFSearchService.ts                 # 文本搜索
└── viewer/                                 # 查看增强服务
    ├── ViewModeService.ts                  # 查看模式
    └── NavigationService.ts                # 快捷跳转
```

### UI组件结构

```
src/components/
├── Tools/                                  # 工具面板（新增）
│   └── ToolsPanel.tsx                      # 统一工具入口
├── Modals/                                 # 功能对话框
│   ├── SplitModal.tsx                      # PDF 拆分
│   ├── CompressModal.tsx                   # 压缩选项
│   ├── ConvertModal.tsx                    # 格式转换
│   ├── ImageToPDFModal.tsx                 # 图片转PDF
│   ├── ExtractPagesModal.tsx               # 页面提取
│   ├── ReorderPagesModal.tsx               # 页面重排
│   ├── SecurityModal.tsx                   # 密码保护
│   ├── PageNumberModal.tsx                 # 页码设置
│   └── SearchPanel.tsx                     # 搜索面板
```

---

## 功能详细设计

### A. 核心查看增强

#### 功能15: 查看模式切换

**四种模式：**
- `actual` (1:1) - zoom = 1.0
- `fit-page` (完整显示) - 适应整个页面到窗口
- `fit-width` (宽度100%) - 页面宽度 = 容器宽度
- `two-page` (双页并排) - 同时显示两页

**UI设计：**
- Toolbar 添加查看模式下拉选择器
- 状态保存到 uiStore

**实现要点：**
- 双页模式需修改 PDFCanvasInteractive 渲染逻辑
- 其他模式通过调整 zoom 实现
- 缩放时保持当前页面在视口中心

#### 功能16: 快捷跳转指定页

**UI设计：**
- Toolbar 添加 InputNumber 组件（显示"当前页 / 总页数"）
- 快捷键：Ctrl/Cmd + G
- 输入验证：1 ≤ 页码 ≤ 总页数
- 跳转后平滑滚动 + 高亮目标页缩略图

#### 功能17: PDF内文本搜索

**搜索流程：**
1. 用户输入关键词
2. 使用 `page.getTextContent()` 遍历所有页面
3. 构建搜索索引（页码 + 位置 + 文本片段）
4. 高亮显示匹配项

**数据结构：**
```typescript
interface SearchResult {
  pageIndex: number;
  items: Array<{
    text: string;
    transform: number[];  // PDF坐标
  }>;
}
```

**UI设计：**
- Toolbar 搜索框
- 结果显示："15/25"（当前匹配/总匹配数）
- 上一页/下一页导航按钮
- 黄色高亮匹配项

---

### B. PDF转换工具

#### 功能4: PDF转换器

**PDF → 图片（新增）：**
- 格式：PNG/JPEG/WebP
- DPI：72/150/300/600
- 页面范围：全部/当前页/指定范围
- 批量导出进度条

**增强PDF → TXT/Word：**
- 添加更多导出选项（编码、格式等）

#### 功能5: 图片转PDF

**排序功能（六种）：**
- 文件名升序/降序
- 修改时间升序/降序
- 创建时间升序/降序

**数据结构：**
```typescript
interface ImageFile {
  file: File;
  name: string;
  lastModified: number;
  birthtime?: number;
  preview: string;
}

type SortOption = 'name-asc' | 'name-desc' | 'modified-asc' | 'modified-desc' | 'created-asc' | 'created-desc';
```

**UI设计：**
- 图片网格预览（拖拽排序）
- 排序下拉选择器
- PDF设置：页面大小（A4/Letter/自动）、边距、方向
- 每页一张 or 多张拼页

#### 功能6: 从PDF提取图像

**两种模式：**
1. **批量保存每一页** - 类似PDF→图片
2. **提取嵌入的图片** - 遍历PDF的XObject资源

**模式2实现：**
- 使用 `pdf-lib` 遍历嵌入资源
- 过滤XObject类型为Image的资源
- 导出为独立图片文件

#### 功能14: JPG转PDF

- 功能5的简化版
- 单个或多个JPG → PDF
- 不需要复杂排序界面

---

### C. PDF编辑工具

#### 功能1: PDF拆分

**实现示例：**
```typescript
async splitPDF(doc: PDFDocument, splitPage: number): Promise<[PDFDocument, PDFDocument]> {
  // PDF1: pages [0, splitPage)
  const pdf1 = await PDFDocument.create();
  const pages1 = await pdf1.copyPages(doc, doc.getPageIndices(0, splitPage - 1));
  pages1.forEach(p => pdf1.addPage(p));

  // PDF2: pages [splitPage, end)
  const pdf2 = await PDFDocument.create();
  const pages2 = await pdf2.copyPages(doc, doc.getPageIndices(splitPage));
  pages2.forEach(p => pdf2.addPage(p));

  return [pdf1, pdf2];
}
```

**UI设计：**
- 对话框显示总页数
- 输入拆分位置页码
- 预览：显示两个PDF的页数范围
- 自动生成文件名

#### 功能9: PDF页面提取

**页面范围语法：**
- 单页：`5`
- 连续：`1-9`
- 不连续：`1,3,5,7`
- 混合：`1-3,5,8-10`
- 反向：`10-8` → 8,9,10

**解析器：**
```typescript
function parsePageRange(input: string, totalPages: number): number[] {
  // 解析 "1-9,12,15-20" → [1,2,3,4,5,6,7,8,9,12,15,16,17,18,19,20]
  // 去重、排序、验证范围
}
```

#### 功能10: PDF页面重排

**交互模式：**
- **推荐**：复用缩略图侧边栏，启用拖拽排序
- **备选**：列表模式 + 上下移动按钮

**实现：**
- 使用 `@dnd-kit/core` 或 HTML5 拖拽API
- 操作后重新生成PDF（按新顺序复制页面）

#### 功能11: 添加页码

**页码选项：**
- 位置：上/下/左/右
- 对齐：左/中/右
- 格式：`{page}`、`{page}/{total}`、`第X页`、`Page X of Y`
- 字体：字体家族、大小、颜色
- 起始页：页码从第几页开始
- 页面范围：全部/指定

**实现：**
- 遍历页面，在指定位置绘制文本
- 计算坐标（不同页面尺寸）
- 支持预览

#### 功能13: 标记密文

**操作流程：**
1. 选择"密文标记"工具模式
2. 在PDF上绘制矩形（类似擦除）
3. 确认后永久删除该区域内容

**实现要点：**
- 不仅覆盖视觉，还要删除文本层内容
- 使用 `pdf-lib` 的页面内容删除API
- 不可撤销（警告用户）

---

### D. 高级功能

#### 功能2: PDF压缩

**压缩级别：**
- **低（无损）** - 删除冗余对象
- **中（轻度有损）** - DPI 150，图片质量80%
- **高（重度有损）** - DPI 72，图片质量60%

**实现策略：**
```typescript
interface CompressOptions {
  level: 'low' | 'medium' | 'high';
  imageQuality: number;  // 0-1
  targetDPI?: number;
}
```

**技术方案：**
- 删除未使用的资源
- 重新采样图像（canvas → 降低分辨率 → 替换）
- 压缩对象流
- 线性化PDF

#### 功能3: PDF签署（图像签名）

**增强功能：**
- 签名管理器（保存多个签名）
- 快速插入常用签名
- 签名样式调整（颜色、大小、透明度）

**数据结构：**
```typescript
interface Signature {
  id: string;
  name: string;
  imageData: string;  // base64 PNG
  date: Date;
}

// 存储到 localStorage
const SIGNATURES_KEY = 'pdf_signatures';
```

#### 功能7-8: 密码保护与移除

**密码类型：**
- **用户密码** - 打开PDF时需要
- **所有者密码** - 编辑/打印/复制时需要

**权限控制：**
```typescript
interface SecurityOptions {
  userPassword?: string;
  ownerPassword?: string;
  canPrint?: boolean;
  canModify?: boolean;
  canCopy?: boolean;
  canAnnotate?: boolean;
}
```

**实现注意：**
- `pdf-lib` 加密功能有限
- 可能需要 `qpdf` 命令行工具
- 移除密码需输入原密码

#### 功能12: 优化PDF

**优化内容：**
1. 线性化 - 快速网页查看
2. 删除冗余 - 重复的字体、图像
3. 压缩对象流
4. 优化结构

**与压缩的区别：**
- 压缩：主要降低图像质量
- 优化：改善PDF结构和加载速度

---

## 实现计划

### 阶段1：基础架构（2-3天）
- [ ] 创建服务层目录结构
- [ ] 实现工具面板UI框架（ToolsPanel）
- [ ] 集成到现有命令系统

### 阶段2：查看增强（2-3天）
- [ ] 查看模式切换（功能15）
- [ ] 快捷跳转（功能16）
- [ ] 文本搜索（功能17）

### 阶段3：转换工具（5-7天）
- [ ] PDF→图片（功能4）
- [ ] 图片→PDF（功能5）
- [ ] 从PDF提取图像（功能6）
- [ ] 增强PDF→TXT/Word（功能4）

### 阶段4：编辑工具（7-10天）
- [ ] PDF拆分（功能1）
- [ ] 页面提取（功能9）
- [ ] 页面重排（功能10）
- [ ] 添加页码（功能11）
- [ ] 标记密文（功能13）

### 阶段5：高级功能（7-10天）
- [ ] PDF压缩（功能2）
- [ ] 图像签名（功能3）
- [ ] 密码保护/移除（功能7-8）
- [ ] PDF优化（功能12）

### 阶段6：测试与文档（3-5天）
- [ ] 全面测试
- [ ] 更新文档
- [ ] 性能优化

**预计总时间：26-38天**

---

## 技术依赖

### 需要确认/添加的依赖
- `@dnd-kit/core` - 拖拽排序（页面重排）
- `sharp` - 图像处理（Node.js，压缩功能）
- `qpdf` - PDF加密（命令行工具，可选）

### 现有依赖复用
- `pdf-lib` - PDF操作核心
- `pdfjs-dist` - PDF渲染和文本提取
- `docx` - Word文档生成
- `file-saver` - 文件下载

---

## 注意事项

1. **离线优先** - 所有功能本地处理，不依赖网络
2. **撤销/重做** - 所有可逆操作集成到命令系统
3. **进度反馈** - 长时间操作显示进度条
4. **错误处理** - 友好的错误提示和恢复机制
5. **性能优化** - 大文件操作不阻塞UI
6. **用户体验** - 操作前预览，操作后确认

---

## 文档参考

- [pdf-lib 文档](https://pdf-lib.js.org/)
- [PDF.js 文档](https://mozilla.github.io/pdf.js/)
- [Electron 文件操作](https://www.electronjs.org/docs/latest/tutorial/file-system)

---

**设计完成，准备实施！**
