# PDF 编辑器 - 快速开始指南

## 项目简介

这是一个功能完整的跨平台桌面 PDF 编辑器，使用 Electron + React + TypeScript 构建。

## ✅ 已完成功能

### 核心功能（Phase 1）
- ✅ 打开和查看 PDF 文件
- ✅ 分栏布局（缩略图导航）
- ✅ 缩放控制（放大/缩小/适应）
- ✅ 页面选择

### 基础编辑（Phase 2）
- ✅ 保存和另存为
- ✅ 打印 PDF
- ✅ 删除页面
- ✅ 插入空白页
- ✅ 未保存更改提示

### 高级编辑（Phase 3）
- ✅ 插入图片（PNG/JPG）
- ✅ 插入文本
- ✅ 导出为 Word (.docx)
- ✅ 导出为文本 (.txt)
- ✅ 导出为图片 (PNG)

### 专业功能（Phase 4）
- ✅ 合并多个 PDF
- ✅ 添加文本水印
- ✅ 添加图片水印
- ✅ 添加页眉页脚
- ✅ 擦除内容
- ✅ 替换页面
- ✅ 反转页面
- ✅ 添加高亮

## ✅ 最新改进

### 1. 中文界面
- ✅ 完整的简体中文界面
- ✅ Ant Design 组件中文支持
- ✅ 所有提示信息中文化

### 2. 离线运行
- ✅ PDF.js worker 本地化（无需联网）
- ✅ 所有库文件本地打包
- ✅ 无需网络连接即可使用

### 3. 优化的用户体验
- ✅ 清晰的中文提示
- ✅ 友好的错误信息
- ✅ 直观的操作流程

## 开发环境设置

### 前提条件
- Node.js 18+
- pnpm 8+

### 安装依赖
```bash
pnpm install
```

### 开发模式
```bash
pnpm run electron:dev
```

### 构建生产版本
```bash
pnpm run electron:build
```

构建产物位于 `release/` 目录。

## 项目结构

```
pdf-editor/
├── electron/          # Electron 主进程
│   ├── main.ts       # 入口文件
│   ├── preload.ts    # 预加载脚本
│   └── ipc/          # IPC 通信处理
├── src/              # React 应用
│   ├── components/   # UI 组件
│   │   ├── Layout/   # 布局组件（工具栏等）
│   │   ├── PDFViewer/# PDF 查看组件
│   │   └── Editors/  # 编辑功能组件
│   ├── services/     # 业务逻辑
│   ├── stores/       # 状态管理
│   ├── hooks/        # 自定义 Hooks
│   ├── locales/      # 国际化语言包
│   └── constants/    # 常量和翻译
├── public/           # 静态资源
│   └── workers/      # 本地 worker 文件
└── docs/             # 文档
```

## 键盘快捷键

- **Ctrl/Cmd+O** - 打开 PDF
- **Ctrl/Cmd+S** - 保存
- **Ctrl/Cmd+Shift+S** - 另存为
- **Ctrl/Cmd+P** - 打印

## 技术栈

| 类别 | 技术 | 用途 |
|------|------|------|
| 框架 | Electron | 桌面应用框架 |
| UI库 | React 19 | 用户界面 |
| 语言 | TypeScript | 类型安全 |
| 构建工具 | Vite 7 | 快速构建 |
| UI组件 | Ant Design 6 | 企业级UI |
| 状态管理 | Zustand 5 | 轻量状态管理 |
| PDF渲染 | PDF.js 5.4 | PDF 显示 |
| PDF操作 | pdf-lib 1.17 | PDF 编辑 |
| 文档生成 | docx 9.5 | Word 导出 |
| 文件处理 | file-saver | 文件下载 |

## 本地化

项目已配置完整的中文支持：

1. **界面翻译**：所有UI组件都已翻译为中文
2. **Ant Design中文**：使用官方 `zhCN` 语言包
3. **自定义文本**：在 `src/constants/translations.ts` 中管理

### 添加新翻译

编辑 `src/constants/translations.ts`：

```typescript
export const zh = {
  // 添加新的翻译
  'Your English Text': '您的中文文本',
};
```

在组件中使用：

```typescript
import { translate } from '@/constants/translations';

// 简单翻译
<Button>{translate('Your English Text')}</Button>

// 带参数的翻译
const message = translateTemplate('Loaded {name} pages', {name, pages});
```

## 离线运行说明

项目已配置为完全离线运行：

1. **PDF.js Worker 本地化**
   - Worker 文件位于 `public/workers/pdf.worker.min.mjs`
   - 配置使用本地文件而非 CDN

2. **所有依赖本地打包**
   - node_modules 包含所有必需的库
   - Electron 打包时会包含所有依赖

3. **无需网络连接**
   - ✅ 完全本地运行
   - ✅ 不依赖任何外部服务
   - ✅ 适合企业内网环境

## 常见问题

### Q: 如何更改界面语言？
A: 当前版本仅支持中文。如需英文，可以创建 `en_US.ts` 并修改配置。

### Q: 可以在没有网络的电脑上运行吗？
A: 可以！项目已完全本地化，无需网络连接。

### Q: 如何添加新功能？
A: 参考现有 Editors 组件的实现模式：
1. 在 `src/services/pdfEditor.ts` 添加业务逻辑
2. 在 `src/components/Editors/` 创建UI组件
3. 在 `App.tsx` 中集成功能

### Q: 构建后文件多大？
A: 约 150-200 MB，包含 Electron 运行时和所有依赖。

## 开发指南

### 添加新的编辑功能

1. **创建服务方法**
```typescript
// src/services/pdfEditor.ts
static async yourNewFeature(pdfDoc: PDFDocument) {
  // 实现功能
}
```

2. **创建 UI 组件**
```typescript
// src/components/Editors/YourFeature.tsx
import { translate } from '@/constants/translations';

export const YourFeature: React.FC = () => {
  return (
    <Modal title={translate('Your Feature')}>
      {/* 功能UI */}
    </Modal>
  );
};
```

3. **集成到主应用**
```typescript
// src/App.tsx
import { YourFeature } from './components/Editors/YourFeature';

// 添加状态
const [yourFeatureVisible, setYourFeatureVisible] = useState(false);

// 添加处理函数
const handleYourFeature = async () => {
  // 实现逻辑
};

// 在 JSX 中添加组件
<YourFeature
  visible={yourFeatureVisible}
  onClose={() => setYourFeatureVisible(false)}
  onConfirm={handleYourFeature}
/>
```

## 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 许可证

MIT License

## 联系方式

如有问题或建议，请提交 Issue。

---

**享受使用 PDF 编辑器！**
