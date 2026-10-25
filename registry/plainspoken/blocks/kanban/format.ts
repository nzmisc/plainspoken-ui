// How the Kanban blocks say dates, files, people and priorities, and the board's pure operations
// (move a card, filter, record activity). No React and no clock: "today" and "now" are passed in,
// or are the demo's fixed KANBAN_TODAY and KANBAN_NOW, so the server and the browser print the same.
import { ChevronDown, ChevronsUp, ChevronUp, Equal, File, FileArchive, FileCode, FileImage, FileSpreadsheet, FileText, FileVideoCamera, type Glyph } from "@/registry/plainspoken/lib/icons";
import { daysBetween, type ISODate } from "@/registry/plainspoken/lib/dates";
import { LABELS, PEOPLE, type ActivityEvent, type BoardCard, type BoardColumn, type BoardLabel, type Person, type Priority } from "@/registry/plainspoken/blocks/kanban/data";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** "27 Oct" */
export const dayShort = (iso: ISODate) => `${Number(iso.slice(8, 10))} ${MONTHS[Number(iso.slice(5, 7)) - 1]}`;

/** "Tue 27 Oct 2026" */
export function dayLong(iso: ISODate): string {
  const wd = new Date(Date.UTC(Number(iso.slice(0, 4)), Number(iso.slice(5, 7)) - 1, Number(iso.slice(8, 10)))).getUTCDay();
  return `${WEEKDAYS[wd]} ${dayShort(iso)} ${iso.slice(0, 4)}`;
}

/** Epoch milliseconds for a wall-clock time, read as UTC so it is the same everywhere (for RelativeTime) */
export const ms = (when: string) => Date.parse(`${when.length === 10 ? `${when}T00:00` : when}:00Z`);

// People and labels -----------------------------------------------------------------------------

const UNKNOWN: Person = { id: "?", name: "Someone", role: "", seen: "" };

export const personById = (id: string, people: Person[] = PEOPLE): Person => people.find((p) => p.id === id) ?? { ...UNKNOWN, id };

export const firstName = (p: Person) => p.name.split(" ")[0];

export const labelById = (id: string, labels: BoardLabel[] = LABELS): BoardLabel | undefined => labels.find((l) => l.id === id);

/** "Rosa", "Rosa and Hana", "Rosa, Hana and Kwame" */
export function names(people: Person[]): string {
  const n = people.map((p) => p.name);
  return n.length < 2 ? (n[0] ?? "") : `${n.slice(0, -1).join(", ")} and ${n.at(-1)}`;
}

/** A comment's text in pieces: plain text, and "@Tom" mentions of members by first name */
export function splitMentions(text: string, people: Person[] = PEOPLE): ({ text: string } | { text: string; person: Person })[] {
  const byFirst = new Map(people.map((p) => [firstName(p).toLowerCase(), p]));
  const out: ({ text: string } | { text: string; person: Person })[] = [];
  let last = 0;
  for (const m of text.matchAll(/(^|[^\p{L}\p{N}])@([\p{L}]+)/gu)) {
    const person = byFirst.get(m[2].toLowerCase());
    if (!person) continue;
    const at = m.index + m[1].length;
    if (at > last) out.push({ text: text.slice(last, at) });
    out.push({ text: `@${m[2]}`, person });
    last = at + 1 + m[2].length;
  }
  if (last < text.length) out.push({ text: text.slice(last) });
  return out;
}

// Due dates and priorities ----------------------------------------------------------------------

export type DueKind = "overdue" | "soon" | "later" | "done";

export interface DueState {
  kind: DueKind;
  /** On the card: "27 Oct", "Today", "Tomorrow" */
  short: string;
  /** In words, for hover text and screen readers: "Due Tue 27 Oct 2026, in 4 days", "Overdue: due Wed 21 Oct 2026, 2 days ago" */
  long: string;
}

