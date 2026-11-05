/**
 * Formatting utilities for fares, distances, and quantities.
 */

/**
 * Formats a numeric fare or currency value into Indian Rupee representation.
 * E.g., 150 -> "₹150", 1200 -> "₹1,200".
 *
 * @param amount Numeric fare or string amount
 * @param fallback Fallback string if amount is null or invalid
 * @returns Formatted currency string
 */
export function formatCurrency(
  amount: number | string | null | undefined,
  fallback = '₹0'
): string {
  if (amount === null || amount === undefined || amount === '') return fallback;
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return fallback;
  return `₹${num.toLocaleString('en-IN')}`;
}

/**
 * Formats a distance in kilometers into a human-readable string.
 * Converts < 1 km into meters (e.g., 0.5 km -> "500 m"), otherwise "2.5 km".
 *
 * @param km Distance in kilometers
 * @returns Formatted distance string
 */
export function formatDistance(km: number | string | null | undefined): string {
  if (km === null || km === undefined || km === '') return '-';
  const num = typeof km === 'string' ? parseFloat(km) : km;
  if (isNaN(num)) return '-';

  if (num < 1) {
    const meters = Math.round(num * 1000);
    return `${meters} m`;
  }
  return `${Number(num.toFixed(1))} km`;
}

/**
 * Formats seat availability count into pluralized label.
 * E.g., 1 -> "1 seat", 3 -> "3 seats".
 *
 * @param count Number of seats
 * @returns Pluralized seat string
 */
export function formatSeats(count: number | null | undefined): string {
  const seats = count ?? 1;
  return `${seats} ${seats === 1 ? 'seat' : 'seats'}`;
}

