/**
 * 国际化 Hook
 * 提供简洁的翻译 API
 */

import { t } from '../locales';

/**
 * 使用国际化的 Hook
 * @returns 翻译函数 t
 */
export function useI18n() {
  return { t };
}

/**
 * 导出翻译函数供非组件使用
 */
export { t };
