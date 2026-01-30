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
        // Fit entire page within container (maintain aspect ratio)
        return Math.min(
          containerWidth / pageWidth,
          containerHeight / pageHeight
        );

      case 'fit-width':
        // Fit page width to container width
        return containerWidth / pageWidth;

      case 'two-page':
        // Two-page mode: fit two pages side by side
        // Account for gap between pages
        const availableWidth = containerWidth - 20; // 20px gap
        const twoPageWidth = pageWidth * 2;
        return Math.min(
          availableWidth / twoPageWidth,
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
