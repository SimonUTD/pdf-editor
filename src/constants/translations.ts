/**
 * 中文翻译常量
 * 用于快速替换所有英文文本为中文
 */

export const zh = {
  // 应用标题
  'PDF Editor': 'PDF 编辑器',

  // 工具栏按钮
  'Open PDF': '打开 PDF',
  'Save': '保存',
  'Save As': '另存为',
  'Print': '打印',
  'Insert Image': '插入图片',
  'Insert Text': '插入文本',
  'Export': '导出',
  'Merge PDFs': '合并 PDF',
  'Watermark': '水印',
  'Header/Footer': '页眉页脚',
  'Highlight': '高亮',
  'Erase': '擦除',
  'Reverse Pages': '反转页面',
  'Fit': '适应',

  // 导出选项
  'Export as Images (PNG)': '导出为图片 (PNG)',
  'Export as Text (TXT)': '导出为文本 (TXT)',
  'Export as Word (DOCX)': '导出为 Word (DOCX)',

  // 缩放
  'Zoom In': '放大',
  'Zoom Out': '缩小',

  // 页面操作
  'Delete Page': '删除页面',
  'Insert Blank Page After': '在此后插入空白页',
  'Replace Page': '替换页面',

  // 消息提示
  'Unsaved Changes': '未保存的更改',
  'You have unsaved changes. Do you want to continue?': '您有未保存的更改。要继续吗？',
  'Loaded {name} ({pages} pages)': '已加载 {name} ({pages} 页)',
  'Failed to load PDF file': '加载 PDF 文件失败',
  'No file to save': '没有文件可保存',
  'File saved successfully': '文件保存成功',
  'Failed to save: {error}': '保存失败: {error}',
  'Failed to save PDF file': '保存 PDF 文件失败',
  'Failed to print PDF': '打印 PDF 失败',
  'No PDF loaded': '未加载 PDF',
  'Cannot delete the last page': '不能删除最后一页',
  'Are you sure you want to delete page {pageNumber}?': '确定要删除页面 {pageNumber} 吗？',
  'Page {pageNumber} deleted': '页面 {pageNumber} 已删除',
  'Failed to delete page': '删除页面失败',
  'Blank page inserted after page {afterPageNumber}': '已在页面 {afterPageNumber} 后插入空白页',
  'Failed to insert blank page': '插入空白页失败',
  'Image inserted successfully': '图片插入成功',
  'Failed to insert image': '插入图片失败',
  'Text inserted successfully': '文本插入成功',
  'Failed to insert text': '插入文本失败',
  'Exported {totalPages} pages as images': '已导出 {totalPages} 页为图片',
  'Failed to export as images': '导出为图片失败',
  'Exported as text file': '已导出为文本文件',
  'Failed to export as text': '导出为文本失败',
  'Exported as Word document': '已导出为 Word 文档',
  'Failed to export as Word': '导出为 Word 失败',
  'PDFs merged successfully': 'PDF 合并成功',
  'Failed to merge PDFs': '合并 PDF 失效',
  'Reverse Page Order': '反转页面顺序',
  'Are you sure you want to reverse the order of all pages?': '确定要反转所有页面的顺序吗？',
  'Pages reversed successfully': '页面顺序已反转',
  'Failed to reverse pages': '反转页面失败',

  // 模态框标题
  'Merge PDF Files': '合并 PDF 文件',
  'Add Watermark': '添加水印',
  'Erase Content': '擦除内容',
  'Add Highlight': '添加高亮',
  'Replace Page {page}': '替换页面 {page}',

  // 表单和输入
  'Select Image (PNG/JPG)': '选择图片 (PNG/JPG)',
  'Select PDF File': '选择 PDF 文件',
  'Selected:': '已选择',
  'Please select an image file': '请选择图片文件',
  'Only PNG and JPG images are supported': '仅支持 PNG 和 JPG 图片',
  'Please enter text content': '请输入文本内容',
  'Only PDF files are supported': '仅支持 PDF 文件',
  'Please select a source PDF file': '请选择源 PDF 文件',
  'Please add at least 2 PDF files to merge': '请至少添加 2 个 PDF 文件进行合并',
  'Width and height must be positive': '宽度和高度必须为正数',
  'Content erased successfully': '内容擦除成功',
  'Failed to erase content': '擦除内容失败',
  'Highlight added successfully': '高亮添加成功',
  'Failed to add highlight': '添加高亮失败',
  'Added {name}': '已添加 {name}',
  'Failed to read PDF file': '读取 PDF 文件失败',

  // 水印相关
  'Watermark Text': '水印文本',
  'Please enter watermark text': '请输入水印文本',
  'Text watermark added successfully': '文本水印添加成功',
  'Image watermark added successfully': '图片水印添加成功',
  'Failed to add watermark': '添加水印失败',

  // 页眉页脚
  'Please enter {activeTab} text': '请输入{activeTab}文本',
  'Header added successfully': '页眉添加成功',
  'Footer added successfully': '页脚添加成功',
  'Failed to add {activeTab}': '添加{activeTab}失败',

  // 页面替换
  'Selected {name}': '已选择 {name}',
  'Page {currentPageNumber} replaced successfully': '页面 {currentPageNumber} 替换成功',
  'Failed to replace page': '替换页面失败',

  // 空状态
  'Open a PDF file to get started': '打开 PDF 文件开始使用',
  'No pages': '无页面',
};

/**
 * 简单的翻译函数
 * @param text 英文文本
 * @returns 中文文本，如果未找到则返回原文
 */
export function translate(text: string): string {
  return zh[text as keyof typeof zh] || text;
}

/**
 * 带参数的翻译函数
 * @param template 模板字符串
 * @param params 参数
 * @returns 翻译后的文本
 */
export function translateTemplate(template: string, params: Record<string, string | number>): string {
  const translated = translate(template);
  return translated.replace(/\{(\w+)\}/g, (match, key) => {
    return key in params ? String(params[key]) : match;
  });
}
