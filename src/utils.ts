/**
 * Formats a byte number into a human-readable size string.
 */
export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Calculates percentage savings between old size and new size.
 */
export function calculateSavings(original: number, converted: number | null): number {
  if (!converted || original <= 0) return 0;
  const diff = original - converted;
  const percent = (diff / original) * 100;
  return Math.max(0, parseFloat(percent.toFixed(1)));
}

/**
 * Generates unique filenames when duplicate files are added.
 */
export function getUniqueFilename(name: string, existingNames: Set<string>): string {
  let base = name;
  let extension = '';
  const lastDot = name.lastIndexOf('.');
  if (lastDot !== -1) {
    base = name.substring(0, lastDot);
    extension = name.substring(lastDot);
  }

  let counter = 1;
  let candidate = name;
  while (existingNames.has(candidate)) {
    candidate = `${base} (${counter})${extension}`;
    counter++;
  }
  return candidate;
}