/**
 * Where a due date stands: overdue (before today), soon (today or in the next two days), later,
 * or done (the card is finished, so the date no longer matters).
 */
export function dueState(due: ISODate, today: ISODate, done = false): DueState {
  const d = daysBetween(today, due);
  const short = d === 0 ? "Today" : d === 1 ? "Tomorrow" : d === -1 ? "Yesterday" : dayShort(due);
  const when = d === 0 ? "today" : d > 0 ? `in ${d} ${d === 1 ? "day" : "days"}` : `${-d} ${d === -1 ? "day" : "days"} ago`;
  if (done) return { kind: "done", short, long: `Was due ${dayLong(due)}` };
  if (d < 0) return { kind: "overdue", short, long: `Overdue: due ${dayLong(due)}, ${when}` };
  return { kind: d <= 2 ? "soon" : "later", short, long: `Due ${dayLong(due)}, ${when}` };
}

export const PRIORITIES: Record<Priority, { label: string; icon: Glyph; className: string }> = {
  urgent: { label: "Urgent", icon: ChevronsUp, className: "text-destructive" },
  high: { label: "High", icon: ChevronUp, className: "text-warning" },
  medium: { label: "Medium", icon: Equal, className: "text-muted-foreground" },
  low: { label: "Low", icon: ChevronDown, className: "text-muted-foreground" },
};

export const PRIORITY_ORDER: Priority[] = ["urgent", "high", "medium", "low"];

// Files -----------------------------------------------------------------------------------------

export interface FileKind {
  /** Pictures get a thumbnail; everything else a symbol */
  image: boolean;
  icon: Glyph;
  /** "PNG image", "PDF document" */
  word: string;
}

/** What a file is, from its name and MIME type */
export function fileKind(name: string, type = ""): FileKind {
  const ext = (name.includes(".") ? name.split(".").pop() : "")!.toLowerCase();
  const upper = ext.toUpperCase();
  if (type.startsWith("image/") || ["png", "jpg", "jpeg", "gif", "webp", "svg", "heic", "avif"].includes(ext))
    return { image: true, icon: FileImage, word: `${upper || "Image"} image` };
  if (ext === "pdf" || type === "application/pdf") return { image: false, icon: FileText, word: "PDF document" };
  if (["xls", "xlsx", "csv", "ods", "numbers"].includes(ext)) return { image: false, icon: FileSpreadsheet, word: ext === "csv" ? "CSV table" : "Spreadsheet" };
  if (["doc", "docx", "odt", "pages", "rtf"].includes(ext)) return { image: false, icon: FileText, word: "Document" };
  if (["zip", "gz", "tar", "7z", "rar"].includes(ext)) return { image: false, icon: FileArchive, word: `${upper} archive` };
  if (type.startsWith("video/") || ["mp4", "mov", "webm", "mkv"].includes(ext)) return { image: false, icon: FileVideoCamera, word: `${upper || "Video"} video` };
  if (["json", "js", "ts", "tsx", "css", "html", "xml", "yml", "yaml"].includes(ext)) return { image: false, icon: FileCode, word: `${upper} file` };
  if (["txt", "md", "log"].includes(ext) || type.startsWith("text/")) return { image: false, icon: FileText, word: "Text file" };
  return { image: false, icon: File, word: upper ? `${upper} file` : "File" };
}

// The board -------------------------------------------------------------------------------------

/** The column a card is in */
export const columnOf = (columns: BoardColumn[], cardId: string) => columns.find((c) => c.cardIds.includes(cardId));

/**
 * The columns with a card taken out of wherever it is and put into `toColumn` at `toIndex`, an
 * index in that column's list without the card. Returns the same array when nothing changes.
 */
