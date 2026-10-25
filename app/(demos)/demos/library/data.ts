// The Lakemont Public Library: the catalogue (real books, content/library/catalogue.json) and
// everything invented around it: branches, copies and call numbers, events, closures and one
// patron's account. Copies come from a hash of each book's id, so they are the same on every render.
import catalogueJson from "@/content/library/catalogue.json";
import type { CalendarEvent } from "@/registry/plainspoken/ui/agenda";
import type { Branch, Format, FormatAvailability, LibraryBook, LibraryCopy } from "@/registry/plainspoken/blocks/library/lib";
import { isDigital } from "@/registry/plainspoken/blocks/library/lib";
import { addDays, type ISODate } from "@/registry/plainspoken/lib/dates";

export const BASE = "/demos/library";
export const LIBRARY_NAME = "Lakemont Public Library";
/** The demo's fixed "today": a Saturday */
export const TODAY: ISODate = "2026-10-24";

export const BOOKS = (catalogueJson as LibraryBook[]).slice();
export const getBook = (id: string) => BOOKS.find((b) => b.id === id);

export const BRANCHES: Branch[] = [
  {
    id: "central",
    name: "Central Library",
    address: "200 Market Street, Lakemont",
    phone: "(555) 014-2200",
    hours: [["13:00", "17:00"], ["09:00", "20:00"], ["09:00", "20:00"], ["09:00", "20:00"], ["09:00", "20:00"], ["09:00", "18:00"], ["10:00", "17:00"]],
    services: ["Makerspace", "Local history room", "Study rooms", "Parking garage"],
  },
  {
    id: "riverside",
    name: "Riverside Branch",
    address: "41 Mill Road, Lakemont",
    phone: "(555) 014-2310",
    hours: [null, ["10:00", "19:00"], ["10:00", "18:00"], ["10:00", "19:00"], ["10:00", "18:00"], ["10:00", "17:00"], ["10:00", "14:00"]],
    services: ["Children's garden", "Book drop open 24 hours"],
  },
  {
    id: "northgate",
    name: "Northgate Branch",
    address: "1580 Northgate Avenue, Lakemont",
    phone: "(555) 014-2420",
    hours: [null, null, ["11:00", "19:00"], ["11:00", "19:00"], ["11:00", "19:00"], ["11:00", "19:00"], ["10:00", "16:00"]],
    services: ["Computer lab", "Spanish-language collection"],
  },
  {
    id: "oak-hill",
    name: "Oak Hill Branch",
    address: "9 Chestnut Lane, Lakemont",
    phone: "(555) 014-2530",
    hours: [null, null, ["12:00", "20:00"], ["10:00", "17:00"], ["12:00", "20:00"], ["10:00", "17:00"], ["10:00", "17:00"]],
    services: ["Quiet reading room", "Seed library"],
  },
];

export const branchName = (id: string) => BRANCHES.find((b) => b.id === id)?.name ?? id;

/** Days a branch is shut outside its weekly hours; branch null for all of them */
export const CLOSURES: { date: ISODate; to?: ISODate; branch: string | null; reason: string }[] = [
  { date: "2026-10-19", to: "2026-10-25", branch: "oak-hill", reason: "Floor refinishing" },
  { date: "2026-11-11", branch: null, reason: "Veterans Day" },
  { date: "2026-11-20", branch: "northgate", reason: "Staff training" },
  { date: "2026-11-26", to: "2026-11-27", branch: null, reason: "Thanksgiving" },
  { date: "2026-12-24", to: "2026-12-25", branch: null, reason: "Christmas" },
  { date: "2026-12-31", branch: null, reason: "Closes at 15:00 (New Year's Eve)" },
  { date: "2027-01-01", branch: null, reason: "New Year's Day" },
];

/** Closed on this day for a reason other than the weekly hours? */
export function closureOn(branch: string, date: ISODate) {
  return CLOSURES.find((c) => (c.branch == null || c.branch === branch) && date >= c.date && date <= (c.to ?? c.date) && !c.reason.startsWith("Closes at"));
}

const KIND_COLOR: Record<string, string> = {
  Children: "var(--chart-1)",
  Teens: "var(--chart-4)",
  Adults: "var(--chart-3)",
  "Book club": "var(--chart-2)",
  Film: "var(--chart-5)",
};

const ev = (date: ISODate, time: string | undefined, title: string, kind: keyof typeof KIND_COLOR): CalendarEvent => ({
  date,
  time,
  title,
  kind,
  color: KIND_COLOR[kind],
});

