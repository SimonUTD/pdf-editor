import * as pdfjsLib from 'pdfjs-dist';

export interface SearchResult {
  pageIndex: number;
  pageNumber: number;
  items: Array<{
    text: string;
    transform: number[];
    bbox: number[];  // [x0, y0, x1, y1]
  }>;
}

export class PDFSearchService {
  private static searchCache: Map<string, SearchResult[]> = new Map();

  /**
   * Clear search cache (call when PDF changes)
   */
  static clearCache(): void {
    this.searchCache.clear();
  }

  /**
   * Search for text in all pages
   */
  static async searchPDF(
    pdfDocument: any,
    searchText: string
  ): Promise<SearchResult[]> {
    if (!searchText.trim()) {
      return [];
    }

    const cacheKey = `${pdfDocument.fingerprints[0]}_${searchText}`;
    if (this.searchCache.has(cacheKey)) {
      return this.searchCache.get(cacheKey)!;
    }

    const results: SearchResult[] = [];
    const totalPages = pdfDocument.numPages;

    for (let i = 1; i <= totalPages; i++) {
      const page = await pdfDocument.getPage(i);
      const textContent = await page.getTextContent();
      const pageResults: SearchResult['items'] = [];

      textContent.items.forEach((item: any) => {
        const str = item.str.toLowerCase();
        const searchLower = searchText.toLowerCase();

        if (str.includes(searchLower)) {
          pageResults.push({
            text: item.str,
            transform: item.transform,
            bbox: [
              item.transform[4],
              item.transform[5] - item.transform[0],
              item.transform[4] + item.transform[0] * item.str.length * 0.6, // Approximate width
              item.transform[5],
            ],
          });
        }
      });

      if (pageResults.length > 0) {
        results.push({
          pageIndex: i - 1,
          pageNumber: i,
          items: pageResults,
        });
      }
    }

    this.searchCache.set(cacheKey, results);
    return results;
  }

  /**
   * Get total match count
   */
  static getTotalMatchCount(results: SearchResult[]): number {
    return results.reduce((sum, result) => sum + result.items.length, 0);
  }
}
