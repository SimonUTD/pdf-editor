export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

export const getPageLabel = (pageNumber: number, totalPages: number): string => {
  return `Page ${pageNumber} of ${totalPages}`;
};

export const calculateFitToWidthScale = (
  pageWidth: number,
  containerWidth: number
): number => {
  return containerWidth / pageWidth;
};

export const calculateFitToPageScale = (
  pageWidth: number,
  pageHeight: number,
  containerWidth: number,
  containerHeight: number
): number => {
  const widthScale = containerWidth / pageWidth;
  const heightScale = containerHeight / pageHeight;
  return Math.min(widthScale, heightScale);
};
