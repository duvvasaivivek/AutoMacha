/**
 * Centralized date and time formatting utilities.
 */

/**
 * Formats an ISO string into a readable date (e.g., "Oct 8, 2026").
 * @param {string} isoString - The ISO date string to format
 * @returns {string} The formatted date string, or the original string on error
 */
export function formatDate(isoString: string): string {
  if (!isoString) return '';
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return isoString;
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return isoString;
  }
}

/**
 * Formats an ISO string into a readable time (e.g., "10:05 AM").
 * @param {string} isoString - The ISO date string to format
 * @returns {string} The formatted time string, or the original string on error
 */
export function formatTime(isoString: string): string {
  if (!isoString) return '';
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return isoString;
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return isoString;
  }
}

/**
 * Formats an ISO string into a readable date and time.
 * @param {string} isoString - The ISO date string to format
 * @returns {string} The formatted date and time string, or the original string on error
 */
export function formatDateTime(isoString: string): string {
  if (!isoString) return '';
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return isoString;
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return isoString;
  }
}
