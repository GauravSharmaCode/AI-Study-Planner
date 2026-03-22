/**
 * Date utility functions for consistent UTC-to-local timezone handling.
 * 
 * The backend stores all dates in UTC. These utilities ensure proper
 * conversion for display and comparison in the user's local timezone.
 */

/**
 * Get today's date in local timezone as YYYY-MM-DD string
 */
export const getLocalToday = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Convert a UTC date string to local YYYY-MM-DD format
 * @param utcDateString - UTC date string from backend (e.g., "2026-03-21T00:00:00.000Z")
 * @returns Local date string in YYYY-MM-DD format
 */
export const utcToLocalDateString = (utcDateString: string): string => {
  // If it's already a plain YYYY-MM-DD, return as-is to avoid timezone shifting
  if (/^\d{4}-\d{2}-\d{2}$/.test(utcDateString)) return utcDateString;
  const date = new Date(utcDateString);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Format a date string for display (e.g., "Saturday, March 21, 2026")
 * @param dateString - Date string in YYYY-MM-DD or ISO format
 * @returns Formatted date string
 */
export const formatDateDisplay = (dateString: string): string => {
  const [year, month, day] = dateString.split('-').map(Number);
  // Use UTC constructor to avoid timezone shifting the date
  const date = new Date(Date.UTC(year!, month! - 1, day!));
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  });
};

/**
 * Format time from HH:mm to 12-hour format (e.g., "06:00" -> "6:00 AM")
 * @param time - Time string in HH:mm format
 * @returns Formatted time string in 12-hour format
 */
export const formatTime = (time: string): string => {
  const [hours, minutes] = time.split(':');
  const h = parseInt(hours || '0', 10);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${minutes} ${ampm}`;
};

/**
 * Navigate by adding days to a date
 * @param dateString - Current date in YYYY-MM-DD format
 * @param days - Number of days to add (can be negative)
 * @returns New date in YYYY-MM-DD format
 */
export const addDays = (dateString: string, days: number): string => {
  const [year, month, day] = dateString.split('-').map(Number);
  // Use UTC to avoid DST/timezone shifts changing the date
  const date = new Date(Date.UTC(year!, month! - 1, day!));
  date.setUTCDate(date.getUTCDate() + days);
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

/**
 * Check if a date string represents today
 * @param dateString - Date string in YYYY-MM-DD format
 * @returns true if the date is today
 */
export const isToday = (dateString: string): boolean => {
  return dateString === getLocalToday();
};