export const EVENTS: CalendarEvent[] = [
  ev("2026-10-24", "10:30", "Saturday storytime, Central", "Children"),
  ev("2026-10-24", "14:00", "Knitting circle, Riverside", "Adults"),
  ev("2026-10-26", "18:30", "Book club: James by Percival Everett, Central", "Book club"),
  ev("2026-10-27", "16:00", "Anime and manga club, Northgate", "Teens"),
  ev("2026-10-28", "10:00", "Tech help drop-in, Central", "Adults"),
  ev("2026-10-28", "18:00", "English conversation group, Northgate", "Adults"),
  ev("2026-10-29", "10:30", "Baby rhyme time, Riverside", "Children"),
  ev("2026-10-30", "15:30", "Pumpkin crafts, Oak Hill", "Children"),
  ev("2026-10-31", "14:00", "Family film: Paddington, Central", "Film"),
  ev("2026-11-03", "18:30", "Author talk: writing local history, Central", "Adults"),
  ev("2026-11-04", "16:00", "Teen writing workshop, Oak Hill", "Teens"),
  ev("2026-11-05", "11:00", "Seed library swap, Oak Hill", "Adults"),
  ev("2026-11-07", "10:30", "Saturday storytime, Central", "Children"),
];

// -------------------------------------------------------------------------------------------------
// Copies, call numbers and availability, invented from each book's id

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

const DEWEY: Record<string, string> = {
  History: "909",
  Science: "500",
  Nature: "577",
  Technology: "004",
  Philosophy: "100",
  Psychology: "150",
  Religion: "230",
  "Politics & society": "305",
  "Business & economics": "330",
  "Art & music": "709",
  Cooking: "641.5",
  Travel: "910.4",
  Sports: "796",
  Health: "613",
  "True crime": "364.15",
  "Biography & memoir": "920",
  "Graphic novels": "741.5",
};

const FICTION = new Set(["Literary fiction", "Classics", "Mystery", "Thriller", "Science fiction", "Fantasy", "Historical fiction", "Romance", "Horror", "Short stories", "Humor", "Picture books"]);

const LANG_PREFIX: Record<string, string> = { Spanish: "SPA ", French: "FRE ", German: "GER ", Italian: "ITA ", Japanese: "JPN ", Korean: "KOR " };

function cutter(name: string): string {
  const surname = name.split(" and ")[0].split(",")[0].trim().split(" ").at(-1) ?? name;
  return surname.normalize("NFD").replace(/[^A-Za-z]/g, "").slice(0, 3).toUpperCase();
}

/** A call number in the usual public-library style: "FIC MOR", "YA FIC COL", "E SEN", "641.5 NOS", "DVD CAS" */
export function callNumber(b: LibraryBook, format: Format = "book"): string {
  if (format === "dvd") return `DVD ${b.subjects.includes("Film") ? "" : "FIC "}${cutter(b.title.replace(/^(The|A|An) /, ""))}`.replace("  ", " ");
  const lang = LANG_PREFIX[b.language] ?? "";
  const who = cutter(b.author);
  if (b.subjects.includes("Picture books")) return `${lang}E ${who}`;
  const prefix = b.audience === "Teen" ? "YA " : b.audience === "Children" ? "J " : "";
  const primary = b.subjects.find((s) => DEWEY[s] && !FICTION.has(s));
  if (primary && !b.subjects.some((s) => FICTION.has(s) && s !== "Humor")) return `${lang}${prefix}${DEWEY[primary]} ${who}`;
  if (b.subjects.includes("Poetry")) return `${lang}${prefix}811 ${who}`;
  return `${lang}${prefix}FIC ${who}`;
}

function shelf(b: LibraryBook, format: Format): string {
  if (format === "dvd") return "DVDs";
  if (b.language !== "English") return "World languages";
  if (b.audience === "Teen") return "Teen";
  if (b.audience === "Children") return b.subjects.includes("Picture books") ? "Picture books" : "Children's";
  return callNumber(b).includes("FIC") ? "Adult fiction" : "Nonfiction";
}

