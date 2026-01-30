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
   * Also handles edge cases like invalid totalPages, NaN, and non-integer values.
   *
   * @param page - The requested page number (1-based, will be truncated to integer)
   * @param totalPages - Total number of pages in the document (must be >= 1, will be truncated to integer)
   * @returns Validated page number (always an integer), or 1 if totalPages is invalid
   *
   * @example
   * ```ts
   * NavigationService.validatePageNumber(0, 10);     // returns 1
   * NavigationService.validatePageNumber(5, 10);     // returns 5
   * NavigationService.validatePageNumber(15, 10);    // returns 10
   * NavigationService.validatePageNumber(5.7, 10);   // returns 5 (truncated)
   * NavigationService.validatePageNumber(5, 0);      // returns 1 (invalid totalPages)
   * NavigationService.validatePageNumber(5, 10.8);   // returns 5 (totalPages truncated)
   * ```
   */
  static validatePageNumber(page: number, totalPages: number): number {
    // Handle invalid totalPages (document not loaded or empty)
    if (!Number.isFinite(totalPages) || totalPages < 1) {
      return 1;
    }

    // Truncate both values to integers to ensure consistent behavior
    const truncatedTotalPages = Math.trunc(totalPages);
    const truncatedPage = Number.isFinite(page) ? Math.trunc(page) : 1;

    // Clamp to valid range [1, totalPages]
    const validated = Math.max(1, Math.min(truncatedPage, truncatedTotalPages));
    return validated;
  }

  /**
   * Calculate target page for navigation with bounds checking
   *
   * Validates the target page is within document bounds. The currentPage
   * parameter is kept for API compatibility and future extensions.
   *
   * @param _currentPage - Current page number (kept for context, unused in calculation)
   * @param targetPage - Desired target page number (1-based, will be truncated to integer)
   * @param totalPages - Total number of pages in the document (must be >= 1, will be truncated to integer)
   * @returns Validated target page number in range [1, totalPages] (always an integer), or 1 if totalPages invalid
   *
   * @example
   * ```ts
   * NavigationService.jumpToPage(5, 10, 20);    // returns 10
   * NavigationService.jumpToPage(5, -5, 20);    // returns 1
   * NavigationService.jumpToPage(5, 100, 20);   // returns 20
   * NavigationService.jumpToPage(5, 10.8, 20);  // returns 10 (truncated)
   * ```
   */
  static jumpToPage(_currentPage: number, targetPage: number, totalPages: number): number {
    return NavigationService.validatePageNumber(targetPage, totalPages);
  }

  /**
   * Format page display text for UI
   *
   * Creates a human-readable string showing current page and total pages
   * in the format "currentPage / totalPages". Values will be clamped to
   * valid range before display to ensure consistency.
   *
   * @param currentPage - Current page number (1-based, will be validated and clamped)
   * @param totalPages - Total number of pages in the document (must be >= 1, will be truncated to integer for display)
   * @returns Formatted display string, or "-" if totalPages is invalid
   *
   * @example
   * ```ts
   * NavigationService.getPageDisplayText(5, 20);    // returns "5 / 20"
   * NavigationService.getPageDisplayText(1, 1);     // returns "1 / 1"
   * NavigationService.getPageDisplayText(5, 0);     // returns "-" (invalid totalPages)
   * NavigationService.getPageDisplayText(100, 20);  // returns "20 / 20" (clamped)
   * NavigationService.getPageDisplayText(NaN, 10);  // returns "1 / 10" (invalid page clamped)
   * ```
   */
  static getPageDisplayText(currentPage: number, totalPages: number): string {
    // Validate totalPages first
    if (!Number.isFinite(totalPages) || totalPages < 1) {
      return '-';
    }

    // Clamp currentPage to valid range [1, totalPages] to ensure display consistency
    const validPage = NavigationService.validatePageNumber(currentPage, totalPages);

    return `${validPage} / ${Math.trunc(totalPages)}`;
  }
}
