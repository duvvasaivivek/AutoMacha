/**
 * User formatting and helper utilities for AutoMacha.
 */

/**
 * Extracts initials (up to 2 characters) from a user's full name or username.
 * E.g., "Sai Vivek" -> "SV", "Vivek" -> "VI", username "saivivek" -> "SA".
 *
 * @param fullName Optional full name of the user
 * @param username Optional username of the user
 * @param fallback Fallback string if both are empty (default: 'U')
 * @returns 2-letter uppercase initials
 */
export function getUserInitials(
  fullName?: string | null,
  username?: string | null,
  fallback = 'U'
): string {
  const name = fullName?.trim();
  if (name && name.length > 0) {
    const parts = name.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }

  const user = username?.trim();
  if (user && user.length > 0) {
    return user.slice(0, 2).toUpperCase();
  }

  return fallback.slice(0, 2).toUpperCase();
}

/**
 * Formats a user display name, prioritizing full name over username handle.
 * E.g., "Sai Vivek" or "@saivivek".
 *
 * @param fullName Optional full name
 * @param username Optional username
 * @returns Readable display name
 */
export function formatUserDisplayName(
  fullName?: string | null,
  username?: string | null
): string {
  if (fullName && fullName.trim().length > 0) {
    return fullName.trim();
  }
  if (username && username.trim().length > 0) {
    return `@${username.trim()}`;
  }
  return 'Anonymous';
}

