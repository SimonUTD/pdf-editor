/**
 * 国际化配置
 */

import zh_CN from './zh_CN';

export const locales = {
  zh_CN,
};

export type Locale = keyof typeof locales;

export const defaultLocale: Locale = 'zh_CN';

/**
 * 获取翻译文本
 * @param key 翻译键，使用点号分隔的路径，例如 'common.ok'
 * @param params 参数对象，用于替换字符串中的占位符
 * @returns 翻译后的文本
 */
export function t(key: string, params?: Record<string, string | number>): string {
  const keys = key.split('.');
  let value: any = locales[defaultLocale];

  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k];
    } else {
      console.warn(`Translation key not found: ${key}`);
      return key;
    }
  }

  if (typeof value !== 'string') {
    console.warn(`Translation value is not a string: ${key}`);
    return key;
  }

  // 替换占位符
  if (params) {
    return value.replace(/\{(\w+)\}/g, (match, paramKey) => {
      return paramKey in params ? String(params[paramKey]) : match;
    });
  }

  return value;
}

/**
 * 获取当前语言
 */
export function getCurrentLocale(): Locale {
  return defaultLocale;
}
