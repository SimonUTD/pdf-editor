/**
 * NavigationService - Handles page navigation logic for PDF viewer
 *
 * Provides utilities for:
 * - Validating page numbers within document bounds
 * - Calculating safe page jumps with bounds checking
 * - Formatting page display text
 */
export class NavigationService {
  /**
   * Validate and clamp page number to valid range
   *
   * Ensures the page number is within [1, totalPages]. If page is outside
   * this range, it will be clamped to the nearest valid boundary.
   *
   * @param page - The requested page number (1-based)
   * @param totalPages - Total number of pages in the document
   * @returns Validated page number guaranteed to be in [1, totalPages]
   *
   * @example
   * ```ts
   * NavigationService.validatePageNumber(0, 10);    // returns 1
   * NavigationService.validatePageNumber(5, 10);    // returns 5
   * NavigationService.validatePageNumber(15, 10);   // returns 10
   * ```
   */
  static validatePageNumber(page: number, totalPages: number): number {
    const validated = Math.max(1, Math.min(page, totalPages));
    return validated;
  }

  /**
   * Calculate target page for navigation with bounds checking
   *
   * Takes a current page and target page, then validates the target
   * is within document bounds. This is useful for implementing
   * "jump to page" functionality.
   *
   * @param currentPage - Current page number (unused in calculation but kept for context)
   * @param targetPage - Desired target page number (1-based)
   * @param totalPages - Total number of pages in the document
   * @returns Validated target page number
   *
   * @example
   * ```ts
   * NavigationService.jumpToPage(5, 10, 20);    // returns 10
   * NavigationService.jumpToPage(5, -5, 20);    // returns 1
   * NavigationService.jumpToPage(5, 100, 20);   // returns 20
   * ```
   */
  static jumpToPage(currentPage: number, targetPage: number, totalPages: number): number {
    return this.validatePageNumber(targetPage, totalPages);
  }

  /**
   * Format page display text for UI
   *
   * Creates a human-readable string showing current page and total pages
   * in the format "currentPage / totalPages".
   *
   * @param currentPage - Current page number (1-based)
   * @param totalPages - Total number of pages in the document
   * @returns Formatted display string
   *
   * @example
   * ```ts
   * NavigationService.getPageDisplayText(5, 20);  // returns "5 / 20"
   * NavigationService.getPageDisplayText(1, 1);   // returns "1 / 1"
   * ```
   */
  static getPageDisplayText(currentPage: number, totalPages: number): string {
    return `${currentPage} / ${totalPages}`;
  }
}
