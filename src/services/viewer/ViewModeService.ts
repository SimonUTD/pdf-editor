export type ViewMode = 'actual' | 'fit-page' | 'fit-width' | 'two-page';

export interface ViewModeConfig {
  mode: ViewMode;
  zoom: number;
}

export class ViewModeService {
  /**
   * Calculate zoom level for given view mode
   */
  static calculateZoom(
    mode: ViewMode,
    pageWidth: number,
    pageHeight: number,
    containerWidth: number,
    containerHeight: number
  ): number {
    switch (mode) {
      case 'actual':
        return 1.0;

      case 'fit-page':
        return Math.min(
          containerWidth / pageWidth,
          containerHeight / pageHeight
        );

      case 'fit-width':
        return containerWidth / pageWidth;

      case 'two-page':
        // Two-page mode: fit two pages side by side
        const twoPageWidth = pageWidth * 2 + 20; // 20px gap
        return Math.min(
          twoPageWidth / containerWidth,
          containerHeight / pageHeight
        );

      default:
        return 1.0;
    }
  }

  /**
   * Check if mode requires special rendering
   */
  static isSpecialMode(mode: ViewMode): boolean {
    return mode === 'two-page';
  }
}