/** Physical copies of a book and a DVD across the branches: the same every time for one id */
export function copiesOf(b: LibraryBook): LibraryCopy[] {
  const out: LibraryCopy[] = [];
  const fresh = b.added >= "2026-09-01";
  for (const format of b.formats.filter((f) => !isDigital(f))) {
    let h = hash(`${b.id}/${format}`);
    const count = format === "dvd" ? 1 + (h % 3) : fresh ? 3 + (h % 4) : 1 + (h % 5);
    for (let i = 0; i < count; i++) {
      h = hash(`${h}/${i}`);
      const roll = h % 100;
      const busy = fresh ? 85 : 40;
      const status = roll < busy ? "checked-out" : roll < busy + 5 ? "in-transit" : roll < busy + 9 ? "hold-shelf" : "available";
      out.push({
        branch: BRANCHES[(i + (h >>> 8)) % BRANCHES.length].id,
        format,
        callNumber: callNumber(b, format),
        location: shelf(b, format),
        status,
        due: status === "checked-out" ? addDays(TODAY, (h >>> 4) % 21) : undefined,
      });
    }
  }
  return out.sort((x, y) => BRANCHES.findIndex((r) => r.id === x.branch) - BRANCHES.findIndex((r) => r.id === y.branch));
}

/** Per format: copies or licences, how many are free now, and how many people are waiting */
export function availabilityOf(b: LibraryBook): FormatAvailability[] {
  const copies = copiesOf(b);
  const fresh = b.added >= "2026-09-01";
  return b.formats.map((format) => {
    const h = hash(`${b.id}/${format}/holds`);
    if (isDigital(format)) {
      const total = 1 + (h % 4);
      const available = fresh ? 0 : Math.max(0, total - ((h >>> 4) % (total + 3)));
      return { format, total, available, holds: available ? 0 : (h >>> 9) % (fresh ? 30 : 8) };
    }
    const mine = copies.filter((c) => c.format === format);
    const available = mine.filter((c) => c.status === "available").length;
    return { format, total: mine.length, available, holds: available ? 0 : (h >>> 9) % (fresh ? 24 : 6) };
  });
}

/** Titles that share the most subjects with this one, same audience first */
export function similarTo(b: LibraryBook, n = 8): LibraryBook[] {
  return BOOKS.filter((x) => x.id !== b.id)
    .map((x) => ({ x, score: x.subjects.filter((s) => b.subjects.includes(s)).length * 2 + (x.audience === b.audience ? 1 : 0) }))
    .filter((r) => r.score > 1)
    .sort((p, q) => q.score - p.score || q.x.year - p.x.year)
    .slice(0, n)
    .map((r) => r.x);
}

export const NEW_ARRIVALS = BOOKS.filter((b) => b.added >= "2026-09-20").sort((a, b) => b.added.localeCompare(a.added));

export const STAFF_PICKS: { id: string; by: string; branch: string; note: string }[] = [
  { id: "north-woods", by: "Marisol Vega", branch: "Central Library", note: "One house, three hundred years, and every chapter told a different way. I read it twice in a month." },
  { id: "braiding-sweetgrass", by: "Tom Abernathy", branch: "Oak Hill Branch", note: "Our seed library regulars keep asking for it. Gentle, clear, and it changes how you look at a garden." },
  { id: "a-good-girls-guide-to-murder", by: "Priya Nair", branch: "Northgate Branch", note: "The teen book I hand to adults who say they don't read teen books. They always come back for the sequel." },
  { id: "the-wild-robot", by: "Jonah Feld", branch: "Riverside Branch", note: "Short chapters, big heart. Perfect for reading aloud at bedtime, one or two a night." },
];

// -------------------------------------------------------------------------------------------------
// One patron's account, as it stands today

export const PATRON = { name: "Ada Okafor", card: "2 1987 00482 1736", homeBranch: "riverside", email: "ada.okafor@example.com" };

export interface Loan {
  id: string;
  format: Format;
  checkedOut: ISODate;
  due: ISODate;
  renewals: number;
  /** Someone is waiting, so it can't be renewed */
  holdsWaiting: boolean;
}

export const LOANS: Loan[] = [
  { id: "the-covenant-of-water", format: "book", checkedOut: "2026-09-30", due: "2026-10-21", renewals: 1, holdsWaiting: true },
  { id: "salt-fat-acid-heat", format: "book", checkedOut: "2026-10-03", due: "2026-10-24", renewals: 0, holdsWaiting: false },
  { id: "the-wild-robot", format: "book", checkedOut: "2026-10-10", due: "2026-10-31", renewals: 0, holdsWaiting: false },
  { id: "being-mortal", format: "audiobook", checkedOut: "2026-10-12", due: "2026-11-02", renewals: 0, holdsWaiting: false },
  { id: "spirited-away", format: "dvd", checkedOut: "2026-10-20", due: "2026-10-27", renewals: 2, holdsWaiting: false },
  { id: "station-eleven", format: "ebook", checkedOut: "2026-10-18", due: "2026-11-08", renewals: 0, holdsWaiting: false },
];

