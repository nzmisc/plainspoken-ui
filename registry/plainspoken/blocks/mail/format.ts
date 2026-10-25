// How the mail blocks say dates, names and sizes, and which conversations a view or a search
// shows. Plain functions with no React, and no Date.now(): "today" is always passed in, so the
// server and the browser render the same text.
import { addDays, daysBetween, weekday, type ISODate } from "@/registry/plainspoken/lib/dates";
import { FOLDERS, LABELS, ME, type MailMessage, type MailThread, type MailView, type Person } from "@/registry/plainspoken/blocks/mail/data";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** "2026-10-24T09:41" → its date and its time */
export function splitWhen(when: string): { date: ISODate; time: string } {
  return { date: when.slice(0, 10), time: when.slice(11, 16) };
}

/** "24 Oct", or "24 Oct 2025" in another year */
export function shortDate(date: ISODate, today: ISODate): string {
  const d = `${Number(date.slice(8, 10))} ${MONTHS[Number(date.slice(5, 7)) - 1]}`;
  return date.slice(0, 4) === today.slice(0, 4) ? d : `${d} ${date.slice(0, 4)}`;
}

/** The time in a message list: 09:41 today, "Thu" this week, "12 Oct" before that */
export function listTime(when: string, today: ISODate): string {
  const { date, time } = splitWhen(when);
  const days = daysBetween(date, today);
  if (days === 0) return time;
  if (days > 0 && days < 7) return DAYS[weekday(date)];
  return shortDate(date, today);
}

/** "Fri 23 Oct, 18:12" (with the year when it isn't this one) */
export function longTime(when: string, today: ISODate): string {
  const { date, time } = splitWhen(when);
  return `${DAYS[weekday(date)]} ${shortDate(date, today)}, ${time}`;
}

/** "Today, 08:00", "Tomorrow, 08:00", "Mon 26 Oct, 08:00": for snooze times, which are ahead */
export function aheadTime(when: string, today: ISODate): string {
  const { date, time } = splitWhen(when);
  if (date === today) return `Today, ${time}`;
  if (date === addDays(today, 1)) return `Tomorrow, ${time}`;
  return longTime(when, today);
}

const minutes = (when: string) => {
  const { date, time } = splitWhen(when);
  return daysBetween("2000-01-01", date) * 1440 + Number(time.slice(0, 2)) * 60 + Number(time.slice(3, 5));
};

/** "12 minutes ago", "3 hours ago", "2 days ago", for after a message's date */
export function ago(when: string, now: string): string {
  const m = minutes(now) - minutes(when);
  if (m < 1) return "just now";
  if (m < 60) return `${m} ${m === 1 ? "minute" : "minutes"} ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} ${h === 1 ? "hour" : "hours"} ago`;
  const d = Math.floor(h / 24);
  return `${d} ${d === 1 ? "day" : "days"} ago`;
}

/** Bytes for people: 812 B, 64 KB, 3.8 MB */
export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
  return `${(n / 1024 / 1024).toFixed(1).replace(/\.0$/, "")} MB`;
}

export const isMe = (p: Person) => p.email === ME.email;

/** "Marta" for Marta Kowalska, "me" for the mailbox's owner, the name as it is for companies */
export function shortName(p: Person): string {
  if (isMe(p)) return "me";
  return p.org ? p.name : p.name.split(" ")[0];
}

/** Recipients in words: "Marta Kowalska, Tomás Ruiz", or "me" */
export function names(people: Person[]): string {
  return people.map((p) => (isMe(p) ? "me" : p.name)).join(", ");
}

export const latest = (t: MailThread): MailMessage => t.messages[t.messages.length - 1];

/** Who wrote in a conversation, oldest first, each once: "Marta, me, Tomás" */
export function participants(t: MailThread): string {
  if (t.folder === "sent" || t.folder === "drafts") {
    const to = latest(t).to;
    return to.length ? `To: ${to.map(shortName).join(", ")}` : "(no recipients)";
  }
  const seen: Person[] = [];
  for (const m of t.messages) if (!seen.some((p) => p.email === m.from.email)) seen.push(m.from);
  if (seen.length === 1) return seen[0].name;
  return seen.map(shortName).join(", ");
}

/** The start of a message as one line, for the list */
export function snippet(m: MailMessage, length = 140): string {
  const text = m.body.replace(/\s+/g, " ").trim();
  return text.length > length ? `${text.slice(0, length - 1)}…` : text;
}

export const hasAttachments = (t: MailThread) => t.messages.some((m) => m.attachments?.length);

/** Every sender in these conversations, by name, for the "From" filter */
export function senders(threads: MailThread[]): Person[] {
  const all = new Map<string, Person>();
  for (const t of threads) for (const m of t.messages) if (!isMe(m.from)) all.set(m.from.email, m.from);
  return [...all.values()].sort((a, b) => a.name.localeCompare(b.name));
}

export function viewTitle(view: MailView): string {
  if (view === "starred") return "Starred";
  if (view.startsWith("label:")) return LABELS.find((l) => `label:${l.id}` === view)?.label ?? "Label";
  return FOLDERS.find((f) => f.id === view)?.label ?? "Mail";
}

/** Starred and label views look across every folder but Spam and Trash */
const visibleAcross = (t: MailThread) => t.folder !== "spam" && t.folder !== "trash";

/** The conversations a view shows, newest first (snoozed: the soonest back first) */
export function threadsIn(threads: MailThread[], view: MailView): MailThread[] {
  let list: MailThread[];
  if (view === "starred") list = threads.filter((t) => t.starred && visibleAcross(t));
  else if (view.startsWith("label:")) list = threads.filter((t) => visibleAcross(t) && t.labels.some((l) => `label:${l}` === view));
  else list = threads.filter((t) => t.folder === view);
  if (view === "snoozed") return [...list].sort((a, b) => (a.snoozedUntil ?? "").localeCompare(b.snoozedUntil ?? ""));
  return [...list].sort((a, b) => latest(b).date.localeCompare(latest(a).date));
}

export interface MailFilters {
  /** A sender's address */
  from: string | null;
  attachment: boolean;
  unread: boolean;
}

export const NO_FILTERS: MailFilters = { from: null, attachment: false, unread: false };

export const filtersActive = (f: MailFilters) => f.from != null || f.attachment || f.unread;

/** The line that introduces a quoted message: "On Fri 23 Oct, 16:52, Marta Kowalska wrote:" */
export function quoteHeader(m: MailMessage, today: ISODate): string {
  return `On ${longTime(m.date, today)}, ${m.from.name} <${m.from.email}> wrote:`;
}

/** Counts for the sidebar: unread in the inbox and spam, everything in drafts and snoozed */
export function folderCounts(threads: MailThread[]) {
  const count = (f: (t: MailThread) => boolean) => threads.filter(f).length;
  return {
    inbox: count((t) => t.folder === "inbox" && t.unread),
    spam: count((t) => t.folder === "spam" && t.unread),
    drafts: count((t) => t.folder === "drafts"),
    snoozed: count((t) => t.folder === "snoozed"),
  };
}
