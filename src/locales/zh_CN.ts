/**
 * 中文语言包
 * PDF Editor - 简体中文翻译
 */

export default {
  // 通用
  common: {
    ok: '确定',
    cancel: '取消',
    confirm: '确认',
    save: '保存',
    delete: '删除',
    insert: '插入',
    add: '添加',
    remove: '移除',
    edit: '编辑',
    close: '关闭',
    open: '打开',
    export: '导出',
    import: '导入',
    loading: '加载中...',
    success: '成功',
    error: '错误',
    warning: '警告',
    info: '信息',
  },

  // 应用标题
  app: {
    title: 'PDF 编辑器',
    fileName: '文件名',
  },

  // 工具栏
  toolbar: {
    open: '打开',
    save: '保存',
    saveAs: '另存为',
    print: '打印',
    insertImage: '插入图片',
    insertText: '插入文本',
    export: '导出',
    mergePDFs: '合并 PDF',
    watermark: '水印',
    headerFooter: '页眉页脚',
    highlight: '高亮',
    erase: '擦除',
    reversePages: '反转页面',
  },

  // 导出菜单
  export: {
    asImages: '导出为图片 (PNG)',
    asText: '导出为文本 (TXT)',
    asWord: '导出为 Word (DOCX)',
  },

  // 缩放控制
  zoom: {
    zoomIn: '放大',
    zoomOut: '缩小',
    fit: '适应',
    fitWidth: '适应宽度',
    fitPage: '适应页面',
  },

  // 页面操作
  page: {
    page: '页面',
    of: '/',
    deletePage: '删除页面',
    insertBlankPage: '在此后插入空白页',
    replacePage: '替换页面',
    rotatePage: '旋转页面',
  },

  // 图片插入
  imageInserter: {
    title: '插入图片',
    selectImage: '选择图片 (PNG/JPG)',
    selected: '已选择',
    position: '位置 (从左上角)',
    size: '尺寸',
    width: '宽度',
    height: '高度',
    x: 'X',
    y: 'Y',
    onlyPNGJPG: '仅支持 PNG 和 JPG 图片',
    pleaseSelect: '请选择图片文件',
  },

  // 文本插入
  textInserter: {
    title: '插入文本',
    textContent: '文本内容',
    placeholder: '输入要插入的文本...',
    position: '位置 (从左上角)',
    fontSize: '字号',
    textColor: '文本颜色',
    pleaseEnter: '请输入文本内容',
  },

  // PDF 合并
  pdfMerger: {
    title: '合并 PDF 文件',
    addPDFs: '添加 PDF 文件',
    filesToMerge: '要合并的文件 ({count})',
    noFiles: '尚未添加 PDF 文件',
    readyToMerge: '准备合并 {count} 个 PDF 文件',
    minimumTwo: '请至少添加 2 个 PDF 文件进行合并',
    merged: 'PDF 合并成功',
    failed: '合并 PDF 失败',
    onlyPDF: '仅支持 PDF 文件',
    failedToRead: '读取 PDF 文件失败',
  },

  // 水印编辑器
  watermarkEditor: {
    title: '添加水印',
    textWatermark: '文本水印',
    imageWatermark: '图片水印',
    watermarkText: '水印文本',
    fontSize: '字号',
    opacity: '透明度',
    rotation: '旋转 (度)',
    textColor: '文本颜色',
    position: '位置',
    diagonal: '对角线 (居中)',
    center: '居中 (水平)',
    top: '顶部',
    bottom: '底部',
    topLeft: '左上',
    topRight: '右上',
    bottomLeft: '左下',
    bottomRight: '右下',
    watermarkImage: '水印图片',
    selectImage: '选择图片 (PNG/JPG)',
    textRequired: '请输入水印文本',
    selectImageRequired: '请选择图片文件',
    onlyPNGJPG: '仅支持 PNG 和 JPG 图片',
    added: '水印添加成功',
    failed: '添加水印失败',
  },

  // 页眉页脚编辑器
  headerFooterEditor: {
    title: '页眉页脚',
    addHeader: '添加页眉',
    addFooter: '添加页脚',
    headerText: '页眉文本',
    footerText: '页脚文本',
    placeholders: '占位符',
    pagePlaceholder: '页码',
    totalPlaceholder: '总页数',
    fontSize: '字号',
    color: '颜色',
    alignment: '对齐方式',
    left: '左对齐',
    center: '居中对齐',
    right: '右对齐',
    margin: '边距',
    textRequired: '文本不能为空',
    added: '添加成功',
    failed: '添加失败',
  },

  // 内容擦除器
  contentEraser: {
    title: '擦除内容',
    eraseRegion: '擦除区域',
    position: '位置 (从左上角)',
    size: '尺寸',
    info: '此操作将在页面上绘制白色矩形以擦除指定区域的内容',
    x: 'X',
    y: 'Y',
    width: '宽度',
    height: '高度',
    erased: '内容擦除成功',
    failed: '擦除内容失败',
  },

  // 高亮工具
  highlightTool: {
    title: '添加高亮',
    highlightRegion: '高亮区域',
    position: '位置 (从左上角)',
    size: '尺寸',
    color: '颜色',
    opacity: '透明度',
    x: 'X',
    y: 'Y',
    width: '宽度',
    height: '高度',
    added: '高亮添加成功',
    failed: '添加高亮失败',
  },

  // 页面替换器
  pageReplacer: {
    title: '替换页面',
    replacePage: '替换页面 {page}',
    sourcePDF: '源 PDF 文件',
    selectPDF: '选择 PDF 文件',
    sourcePageNumber: '源页码',
    info: '此操作将用另一个 PDF 文件的页面替换当前文档中的页面 {page}',
    selected: '已选择',
    pleaseSelect: '请选择源 PDF 文件',
    onlyPDF: '仅支持 PDF 文件',
    replaced: '页面 {page} 替换成功',
    failed: '替换页面失败',
  },

  // 消息提示
  messages: {
    fileLoaded: '已加载 {name} ({pages} 页)',
    fileSaved: '文件保存成功',
    saveFailed: '保存失败: {error}',
    noFileToSave: '没有文件可保存',
    pageDeleted: '页面 {page} 已删除',
    cannotDeleteLast: '不能删除最后一页',
    confirmDelete: '确定要删除页面 {page} 吗？',
    blankPageInserted: '已在页面 {page} 后插入空白页',
    imageInserted: '图片插入成功',
    textInserted: '文本插入成功',
    insertFailed: '插入失败',
    noPDFLoaded: '未加载 PDF',
    exportSuccess: '导出成功',
    exportFailed: '导出失败',
    printFailed: '打印失败',
    unsavedChanges: '未保存的更改',
    unsavedChangesMessage: '您有未保存的更改。要继续吗？',
    pageReversed: '页面顺序已反转',
    confirmReverse: '确定要反转所有页面的顺序吗？',
  },

  // 错误信息
  errors: {
    loadPDFFailed: '加载 PDF 失败',
    savePDFFailed: '保存 PDF 失败',
    printFailed: '打印失败',
    exportFailed: '导出失败',
    invalidFileType: '无效的文件类型',
    fileTooLarge: '文件过大',
    operationFailed: '操作失败',
    unknownError: '未知错误',
  },

  // 快捷键
  shortcuts: {
    open: '打开 PDF 文件',
    save: '保存',
    saveAs: '另存为',
    print: '打印',
    undo: '撤销',
    redo: '重做',
  },
};