export interface Hold {
  id: string;
  format: Format;
  placed: ISODate;
  pickup: string;
  position: number;
  queue: number;
  status: "ready" | "in-transit" | "waiting" | "suspended";
  /** Ready holds: last day to collect */
  until?: ISODate;
}

export const HOLDS: Hold[] = [
  { id: "james", format: "book", placed: "2026-09-02", pickup: "riverside", position: 1, queue: 14, status: "ready", until: "2026-10-28" },
  { id: "orbital", format: "book", placed: "2026-09-26", pickup: "riverside", position: 1, queue: 6, status: "in-transit" },
  { id: "intermezzo", format: "ebook", placed: "2026-10-15", pickup: "riverside", position: 4, queue: 19, status: "waiting" },
  { id: "the-women", format: "book", placed: "2026-10-19", pickup: "central", position: 11, queue: 23, status: "waiting" },
  { id: "onyx-storm", format: "audiobook", placed: "2026-10-22", pickup: "riverside", position: 27, queue: 31, status: "suspended", until: "2026-11-30" },
];

export interface HistoryItem {
  id: string;
  format: Format;
  borrowed: ISODate;
  returned: ISODate;
}

const HISTORY_IDS: [string, Format, ISODate, number][] = [
  ["the-remains-of-the-day", "book", "2025-01-08", 19],
  ["educated", "audiobook", "2025-01-29", 21],
  ["the-martian", "book", "2025-02-15", 12],
  ["wolf-hall", "book", "2025-03-02", 35],
  ["the-snowy-day", "book", "2025-03-14", 7],
  ["thinking-fast-and-slow", "ebook", "2025-04-01", 21],
  ["paddington", "dvd", "2025-04-19", 6],
  ["circe", "book", "2025-05-03", 18],
  ["a-walk-in-the-woods", "audiobook", "2025-05-24", 20],
  ["the-gruffalo", "book", "2025-06-07", 14],
  ["project-hail-mary", "book", "2025-06-21", 16],
  ["h-is-for-hawk", "book", "2025-07-12", 21],
  ["matilda", "book", "2025-07-26", 10],
  ["the-underground-railroad", "ebook", "2025-08-09", 21],
  ["casablanca", "dvd", "2025-08-30", 7],
  ["klara-and-the-sun", "book", "2025-09-13", 15],
  ["why-we-sleep", "audiobook", "2025-10-04", 21],
  ["the-god-of-the-woods", "ebook", "2025-11-01", 21],
  ["middlemarch", "book", "2025-11-22", 42],
  ["the-lion-the-witch-and-the-wardrobe", "book", "2025-12-13", 14],
  ["sapiens", "audiobook", "2026-01-10", 21],
  ["kitchen-confidential", "book", "2026-02-07", 13],
  ["demon-copperhead", "book", "2026-03-01", 28],
  ["my-neighbor-totoro", "dvd", "2026-03-28", 5],
  ["the-anxious-generation", "ebook", "2026-04-18", 21],
  ["hatchet", "book", "2026-05-09", 11],
  ["the-secret-history", "book", "2026-06-06", 24],
  ["born-a-crime", "audiobook", "2026-07-04", 19],
  ["normal-people", "book", "2026-08-01", 9],
  ["the-diary-of-a-young-girl", "book", "2026-08-22", 17],
];

export const HISTORY: HistoryItem[] = HISTORY_IDS.map(([id, format, borrowed, days]) => ({ id, format, borrowed, returned: addDays(borrowed, days) }));

export interface Fine {
  id: string;
  date: ISODate;
  description: string;
  title?: string;
  amount: number;
  paid: boolean;
}

export const FINES: Fine[] = [
  { id: "f1", date: "2026-10-22", description: "Overdue: 3 days at $0.25 a day, still accruing", title: "The Covenant of Water", amount: 0.75, paid: false },
  { id: "f2", date: "2026-09-18", description: "Damaged dust jacket", title: "The Secret History", amount: 3.0, paid: false },
  { id: "f3", date: "2026-06-30", description: "Overdue: 6 days", title: "Middlemarch", amount: 1.5, paid: true },
  { id: "f4", date: "2026-03-02", description: "Replacement library card", amount: 2.0, paid: true },
];
