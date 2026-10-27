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

/**
 * Formats a date string into "Month Year" (e.g., "Oct 2026"), with an optional fallback.
 * @param {string} [isoString] - The ISO date string to format
 * @param {string} [fallback='Recently'] - Fallback string if date is missing or invalid
 * @returns {string} The formatted month and year string
 */
export function formatMonthYear(isoString?: string, fallback = 'Recently'): string {
  if (!isoString) return fallback;
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return fallback;
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  } catch {
    return fallback;
  }
}

/**
 * Formats an ISO date string into human-friendly relative time (e.g., "Just now", "5m ago", "2h ago", "Yesterday").
 * Automatically supports future timestamps (e.g., "in 30m", "in 2h") and falls back to standard formatDate if older than 7 days.
 * @param {string} isoString - The ISO date string to format
 * @returns {string} Human-readable relative time string
 */
export function formatRelativeTime(isoString: string): string {
  if (!isoString) return '';
  try {
    const date = new Date(isoString);
    const time = date.getTime();
    if (isNaN(time)) return isoString;

    const now = Date.now();
    const diffSeconds = Math.round((now - time) / 1000);

    // Future dates (for upcoming ride requests)
    if (diffSeconds < -60) {
      const futureSeconds = Math.abs(diffSeconds);
      if (futureSeconds < 3600) {
        const mins = Math.max(1, Math.round(futureSeconds / 60));
        return `in ${mins}m`;
      }
      if (futureSeconds < 86400) {
        const hours = Math.round(futureSeconds / 3600);
        return `in ${hours}h`;
      }
      const days = Math.round(futureSeconds / 86400);
      return `in ${days}d`;
    }

    if (diffSeconds < 45) {
      return 'Just now';
    }
    if (diffSeconds < 3600) {
      const mins = Math.floor(diffSeconds / 60);
      return `${mins}m ago`;
    }
    if (diffSeconds < 86400) {
      const hours = Math.floor(diffSeconds / 3600);
      return `${hours}h ago`;
    }
    if (diffSeconds < 86400 * 2) {
      return 'Yesterday';
    }
    if (diffSeconds < 86400 * 7) {
      const days = Math.floor(diffSeconds / 86400);
      return `${days}d ago`;
    }

    return formatDate(isoString);
  } catch {
    return isoString;
  }
}
