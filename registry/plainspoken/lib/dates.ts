/**
 * Calendar dates as ISO strings ("2026-10-19"): no time, no time zone, sortable with < and >, and
 * the same on the server and in every browser. Arithmetic goes through UTC so daylight-saving
 * changes can't shift a day. No date library needed.
 */
export type ISODate = string;

const ISO = /^(\d{4})-(\d{1,2})-(\d{1,2})$/;

function utc(d: ISODate): Date {
  const [y, m, day] = d.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, day));
}

function fromUtc(t: Date): ISODate {
  return t.toISOString().slice(0, 10);
}

/** The date for a year, month (1–12) and day; out-of-range days roll over (Feb 30 → Mar 2). */
export function makeDate(y: number, m: number, d: number): ISODate {
  return fromUtc(new Date(Date.UTC(y, m - 1, d)));
}

/** Parses "2026-10-19" (or "2026-10-9"). Returns null for anything else, including Feb 30. */
export function parseISODate(s: string): ISODate | null {
  const m = ISO.exec(s.trim());
  if (!m) return null;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const out = makeDate(y, mo, d);
  return out === `${m[1]}-${String(mo).padStart(2, "0")}-${String(d).padStart(2, "0")}` ? out : null;
}

/**
 * Today in the browser's time zone. Only call it in the browser (an effect, an event handler, or
 * through the useToday hook): on the server it is the server's today, which may not be the
 * viewer's, and a page rendered with it would not match once hydrated.
 */
export function todayISO(): ISODate {
  const n = new Date();
  return makeDate(n.getFullYear(), n.getMonth() + 1, n.getDate());
}

export const year = (d: ISODate) => Number(d.slice(0, 4));
/** 1 = January ... 12 = December */
export const month = (d: ISODate) => Number(d.slice(5, 7));
export const day = (d: ISODate) => Number(d.slice(8, 10));
/** 0 = Sunday ... 6 = Saturday */
export const weekday = (d: ISODate) => utc(d).getUTCDay();

export function addDays(d: ISODate, n: number): ISODate {
  const t = utc(d);
  t.setUTCDate(t.getUTCDate() + n);
  return fromUtc(t);
}

export function daysInMonth(y: number, m: number): number {
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

/** Same day of month n months later, clamped (Jan 31 + 1 month = Feb 28/29). */
export function addMonths(d: ISODate, n: number): ISODate {
  const total = year(d) * 12 + (month(d) - 1) + n;
  const y = Math.floor(total / 12);
  const m = (total % 12) + 1;
  return makeDate(y, m, Math.min(day(d), daysInMonth(y, m)));
}

export const startOfMonth = (d: ISODate) => d.slice(0, 8) + "01";
export const endOfMonth = (d: ISODate) => makeDate(year(d), month(d), daysInMonth(year(d), month(d)));
export const sameMonth = (a: ISODate, b: ISODate) => a.slice(0, 7) === b.slice(0, 7);

/** The first day of d's week, for weeks starting on Sunday (0) or Monday (1) */
export function startOfWeek(d: ISODate, weekStartsOn: 0 | 1): ISODate {
  return addDays(d, -((weekday(d) - weekStartsOn + 7) % 7));
}

/** Whole days from a to b (negative when b is earlier) */
export function daysBetween(a: ISODate, b: ISODate): number {
  return Math.round((utc(b).getTime() - utc(a).getTime()) / 86_400_000);
}

/** ISO 8601 week number: weeks start on Monday, week 1 holds the year's first Thursday. */
export function isoWeek(d: ISODate): number {
  const t = utc(d);
  t.setUTCDate(t.getUTCDate() + 3 - ((t.getUTCDay() + 6) % 7));
  const jan4 = new Date(Date.UTC(t.getUTCFullYear(), 0, 4));
  return 1 + Math.round(((t.getTime() - jan4.getTime()) / 86_400_000 - 3 + ((jan4.getUTCDay() + 6) % 7)) / 7);
}

export const clampDate = (d: ISODate, min?: ISODate, max?: ISODate) => (min && d < min ? min : max && d > max ? max : d);

/**
 * Formats with Intl in UTC, so the date never moves with the viewer's time zone. Pass a locale
 * when the text is rendered on the server: without one, Node and the browser may pick different
 * languages and the page won't hydrate cleanly.
 */
export function formatDate(d: ISODate, opts: Intl.DateTimeFormatOptions, locale?: string): string {
  return new Intl.DateTimeFormat(locale, { ...opts, timeZone: "UTC" }).format(utc(d));
}

export function monthNames(locale?: string, style: "long" | "short" = "long"): string[] {
  return Array.from({ length: 12 }, (_, i) => formatDate(makeDate(2026, i + 1, 1), { month: style }, locale));
}

/** Weekday names in column order. 2026-10-18 is a Sunday. */
export function weekdayNames(weekStartsOn: 0 | 1, locale?: string, style: "long" | "short" | "narrow" = "short"): string[] {
  return Array.from({ length: 7 }, (_, i) => formatDate(addDays("2026-10-18", i + weekStartsOn), { weekday: style }, locale));
}