export function moveCard(columns: BoardColumn[], cardId: string, toColumn: string, toIndex: number): BoardColumn[] {
  const from = columnOf(columns, cardId);
  if (!from || !columns.some((c) => c.id === toColumn)) return columns;
  if (from.id === toColumn && from.cardIds.indexOf(cardId) === toIndex) return columns;
  return columns.map((c) => {
    const ids = c.cardIds.filter((id) => id !== cardId);
    if (c.id === toColumn) ids.splice(Math.max(0, Math.min(toIndex, ids.length)), 0, cardId);
    return ids.length === c.cardIds.length && c.id !== toColumn ? c : { ...c, cardIds: ids };
  });
}

/** The next free card key: "FA-146" after "FA-145" */
export function nextCardId(cards: Record<string, BoardCard>, prefix = "FA"): string {
  const max = Math.max(0, ...Object.keys(cards).map((k) => Number(k.split("-")[1]) || 0));
  return `${prefix}-${max + 1}`;
}

let seq = 0;
/** A fresh id for something added in the browser (a comment, a checklist item). Call it in event handlers only. */
export const newId = (prefix: string) => `${prefix}-new-${++seq}`;

/** The card with one more entry at the end of its activity */
export const withActivity = (card: BoardCard, by: string, at: string, event: ActivityEvent): BoardCard => ({
  ...card,
  activity: [...card.activity, { id: newId("a"), by, at, event }],
});

/**
 * Who has taken part in a card: the people who commented, latest first, then those only watching
 * it. Each comes once, with the time of their last comment (or null) and whether they watch it.
 */
export function participants(card: Pick<BoardCard, "comments" | "watchers">): { id: string; commented: string | null; watching: boolean }[] {
  const last = new Map<string, string>();
  for (const c of card.comments) if ((last.get(c.by) ?? "") < c.at) last.set(c.by, c.at);
  const out = [...last.entries()].sort((a, b) => b[1].localeCompare(a[1])).map(([id, at]) => ({ id, commented: at as string | null, watching: card.watchers.includes(id) }));
  for (const id of card.watchers) if (!last.has(id)) out.push({ id, commented: null, watching: true });
  return out;
}

/** Done and total checklist items */
export const checklistCount = (card: Pick<BoardCard, "checklist">) => ({ done: card.checklist.filter((i) => i.done).length, total: card.checklist.length });

// Filtering -------------------------------------------------------------------------------------

export interface BoardFilter {
  /** Words to find in the title, key, description or label names */
  query: string;
  /** Person ids, any of which may be assigned; "none" for cards nobody has */
  people: string[];
  labels: string[];
  /** Only cards assigned to the viewer */
  mine: boolean;
  /** Only cards this person is on in any way: assigned, commented or watching */
  involved?: string | null;
}

export const EMPTY_FILTER: BoardFilter = { query: "", people: [], labels: [], mine: false, involved: null };

export const isFiltering = (f: BoardFilter) => f.query.trim() !== "" || f.people.length > 0 || f.labels.length > 0 || f.mine || !!f.involved;

/** Lower case, accents off: "Café" matches "cafe" */
const fold = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

/** Does a card pass the filter? Every word of the query must appear somewhere; people and labels match any one chosen. */
export function matchesFilter(card: BoardCard, f: BoardFilter, me: string, labels: BoardLabel[] = LABELS): boolean {
  if (f.mine && !card.assignees.includes(me)) return false;
  const who = f.involved;
  if (who && !card.assignees.includes(who) && !card.watchers.includes(who) && !card.comments.some((c) => c.by === who)) return false;
  if (f.people.length && !f.people.some((p) => (p === "none" ? card.assignees.length === 0 : card.assignees.includes(p)))) return false;
  if (f.labels.length && !f.labels.some((l) => card.labels.includes(l as BoardCard["labels"][number]))) return false;
  const words = fold(f.query).split(/\s+/).filter(Boolean);
  if (!words.length) return true;
  const text = fold([card.id, card.title, card.description, ...card.labels.map((l) => labelById(l, labels)?.label ?? "")].join(" "));
  return words.every((w) => text.includes(w));
}
