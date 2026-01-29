#!/usr/bin/env node
/**
 * 批量翻译工具
 * 用于快速将组件中的英文文本替换为中文翻译调用
 *
 * 使用方法:
 * node scripts/translate.js src/components/Editors/ImageInserter.tsx
 */

const fs = require('fs');
const path = require('path');

// 需要翻译的常见文本映射
const translations = {
  // 通用词汇
  'Insert Image': '插入图片',
  'Insert Text': '插入文本',
  'Select Image': '选择图片',
  'Select PDF': '选择 PDF',
  'Cancel': '取消',
  'OK': '确定',
  'Save': '保存',
  'Delete': '删除',
  'Add': '添加',
  'Remove': '移除',
  'Edit': '编辑',

  // 按钮和操作
  'Insert': '插入',
  'Replace': '替换',
  'Merge': '合并',
  'Export': '导出',
  'Import': '导入',

  // 状态和消息
  'Loading': '加载中',
  'Success': '成功',
  'Error': '错误',
  'Failed to': '失败',
  'successfully': '成功',

  // 表单标签
  'Position': '位置',
  'Size': '尺寸',
  'Width': '宽度',
  'Height': '高度',
  'X': 'X',
  'Y': 'Y',
  'Font Size': '字号',
  'Color': '颜色',
  'Opacity': '透明度',
  'Rotation': '旋转',

  // 错误信息
  'Please select': '请选择',
  'Only': '仅支持',
  'supported': '',
  'Cannot be empty': '不能为空',
  'must be positive': '必须为正数',
};

/**
 * 翻译单个字符串
 */
function translateString(text) {
  // 检查是否在翻译表中
  if (translations[text]) {
    return `translate('${text}')`;
  }

  // 检查是否是模板字符串
  if (text.includes('{') && text.includes('}')) {
    return `translateTemplate('${text}', { /* params */ })`;
  }

  // 未找到翻译，返回原文
  return text;
}

/**
 * 处理文件
 */
function processFile(filePath) {
  console.log(`处理文件: ${filePath}`);

  let content = fs.readFileSync(filePath, 'utf-8');
  let modified = false;

  // 检查是否已导入 translate
  if (!content.includes("from '@/constants/translations'")) {
    // 在导入语句后添加
    const lastImportIndex = content.lastIndexOf('import');
    const endOfImport = content.indexOf('\n', lastImportIndex);
    content = content.slice(0, endOfImport) +
      `\nimport { translate } from '@/constants/translations';` +
      content.slice(endOfImport);
    modified = true;
  }

  // 替换字符串（简单版）
  Object.keys(translations).forEach(eng => {
    const chi = translations[eng];
    // 只替换在 JSX 中的字符串
    const regex = new RegExp(`>'${eng}'`, 'g');
    const regex2 = new RegExp(`>"${eng}"`, 'g');

    if (regex.test(content) || regex2.test(content)) {
      console.log(`  替换: '${eng}' → translate('${eng}')`);
      content = content.replace(/>'/g, `>{translate('`);
      modified = true;
    }
  });

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`✓ 文件已更新`);
  } else {
    console.log(`- 无需更新`);
  }
}

// 主函数
if (process.argv.length < 3) {
  console.log('使用方法: node scripts/translate.js <文件路径>');
  console.log('示例: node scripts/translate.js src/components/Editors/ImageInserter.tsx');
  process.exit(1);
}

const filePath = process.argv[2];
if (!fs.existsSync(filePath)) {
  console.error(`文件不存在: ${filePath}`);
  process.exit(1);
}

processFile(filePath);
console.log('\n完成！请检查文件并手动调整翻译结果。');
