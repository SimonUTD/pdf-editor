/**
 * 中文翻译映射表 - 用于所有用户可见的文本
 */

export const messages = {
  // 文件操作
  'Unsaved Changes': '未保存的更改',
  'You have unsaved changes. Do you want to continue?': '您有未保存的更改。要继续吗？',

  // 文件加载
  'Loaded {name} ({pages} pages)': '已加载 {name} ({pages} 页)',
  'Failed to load PDF file': '加载 PDF 文件失败',

  // 文件保存
  'No file to save': '没有文件可保存',
  'File saved successfully': '文件保存成功',
  'Failed to save: {error}': '保存失败: {error}',
  'Failed to save PDF file': '保存 PDF 文件失败',

  // 打印
  'Failed to print PDF': '打印 PDF 失败',

  // 页面操作
  'No PDF loaded': '未加载 PDF',
  'Cannot delete the last page': '不能删除最后一页',
  'Delete Page': '删除页面',
  'Are you sure you want to delete page {pageNumber}?': '确定要删除页面 {pageNumber} 吗？',
  'Page {pageNumber} deleted': '页面 {pageNumber} 已删除',
  'Failed to delete page': '删除页面失败',

  'Blank page inserted after page {afterPageNumber}': '已在页面 {afterPageNumber} 后插入空白页',
  'Failed to insert blank page': '插入空白页失败',

  // 插入功能
  'Image inserted successfully': '图片插入成功',
  'Failed to insert image': '插入图片失败',
  'Text inserted successfully': '文本插入成功',
  'Failed to insert text': '插入文本失败',

  // 导出
  'Exported {totalPages} pages as images': '已导出 {totalPages} 页为图片',
  'Failed to export as images': '导出为图片失败',
  'Exported as text file': '已导出为文本文件',
  'Failed to export as text': '导出为文本失败',
  'Exported as Word document': '已导出为 Word 文档',
  'Failed to export as Word': '导出为 Word 失败',

  // PDF 操作
  'PDFs merged successfully': 'PDF 合并成功',
  'Failed to merge PDFs': '合并 PDF 失败',

  // 页面反转
  'Reverse Page Order': '反转页面顺序',
  'Are you sure you want to reverse the order of all pages?': '确定要反转所有页面的顺序吗？',
  'Pages reversed successfully': '页面顺序已反转',
  'Failed to reverse pages': '反转页面失败',

  // 擦除和高亮
  '擦除成功': '擦除成功',
  'Failed to erase content': '擦除内容失败',
  '高亮添加成功': '高亮添加成功',

  // 通用错误
  'Operation failed': '操作失败',
  'Unknown error': '未知错误',

  // Modal 按钮文本
  'Confirm': '确认',
  'OK': '确定',
  'Cancel': '取消',

  // Modal 标题
  'Insert Image': '插入图片',
  'Insert Text': '插入文本',
  'Merge PDF Files': '合并 PDF 文件',
  'Add Watermark': '添加水印',
  'Add Header/Footer': '添加页眉页脚',
  'Replace Page': '替换页面',

  // 基本术语
  'Header': '页眉',
  'Footer': '页脚',

  // 图片插入器消息
  'Please select an image file': '请选择图片文件',
  'Only PNG and JPG images are supported': '仅支持 PNG 和 JPG 图片',
  'Select Image (PNG/JPG)': '选择图片 (PNG/JPG)',
  'Selected:': '已选择:',
  'Position (from top-left):': '位置（从左上角）:',
  'Size:': '尺寸:',
  'Width:': '宽度:',
  'Height:': '高度:',

  // 文本插入器消息
  'Please enter text content': '请输入文本内容',
  'Text Content:': '文本内容:',
  'Enter text to insert...': '输入要插入的文本...',
  'Font Size:': '字体大小:',
  'Text Color:': '文本颜色:',

  // PDF 合并器消息
  'Only PDF files are supported': '仅支持 PDF 文件',
  'Added {name}': '已添加 {name}',
  'Failed to read PDF file': '读取 PDF 文件失败',
  'Please add at least 2 PDF files to merge': '请至少添加 2 个 PDF 文件进行合并',
  'Add PDF Files': '添加 PDF 文件',
  'Files to merge ({count}):': '要合并的文件 ({count}):',
  'No PDF files added yet': '尚未添加 PDF 文件',
  'Merge PDFs': '合并 PDF',
  'Ready to merge {count} PDF files': '准备合并 {count} 个 PDF 文件',

  // 水印编辑器消息
  'Please enter watermark text': '请输入水印文本',
  'Text watermark added successfully': '文本水印添加成功',
  'Please select a watermark image file': '请选择水印图片文件',
  'Image watermark added successfully': '图片水印添加成功',
  'Failed to add watermark': '添加水印失败',
  'Watermark Type:': '水印类型:',
  'Text Watermark': '文本水印',
  'Image Watermark': '图片水印',
  'Watermark Text:': '水印文本:',
  'Enter watermark text...': '输入水印文本...',
  'Opacity:': '不透明度:',
  'Rotation (degrees):': '旋转角度（度）:',
  'Position:': '位置:',
  'Diagonal (Center)': '对角线（居中）',
  'Center (Horizontal)': '居中（水平）',
  'Watermark Image:': '水印图片:',

  // 页眉页脚编辑器消息
  'Please enter {type} text': '请输入{type}文本',
  'Header added successfully': '页眉添加成功',
  'Footer added successfully': '页脚添加成功',
  'Failed to add {type}': '添加{type}失败',
  'Header Text:': '页眉文本:',
  'Footer Text:': '页脚文本:',
  'Use {page} for page number, {total} for total pages': '使用 {page} 表示页码，{total} 表示总页数',
  'Tip: Use {page} for page number and {total} for total pages': '提示：使用 {page} 表示页码，{total} 表示总页数',
  'Alignment:': '对齐方式:',
  'Left': '左对齐',
  'Center': '居中',
  'Right': '右对齐',
  'Margin:': '边距:',
  'points': '磅',

  // 页面替换器消息
  'Please select a source PDF file': '请选择源 PDF 文件',
  'Selected {name}': '已选择 {name}',
  'Page {pageNumber} replaced successfully': '页面 {pageNumber} 替换成功',
  'Failed to replace page': '替换页面失败',
  'Replace Current Page': '替换当前页面',
  'This will replace page {pageNumber} in the current document with a page from another PDF file.': '这将用另一个 PDF 文件的页面替换当前文档的第 {pageNumber} 页。',
  'Source PDF File:': '源 PDF 文件:',
  'Select PDF File': '选择 PDF 文件',
  'Source Page Number:': '源页码:',

  // 工具模式
  'Exit Erase': '退出擦除',
  'Exit Highlight': '退出高亮',
  'Erase Mode': '擦除模式',
  'Highlight Mode': '高亮模式',

  // 操作提示
  'Drag to draw a box on the PDF': '在 PDF 上拖拽绘制矩形框',
  'Click on PDF to insert': '点击 PDF 位置插入',
  'Press ESC to exit': '按 ESC 退出',
  'Open a PDF file to get started': '打开 PDF 文件开始使用',
  'Top Left': '左上',
  'Top Right': '右上',
  'Bottom Left': '左下',
  'Bottom Right': '右下',
  'Top': '顶部',
  'Bottom': '底部',
};

/**
 * 获取翻译后的文本
 */
export function getMessage(key: string, params?: Record<string, string | number>): string {
  let text = messages[key as keyof typeof messages] || key;

  // 替换参数占位符
  if (params) {
    Object.entries(params).forEach(([param, value]) => {
      text = text.replace(`{${param}}`, String(value));
    });
  }

  return text;
}
