export const formatFileSize = (value: number | null | undefined) => {
  if (!value || Number.isNaN(value) || value <= 0) {
    return null;
  }

  if (value < 1024) {
    return `${value} B`;
  }

  const units = ['KB', 'MB', 'GB', 'TB'];
  let size = value / 1024;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }

  const digits = size >= 10 ? 0 : 1;

  return `${size.toFixed(digits).replace(/\.0$/, '')} ${units[unitIndex]}`;
};
