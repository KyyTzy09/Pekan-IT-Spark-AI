/**
 * Date / time formatting helpers (Indonesian locale).
 */

/**
 * Format a Date as a relative time string in Indonesian.
 * Examples:
 *   "baru saja" (< 1 minute)
 *   "5 menit yang lalu"
 *   "2 jam yang lalu"
 *   "kemarin"
 *   "3 hari yang lalu"
 *   "2 minggu yang lalu"
 *   "3 bulan yang lalu"
 *   "1 tahun yang lalu"
 */
export function formatDistanceToNow(
  date: Date,
  now: Date = new Date(),
): string {
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return "baru saja";
  if (diffMin < 60) return `${diffMin} menit yang lalu`;
  if (diffHour < 24) return `${diffHour} jam yang lalu`;
  if (diffDay === 1) return "kemarin";
  if (diffDay < 7) return `${diffDay} hari yang lalu`;
  if (diffDay < 30) {
    const weeks = Math.floor(diffDay / 7);
    return `${weeks} minggu yang lalu`;
  }
  if (diffDay < 365) {
    const months = Math.floor(diffDay / 30);
    return `${months} bulan yang lalu`;
  }
  const years = Math.floor(diffDay / 365);
  return `${years} tahun yang lalu`;
}

const MONTHS_ID = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
] as const;

const DAYS_ID = [
  "Minggu",
  "Senin",
  "Selasa",
  "Rabu",
  "Kamis",
  "Jumat",
  "Sabtu",
] as const;

/**
 * Format a Date as a long Indonesian string.
 * Example: "Senin, 16 Juni 2026"
 */
export function formatDateLong(date: Date): string {
  const day = DAYS_ID[date.getDay()]!;
  const month = MONTHS_ID[date.getMonth()]!;
  return `${day}, ${date.getDate()} ${month} ${date.getFullYear()}`;
}

/**
 * Format a Date as a short Indonesian string.
 * Example: "16 Jun"
 */
export function formatDateShort(date: Date): string {
  const month = MONTHS_ID[date.getMonth()]!.slice(0, 3);
  return `${date.getDate()} ${month}`;
}
