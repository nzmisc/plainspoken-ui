/**
 * Time formatting for RelativeTime, usable on its own (server or client): compact durations,
 * "3h 20m ago" / "in 5m", the long "3 minutes ago" of Intl.RelativeTimeFormat, and a stable
 * absolute date for server rendering.
 */

export type DateInput = Date | number | string;

export function toMs(d: DateInput): number {
  return d instanceof Date ? d.getTime() : typeof d === "number" ? d : new Date(d).getTime();
}

/** Compact duration, the dashboard way: 45s, 12m, 3h 20m, 2d 4h. Negative durations count as 0. */
export function formatDuration(ms: number): string {
  const s = Math.max(0, Math.round(ms / 1000));
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 48) return m % 60 ? `${h}h ${m % 60}m` : `${h}h`;
  const d = Math.floor(h / 24);
  return h % 24 ? `${d}d ${h % 24}h` : `${d}d`;
}

/** "12s ago", "3h 20m ago"; for times ahead of `now`, "in 5m"; within a second either way, "now". */
export function formatRelativeShort(t: DateInput, now: number): string {
  const diff = now - toMs(t);
  if (Math.abs(diff) < 1000) return "now";
  return diff > 0 ? `${formatDuration(diff)} ago` : `in ${formatDuration(-diff)}`;
}

const STEPS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 365 * 86400],
  ["month", 30 * 86400],
  ["week", 7 * 86400],
  ["day", 86400],
  ["hour", 3600],
  ["minute", 60],
  ["second", 1],
];

/**
 * "3 minutes ago", "yesterday", "in 2 weeks", "now", in the given language (the browser's when
 * left out), from Intl.RelativeTimeFormat. Rounds to the largest unit that fits.
 */
export function formatRelativeLong(t: DateInput, now: number, locale?: string): string {
  const secs = Math.round((toMs(t) - now) / 1000);
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  for (const [unit, size] of STEPS) {
    if (Math.abs(secs) >= size || unit === "second") {
      // Under 10 seconds reads better as "now" than as a count
      if (unit === "second" && Math.abs(secs) < 10) return rtf.format(0, "second");
      return rtf.format(Math.round(secs / size), unit);
    }
  }
  return "";
}

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * "2026-10-25 14:03 UTC": the same on every machine, whatever its language and time zone, so a
 * server render and the browser's first render agree. Show it until the page can say it in local terms.
 */
export function formatUtc(t: DateInput): string {
  const d = new Date(toMs(t));
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())} UTC`;
}

/** The full date and time in the reader's language and time zone: "25 Oct 2026, 15:03" */
export function formatLocal(t: DateInput, locale?: string): string {
  return new Date(toMs(t)).toLocaleString(locale, { dateStyle: "medium", timeStyle: "short" });
}
