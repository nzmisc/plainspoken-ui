// The demo board: Corkboard, a task board, open on the Saltmarsh Ferries digital team's board for
// release 3.2 of their booking app, on a Friday morning (2026-10-23). The ferry company, its routes,
// islands and people are made up. Times are wall-clock times ("2026-10-23T09:41") with no time
// zone, so they read the same on the server and in any browser.

import type { ISODate } from "@/registry/plainspoken/lib/dates";

export type LabelId = "design" | "frontend" | "backend" | "a11y" | "bug";

export type Priority = "urgent" | "high" | "medium" | "low";

export interface Person {
  id: string;
  name: string;
  /** What they do, for lists, menus and hover text */
  role: string;
  /** A picture; people without one get their initials */
  picture?: string;
  /** When they last did something on the board, wall-clock time: the header shows the most recent first */
  seen: string;
}

export interface BoardLabel {
  id: LabelId;
  label: string;
  /** A chart colour token, for the square next to the label */
  color: string;
}

/** The stand-in pictures the demo's image files are drawn as (see picture.tsx) */
export type PictureKind = "seat-map" | "screens" | "form" | "map" | "icons" | "chart";

export interface Attachment {
  id: string;
  name: string;
  /** Bytes */
  size: number;
  /** MIME type, "" when unknown */
  type: string;
  /** Person id of who added it */
  by: string;
  /** "2026-10-21T15:02", local wall-clock time */
  at: string;
  /** The demo's own image files: which stand-in picture to draw */
  picture?: PictureKind;
  /** A file added in the browser: an object URL for it (pictures show it, Download uses it) */
  url?: string;
}

export interface ChecklistItem {
  id: string;
  text: string;
  done: boolean;
}

export interface BoardComment {
  id: string;
  /** Person id */
  by: string;
  at: string;
  /** Plain text; "@Tom" mentions a member by first name */
  body: string;
  /** Set once the comment has been changed */
  edited?: boolean;
}

/** What happened to a card, for its activity list */
export type ActivityEvent =
  | { type: "created" }
  | { type: "moved"; from: string; to: string }
  | { type: "assigned"; person: string }
  | { type: "unassigned"; person: string }
  | { type: "attached"; name: string }
  | { type: "detached"; name: string }
  | { type: "checked"; item: string }
  | { type: "unchecked"; item: string }
  | { type: "labelled"; label: LabelId }
  | { type: "unlabelled"; label: LabelId }
  | { type: "due"; date: ISODate | null }
  | { type: "priority"; priority: Priority }
  | { type: "cover"; name: string | null }
  | { type: "described" };

export interface ActivityEntry {
  id: string;
  /** Person id */
  by: string;
  at: string;
  event: ActivityEvent;
}

export interface BoardCard {
  /** The card's key, shown on it: "FA-110" */
  id: string;
  title: string;
  /** Plain text; paragraphs are separated by a blank line */
  description: string;
  labels: LabelId[];
  /** Person ids */
  assignees: string[];
  due: ISODate | null;
  priority: Priority;
  checklist: ChecklistItem[];
  attachments: Attachment[];
  comments: BoardComment[];
  /** Oldest first */
  activity: ActivityEntry[];
  /** Person ids of people following the card without working on it */
  watchers: string[];
  /** Id of an image attachment drawn across the top of the card */
  cover: string | null;
  createdBy: string;
  createdAt: string;
}

export interface BoardColumn {
  id: string;
  title: string;
  /** Work-in-progress limit: the column is marked once it holds more cards than this */
  limit: number | null;
  /** Card ids, top to bottom */
  cardIds: string[];
}

/** "Today" in the demo, and the moment it is: Friday morning */
export const KANBAN_TODAY: ISODate = "2026-10-23";
export const KANBAN_NOW = "2026-10-23T10:15";

export const BOARD = {
  name: "Ferry app 3.2",
  team: "Saltmarsh Ferries, digital team",
  release: "2026-11-06",
};

// People -----------------------------------------------------------------------------------------

/**
 * A drawn head and shoulders, as an SVG data URL: the demo has no photos of anyone. Pictures are
 * content, like a photo would be, so they have colours of their own rather than theme tokens.
 */
function portrait(bg: string, skin: string, hair: string, style: "short" | "long" | "bun" | "curly" | "bald", shirt: string): string {
  const back = style === "long" ? `<path d="M9 21Q9 6 20 6Q31 6 31 21V33H9Z" fill="${hair}"/>` : "";
  const top = {
    short: `<path d="M12 16Q12 8 20 8Q28 8 28 16Q24 11 16 13Z" fill="${hair}"/>`,
    long: `<path d="M12 17Q12 8 20 8Q28 8 28 17Q22 10 12 17Z" fill="${hair}"/>`,
    bun: `<circle cx="20" cy="6" r="4" fill="${hair}"/><path d="M12 16Q12 8 20 8Q28 8 28 16Q20 10 12 16Z" fill="${hair}"/>`,
    curly: `<path d="M11 17Q9 7 20 6Q31 7 29 17Q28 12 25 12Q22 10 20 12Q17 10 15 12Q12 12 11 17Z" fill="${hair}"/>`,
    bald: "",
  }[style];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><rect width="40" height="40" fill="${bg}"/>${back}<path d="M5 40Q5 28 20 28Q35 28 35 40Z" fill="${shirt}"/><rect x="17" y="22" width="6" height="7" fill="${skin}"/><circle cx="20" cy="16" r="8" fill="${skin}"/>${top}</svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

/** A symmetrical pattern of squares, for people who picked a pattern instead of a picture */
function pattern(bg: string, fg: string, bits: number): string {
  let cells = "";
  for (let y = 0; y < 5; y++)
    for (let x = 0; x < 3; x++)
      if ((bits >> (y * 3 + x)) & 1) {
        cells += `<rect x="${4 + x * 6.4}" y="${4 + y * 6.4}" width="6.4" height="6.4"/>`;
        if (x < 2) cells += `<rect x="${4 + (4 - x) * 6.4}" y="${4 + y * 6.4}" width="6.4" height="6.4"/>`;
      }
  return `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><rect width="40" height="40" fill="${bg}"/><g fill="${fg}">${cells}</g></svg>`)}`;
}

/** Everyone on the board: the app team first, then the people around it who follow and comment */
export const PEOPLE: Person[] = [
  { id: "rosa", name: "Rosa Lindholm", role: "Product designer", seen: "2026-10-23T10:12", picture: portrait("#cfe3d8", "#f1c7a8", "#7a4a2a", "long", "#2f6f6a") },
  { id: "priya", name: "Priya Natarajan", role: "Product manager", seen: "2026-10-23T10:05", picture: portrait("#e8d6f0", "#a9714b", "#1d1414", "bun", "#7b3f8c") },
  { id: "hana", name: "Hana Sato", role: "Front-end developer", seen: "2026-10-23T09:58" },
  { id: "kwame", name: "Kwame Asante", role: "Back-end developer", seen: "2026-10-23T09:40", picture: portrait("#f3e2c4", "#6b4129", "#141010", "bald", "#c2652d") },
  { id: "tom", name: "Tom Achterberg", role: "iOS developer", seen: "2026-10-22T17:30" },
  { id: "leah", name: "Leah Moreno", role: "Android developer", seen: "2026-10-23T08:50", picture: portrait("#d6e4f2", "#d9a37e", "#3b2416", "curly", "#3c5a99") },
  { id: "felix", name: "Felix Brandt", role: "QA engineer", seen: "2026-10-22T16:05" },
  { id: "aoife", name: "Aoife Gallagher", role: "Customer support lead", seen: "2026-10-23T09:51", picture: portrait("#f5dccf", "#f3cdb4", "#b5562b", "long", "#4f7a3a") },
  { id: "mateus", name: "Mateus Oliveira", role: "Data analyst", seen: "2026-10-21T14:00" },
  { id: "ingrid", name: "Ingrid Solberg", role: "Head of digital", seen: "2026-10-22T12:10", picture: portrait("#dfe7ec", "#f0cdb6", "#d9c08a", "short", "#2b3a4a") },
  { id: "yusuf", name: "Yusuf Demir", role: "Platform engineer", seen: "2026-10-20T11:00" },
  { id: "mei", name: "Mei Zhou", role: "UX researcher", seen: "2026-10-22T15:20", picture: pattern("#e9f0e6", "#4c8b5c", 0b101_011_110_011_101) },
  { id: "seun", name: "Oluwaseun Adebayo", role: "Payments specialist", seen: "2026-10-21T10:30" },
  { id: "sanna", name: "Sanna Virtanen", role: "Content designer", seen: "2026-10-23T09:20", picture: portrait("#f0ead2", "#f4d3bd", "#e6d3a3", "bun", "#a23b3b") },
  { id: "diego", name: "Diego Ramírez", role: "Marketing manager", seen: "2026-10-22T18:45" },
  { id: "fatima", name: "Fatima Zahra Benali", role: "Legal counsel", seen: "2026-10-19T09:30" },
  { id: "niamh", name: "Niamh O'Connor", role: "Port operations, Brannock", seen: "2026-10-23T07:55", picture: portrait("#dde9f5", "#f6d5c3", "#8a2f1e", "curly", "#1f4f7a") },
  { id: "rahul", name: "Rahul Mehta", role: "Security engineer", seen: "2026-10-18T16:00" },
  { id: "elif", name: "Elif Kaya", role: "Mobile developer", seen: "2026-10-21T13:15" },
  { id: "bogdan", name: "Bogdan Popescu", role: "Site reliability engineer", seen: "2026-10-22T22:40", picture: pattern("#f1e4e4", "#9c3d3d", 0b011_100_111_010_101) },
  { id: "chiara", name: "Chiara Bianchi", role: "Customer support", seen: "2026-10-23T08:30" },
  { id: "kofi", name: "Kofi Mensah", role: "Fleet office", seen: "2026-10-22T10:00", picture: portrait("#e4ecd9", "#5a3a26", "#151111", "short", "#5c6b2e") },
  { id: "astrid", name: "Astrid Nygaard", role: "Finance", seen: "2026-10-20T15:45" },
  { id: "tariq", name: "Tariq Haddad", role: "QA engineer", seen: "2026-10-22T11:25" },
  { id: "sofia", name: "Sofía Castillo", role: "Translator", seen: "2026-10-22T19:10", picture: portrait("#f7e3d3", "#c98e66", "#2a1a12", "long", "#d08a2c") },
  { id: "jun", name: "Jun Park", role: "Back-end developer", seen: "2026-10-21T17:50" },
  { id: "ewa", name: "Ewa Kowalczyk", role: "Accessibility specialist", seen: "2026-10-22T14:35", picture: pattern("#e6e8f3", "#4a5799", 0b110_101_011_111_100) },
  { id: "lars", name: "Lars Henriksen", role: "Captain, MV Kestle Star", seen: "2026-10-23T06:40", picture: portrait("#d9e6ee", "#e9b99a", "#9e9e9e", "short", "#1e2a3a") },
  { id: "amina", name: "Amina Yusuf", role: "Customer support", seen: "2026-10-21T09:05" },
  { id: "pierre", name: "Pierre Lefebvre", role: "Partnerships", seen: "2026-10-16T10:20" },
  { id: "grace", name: "Grace Mwangi", role: "Product analyst", seen: "2026-10-22T13:00", picture: portrait("#efe0ec", "#4e3022", "#0f0b0b", "curly", "#8c4a7d") },
  { id: "hiroshi", name: "Hiroshi Tanabe", role: "Operations planner", seen: "2026-10-23T09:10" },
  { id: "ana", name: "Ana Petrović", role: "Designer", seen: "2026-10-20T10:40" },
  { id: "mohammed", name: "Mohammed Al-Sayed", role: "Ticket office, Harrowby", seen: "2026-10-22T08:15", picture: portrait("#ece6da", "#b07a55", "#1b1411", "short", "#2e5e4e") },
  { id: "lucia", name: "Lucía Fernández", role: "Marketing", seen: "2026-10-17T12:00" },
  { id: "ravi", name: "Ravi Shankar", role: "Data engineer", seen: "2026-10-21T16:30" },
  { id: "isabel", name: "Isabel Duarte", role: "Training coordinator", seen: "2026-10-15T09:00" },
  { id: "emeka", name: "Emeka Okonkwo", role: "Revenue manager", seen: "2026-10-22T17:05" },
  { id: "saoirse", name: "Saoirse Byrne", role: "Customer support", seen: "2026-10-22T20:30" },
  { id: "viktor", name: "Viktor Hallberg", role: "Harbour master, Kestle Point", seen: "2026-10-22T07:20", picture: pattern("#eaf0f2", "#2f6f7f", 0b111_010_101_010_111) },
];

/** The app team: the people the board's cards are mostly assigned to */
export const TEAM = ["rosa", "priya", "hana", "kwame", "tom", "leah", "felix"];

/** Who is looking at the board: "My cards", your own comments, what you add */
export const ME = "rosa";

export const LABELS: BoardLabel[] = [
  { id: "design", label: "Design", color: "var(--chart-1)" },
  { id: "frontend", label: "Front end", color: "var(--chart-2)" },
  { id: "backend", label: "Back end", color: "var(--chart-3)" },
  { id: "a11y", label: "Accessibility", color: "var(--chart-4)" },
  { id: "bug", label: "Bug", color: "var(--chart-5)" },
];

// Cards ------------------------------------------------------------------------------------------

const KB = 1024;
const MB = 1024 * 1024;
const PNG = "image/png";
const PDF = "application/pdf";
const XLSX = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
const DOCX = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

let n = 0;
const ev = (by: string, at: string, event: ActivityEvent): ActivityEntry => ({ id: `a${++n}`, by, at, event });
const todo = (id: string, text: string, done = false): ChecklistItem => ({ id, text, done });

/** A card with the defaults filled in: no labels, nobody, no date, medium, and a "created" entry first */
function card(c: Partial<BoardCard> & Pick<BoardCard, "id" | "title" | "createdBy" | "createdAt">): BoardCard {
  return {
    description: "",
    labels: [],
    assignees: [],
    due: null,
    priority: "medium",
    checklist: [],
    attachments: [],
    comments: [],
    cover: null,
    watchers: [],
    ...c,
    activity: [ev(c.createdBy, c.createdAt, { type: "created" }), ...(c.activity ?? [])],
  };
}

export const CARDS: BoardCard[] = [
  // Backlog
  card({
    id: "FA-131",
    title: "Offline boarding passes: keep the last three on the phone",
    description:
      "Signal on the Brannock pier is patchy, and people open the app at the gate. Keep the three most recent boarding passes on the device so they open without a connection.\n\nThe pass must still say when it was last checked against the server.",
    labels: ["frontend"],
    priority: "medium",
    createdBy: "priya",
    createdAt: "2026-10-14T11:20",
  }),
  card({
    id: "FA-134",
    title: "Explore a cabin picker for the overnight sailings",
    description: "Once the seat map is out: could the same grid show cabins? Two-berth and four-berth, inside and sea view.",
    labels: ["design"],
    assignees: ["rosa"],
    priority: "low",
    createdBy: "rosa",
    createdAt: "2026-10-16T16:05",
  }),
  card({
    id: "FA-137",
    title: "Timetable pages in Norwegian and German",
    labels: ["frontend"],
    priority: "low",
    createdBy: "priya",
    createdAt: "2026-10-09T10:00",
  }),
  card({
    id: "FA-139",
    title: "Show car deck height limits before checkout",
    description:
      "Vans over 2.1 m can only go on the Harrowby boats. Today people find out at the port. Ask for the vehicle height with the registration and warn on sailings that can't take it.",
    labels: ["frontend", "backend"],
    priority: "medium",
    createdBy: "felix",
    createdAt: "2026-10-12T09:44",
  }),
  card({
    id: "FA-140",
    title: "Spike: live vessel positions from the AIS feed",
    description: "Half a day to see what the feed gives us and how often. Output: a page of notes and a sample of the data.",
    labels: ["backend"],
    assignees: ["kwame"],
    priority: "low",
    attachments: [{ id: "f-ais", name: "ais-sample.json", size: 86 * KB, type: "application/json", by: "kwame", at: "2026-10-19T17:30" }],
    createdBy: "kwame",
    createdAt: "2026-10-19T17:10",
    activity: [ev("kwame", "2026-10-19T17:30", { type: "attached", name: "ais-sample.json" })],
  }),
  card({
    id: "FA-142",
    title: "Remember the last route on the home screen",
    labels: ["frontend"],
    priority: "low",
    createdBy: "leah",
    createdAt: "2026-10-20T13:12",
  }),
  card({
    id: "FA-145",
    title:
      "When a sailing is cancelled for weather, offer the next three sailings on the same route, a full refund, or an open ticket valid for 90 days, and say which of those the fare allows",
    description:
      "From the support team: after the October storms, most calls were people asking what their options were. The app knows the fare rules; it should say them.",
    labels: ["backend", "frontend"],
    priority: "high",
    createdBy: "priya",
    createdAt: "2026-10-21T08:55",
  }),

  // To do
  card({
    id: "FA-118",
    title: "Wallet passes for boarding (iOS and Android)",
    description: "Add the boarding pass to the phone's wallet from the booking confirmation. The barcode is the same one the gates scan today.",
    labels: ["frontend"],
    assignees: ["tom", "leah"],
    due: "2026-10-30",
    priority: "high",
    checklist: [
      todo("c1", "Pass layout signed off"),
      todo("c2", "Signing certificate from IT"),
      todo("c3", "iOS: add to wallet"),
      todo("c4", "Android: add to wallet"),
    ],
    attachments: [{ id: "f-pass", name: "wallet-pass-layout.png", size: 412 * KB, type: PNG, by: "rosa", at: "2026-10-20T14:40", picture: "screens" }],
    comments: [{ id: "m1", by: "tom", at: "2026-10-21T09:12", body: "@Rosa can the route name go on the front? The gate staff look for it first." }],
    createdBy: "priya",
    createdAt: "2026-10-13T10:30",
    activity: [
      ev("priya", "2026-10-13T10:31", { type: "assigned", person: "tom" }),
      ev("priya", "2026-10-13T10:31", { type: "assigned", person: "leah" }),
      ev("rosa", "2026-10-20T14:40", { type: "attached", name: "wallet-pass-layout.png" }),
    ],
  }),
  card({
    id: "FA-119",
    title: "Winter timetable: new sailing times on every route from 2 November",
    description:
      "The winter timetable starts on Monday 2 November. Every route changes, two overnight sailings stop until March, and Harrowby Point goes down to three a day.\n\nThe app has to show the new times from the morning of the 2nd, and anyone already booked on a sailing that moves needs to hear about it before then. Translations go out at the same time.",
    labels: ["backend", "frontend"],
    assignees: ["priya", "kwame", "hana", "sanna", "hiroshi", "sofia"],
    due: "2026-10-30",
    priority: "urgent",
    checklist: [
      todo("c1", "Final times from operations", true),
      todo("c2", "Import into the timetable service", true),
      todo("c3", "Rebooking messages for moved sailings"),
      todo("c4", "Norwegian and German texts"),
      todo("c5", "Check every route on staging"),
      todo("c6", "Switch on at 05:00 on the 2nd"),
    ],
    attachments: [
      { id: "f-winter", name: "winter-timetable-2026.xlsx", size: 96 * KB, type: XLSX, by: "hiroshi", at: "2026-10-16T11:00" },
      { id: "f-notice", name: "harbour-notice-kestle-point.pdf", size: 210 * KB, type: PDF, by: "viktor", at: "2026-10-19T08:40" },
    ],
    watchers: ["ingrid", "astrid", "grace", "ravi", "pierre", "amina", "saoirse", "tariq", "bogdan", "isabel", "rosa"],
    comments: [
      { id: "m1", by: "hiroshi", at: "2026-10-16T11:02", body: "Final winter times are attached. The two overnight Brannock sailings stop from 2 November until 15 March." },
      { id: "m2", by: "aoife", at: "2026-10-16T13:40", body: "Last winter we had 600 calls in the first week from people whose sailing moved. Can we tell them before they find out at the port?" },
      { id: "m3", by: "priya", at: "2026-10-16T14:05", body: "Yes, that is the main thing. @Kwame how many bookings are on sailings that move?" },
      { id: "m4", by: "kwame", at: "2026-10-16T16:30", body: "About 2,300 bookings on 41 sailings. I can list them by route." },
      { id: "m5", by: "niamh", at: "2026-10-17T07:50", body: "Please don't move anyone onto the 06:10 from Brannock. The car deck is already full most days in November." },
      { id: "m6", by: "lars", at: "2026-10-17T08:15", body: "Same on the Kestle Star at weekends. Foot passengers are fine." },
      { id: "m7", by: "emeka", at: "2026-10-17T10:00", body: "If we offer a free change, it has to be to a sailing at the same fare or lower. Otherwise finance will ask." },
      { id: "m8", by: "sanna", at: "2026-10-18T09:30", body: "Draft message for people whose sailing moved: what changed, the new time, and two buttons, Keep it or Choose another. @Sofía it's ready for translation." },
      { id: "m9", by: "viktor", at: "2026-10-19T08:42", body: "Harbour notice for Kestle Point attached: the berth is closed on 4 and 5 November for repairs, so those sailings go from the north pier." },
      { id: "m10", by: "sofia", at: "2026-10-19T17:20", body: "Norwegian is done, German by Wednesday." },
      { id: "m11", by: "mohammed", at: "2026-10-20T12:10", body: "The ticket office in Harrowby will put the new times up on the 31st. Will the app match the printed sheet?" },
      { id: "m12", by: "hiroshi", at: "2026-10-20T14:00", body: "@Mohammed yes, same source. I'll send you the PDF on the 30th." },
      { id: "m13", by: "chiara", at: "2026-10-22T09:15", body: "Support would like the list of moved bookings a day before the messages go out, so we know what's coming." },
      { id: "m14", by: "rosa", at: "2026-10-22T11:30", body: "Design for the message and the rebooking screen is in the seat map file, page 4. @Hana the Keep it button is the main one." },
    ],
    createdBy: "priya",
    createdAt: "2026-10-16T10:50",
    activity: [
      ev("priya", "2026-10-16T10:52", { type: "assigned", person: "kwame" }),
      ev("priya", "2026-10-16T10:52", { type: "assigned", person: "hiroshi" }),
      ev("hiroshi", "2026-10-16T11:00", { type: "attached", name: "winter-timetable-2026.xlsx" }),
      ev("hiroshi", "2026-10-16T11:05", { type: "checked", item: "Final times from operations" }),
      ev("priya", "2026-10-18T09:00", { type: "assigned", person: "sanna" }),
      ev("priya", "2026-10-18T09:00", { type: "assigned", person: "sofia" }),
      ev("viktor", "2026-10-19T08:40", { type: "attached", name: "harbour-notice-kestle-point.pdf" }),
      ev("kwame", "2026-10-20T18:20", { type: "checked", item: "Import into the timetable service" }),
      ev("priya", "2026-10-22T09:00", { type: "assigned", person: "hana" }),
    ],
  }),
  card({
    id: "FA-121",
    title: "Push a notification when a sailing is more than 15 minutes late",
    description: "Only to people booked on that sailing, and only once per delay. Say the new departure time.",
    labels: ["backend", "frontend"],
    assignees: ["kwame"],
    due: "2026-10-24",
    priority: "high",
    checklist: [todo("c1", "Delay events from the operations feed", true), todo("c2", "Notification copy"), todo("c3", "Opt-out in settings")],
    attachments: [{ id: "f-copy", name: "delay-notification-copy.docx", size: 24 * KB, type: DOCX, by: "priya", at: "2026-10-22T11:05" }],
    createdBy: "priya",
    createdAt: "2026-10-12T15:00",
    activity: [ev("kwame", "2026-10-21T16:20", { type: "checked", item: "Delay events from the operations feed" })],
  }),
  card({
    id: "FA-124",
    title: "Contrast and focus states on the booking form",
    description:
      "From the accessibility audit: the grey hint text is 3.9:1 on white, and the focus outline disappears on the passenger steppers.\n\nFix both in the design system first, then here.",
    labels: ["a11y", "design"],
    assignees: ["rosa"],
    due: "2026-10-28",
    priority: "medium",
    checklist: [
      todo("c1", "Hint text to 4.5:1", true),
      todo("c2", "Focus outline on steppers", true),
      todo("c3", "Error messages tied to fields"),
      todo("c4", "Check in dark mode"),
      todo("c5", "Check at 200% zoom"),
      todo("c6", "Retest with the auditors"),
    ],
    attachments: [
      { id: "f-audit", name: "accessibility-audit-booking.pdf", size: 1.8 * MB, type: PDF, by: "priya", at: "2026-10-15T09:20" },
      { id: "f-focus", name: "focus-states.png", size: 196 * KB, type: PNG, by: "rosa", at: "2026-10-21T15:50", picture: "form" },
    ],
    cover: "f-focus",
    createdBy: "priya",
    createdAt: "2026-10-15T09:18",
    activity: [
      ev("priya", "2026-10-15T09:20", { type: "attached", name: "accessibility-audit-booking.pdf" }),
      ev("priya", "2026-10-15T09:21", { type: "assigned", person: "rosa" }),
      ev("rosa", "2026-10-21T15:50", { type: "attached", name: "focus-states.png" }),
      ev("rosa", "2026-10-21T15:51", { type: "cover", name: "focus-states.png" }),
      ev("rosa", "2026-10-22T10:02", { type: "checked", item: "Hint text to 4.5:1" }),
      ev("rosa", "2026-10-22T16:40", { type: "checked", item: "Focus outline on steppers" }),
    ],
  }),
  card({
    id: "FA-126",
    title: "Fix: the date picker jumps to the next month on the 31st",
    description: "On any day that is the 31st, opening the calendar shows the month after next. Probably adding a month to the 31st and rolling over.",
    labels: ["bug", "frontend"],
    assignees: ["hana"],
    due: "2026-10-22",
    priority: "urgent",
    createdBy: "felix",
    createdAt: "2026-10-20T08:30",
    comments: [{ id: "m1", by: "felix", at: "2026-10-20T08:32", body: "Seen on 31 August too, so it isn't new. Steps are in the description." }],
  }),
  card({
    id: "FA-128",
    title: "Group bookings: up to nine passengers on one ticket",
    labels: ["frontend", "backend"],
    assignees: ["priya"],
    priority: "medium",
    createdBy: "priya",
    createdAt: "2026-10-08T14:00",
  }),
  card({
    id: "FA-129",
    title: "Write the release notes for 3.2",
    assignees: ["priya"],
    due: "2026-11-04",
    priority: "low",
    createdBy: "priya",
    createdAt: "2026-10-19T09:00",
  }),

  // In progress
  card({
    id: "FA-110",
    title: "Seat map for the Brannock overnight route",
    description:
      "The overnight boats to the Isle of Brannock have reserved seats, and today people get whatever the system picks. Let them choose on a map of the deck, as they can on the website.\n\nThe map has to work on a small phone and with a screen reader: seats are buttons in a grid, arrow keys move between them.",
    labels: ["design", "frontend"],
    assignees: ["rosa", "hana"],
    due: "2026-10-27",
    priority: "high",
    checklist: [
      todo("c1", "Deck plans from the fleet office", true),
      todo("c2", "Seat grid component", true),
      todo("c3", "Deck B on one phone screen", true),
      todo("c4", "Availability from the seats endpoint"),
      todo("c5", "Usability test with five passengers"),
    ],
    attachments: [
      { id: "f-seat", name: "seat-map-v3.png", size: 248 * KB, type: PNG, by: "rosa", at: "2026-10-21T10:30", picture: "seat-map" },
      { id: "f-num", name: "seat-numbering.xlsx", size: 31 * KB, type: XLSX, by: "priya", at: "2026-10-14T09:10" },
      { id: "f-deck", name: "deck-plans-brannock.pdf", size: 2.4 * MB, type: PDF, by: "priya", at: "2026-10-14T09:08" },
    ],
    cover: "f-seat",
    watchers: ["ingrid", "mei", "ewa", "niamh"],
    comments: [
      { id: "m1", by: "priya", at: "2026-10-20T09:15", body: "@Rosa the overnight boats have 412 seats over two decks. Can deck B fit on one phone screen, or do we need to pan?" },
      {
        id: "m2",
        by: "rosa",
        at: "2026-10-21T10:34",
        body: "It fits if the row letters go down the side instead of on every seat. v3 is attached. @Hana does the grid still work with every seat as a button?",
      },
      { id: "m3", by: "hana", at: "2026-10-22T14:02", body: "It does. Arrow keys move between seats and Space picks one. I'll wire it to real availability once @Kwame has the endpoint up." },
      { id: "m4", by: "kwame", at: "2026-10-23T08:20", body: "The seats endpoint is on staging now. About 40 KB per sailing, so we can fetch it when the map opens." },
    ],
    createdBy: "priya",
    createdAt: "2026-10-12T10:00",
    activity: [
      ev("priya", "2026-10-12T10:02", { type: "labelled", label: "design" }),
      ev("priya", "2026-10-12T10:02", { type: "assigned", person: "rosa" }),
      ev("priya", "2026-10-14T09:08", { type: "attached", name: "deck-plans-brannock.pdf" }),
      ev("priya", "2026-10-14T09:10", { type: "attached", name: "seat-numbering.xlsx" }),
      ev("rosa", "2026-10-15T13:30", { type: "checked", item: "Deck plans from the fleet office" }),
      ev("priya", "2026-10-19T09:00", { type: "moved", from: "To do", to: "In progress" }),
      ev("priya", "2026-10-19T09:01", { type: "assigned", person: "hana" }),
      ev("priya", "2026-10-19T09:01", { type: "labelled", label: "frontend" }),
      ev("rosa", "2026-10-21T10:30", { type: "attached", name: "seat-map-v3.png" }),
      ev("rosa", "2026-10-21T10:31", { type: "cover", name: "seat-map-v3.png" }),
      ev("hana", "2026-10-22T13:55", { type: "checked", item: "Seat grid component" }),
      ev("rosa", "2026-10-22T17:10", { type: "checked", item: "Deck B on one phone screen" }),
    ],
  }),
  card({
    id: "FA-112",
    title: "Pay with a saved card at checkout",
    description: "Most bookings are by people who have booked before. Offer their saved card first, with the last four digits and the expiry, and ask only for the security code.",
    labels: ["backend", "frontend"],
    assignees: ["kwame", "hana"],
    due: "2026-10-21",
    priority: "urgent",
    checklist: [
      todo("c1", "Store tokens, not card numbers", true),
      todo("c2", "List saved cards", true),
      todo("c3", "Security code step", true),
      todo("c4", "Remove a saved card", true),
      todo("c5", "Expired card message"),
      todo("c6", "3-D Secure fallback"),
      todo("c7", "Load test"),
    ],
    attachments: [
      { id: "f-flow", name: "saved-card-flow.pdf", size: 640 * KB, type: PDF, by: "rosa", at: "2026-10-13T16:00" },
      { id: "f-checkout", name: "checkout-saved-cards.png", size: 302 * KB, type: PNG, by: "rosa", at: "2026-10-13T16:02", picture: "screens" },
    ],
    watchers: ["seun", "rahul", "astrid", "emeka", "ingrid"],
    comments: [
      { id: "m1", by: "felix", at: "2026-10-21T17:45", body: "The expired card path shows a blank page on staging. @Kwame is that the 3-D Secure redirect?" },
      { id: "m2", by: "kwame", at: "2026-10-22T09:05", body: "Yes, the redirect URL was wrong for expired cards. Fixed on my branch, deploying this afternoon." },
      { id: "m3", by: "priya", at: "2026-10-22T09:30", body: "Thanks both. This was due Wednesday, so let's get it to review today if we can." },
    ],
    createdBy: "priya",
    createdAt: "2026-10-06T10:00",
    activity: [ev("priya", "2026-10-14T09:00", { type: "moved", from: "To do", to: "In progress" })],
  }),
  card({
    id: "FA-115",
    title: "Timetable: show the sailings that depend on the tide",
    description: "Harrowby Point has sailings that only run at high water. Mark them in the timetable and say why.",
    labels: ["backend"],
    assignees: ["kwame"],
    due: "2026-10-29",
    priority: "medium",
    checklist: [todo("c1", "Tide table import", true), todo("c2", "Mark in the timetable")],
    attachments: [{ id: "f-tide", name: "harrowby-tides-2026.csv", size: 12 * KB, type: "text/csv", by: "kwame", at: "2026-10-18T12:00" }],
    createdBy: "kwame",
    createdAt: "2026-10-17T11:30",
    activity: [ev("kwame", "2026-10-20T10:00", { type: "moved", from: "To do", to: "In progress" })],
  }),
  card({
    id: "FA-117",
    title: "Screen reader names for the route map",
    description: "The route map reads as \"image\". Give each port and route a name, and list the routes as text under the map.",
    labels: ["a11y", "frontend"],
    assignees: ["leah", "rosa"],
    due: "2026-10-25",
    priority: "high",
    checklist: [todo("c1", "Names for ports"), todo("c2", "Names for routes"), todo("c3", "Routes as a list under the map")],
    attachments: [{ id: "f-map", name: "route-map-labels.png", size: 520 * KB, type: PNG, by: "rosa", at: "2026-10-22T11:15", picture: "map" }],
    cover: "f-map",
    comments: [
      { id: "m1", by: "leah", at: "2026-10-22T15:20", body: "@Rosa do the islands need names too, or only the ports?" },
      { id: "m2", by: "rosa", at: "2026-10-22T15:41", body: "Only the ports. The islands are in the port names already." },
    ],
    createdBy: "rosa",
    createdAt: "2026-10-18T10:00",
    activity: [ev("leah", "2026-10-22T09:00", { type: "moved", from: "To do", to: "In progress" })],
  }),

  // Review
  card({
    id: "FA-104",
    title: "Refund form: check the booking reference before sending",
    description: "Six characters, letters and digits, no O or I. Say what is wrong next to the field instead of after sending.",
    labels: ["frontend", "bug"],
    assignees: ["hana", "felix"],
    due: "2026-10-23",
    priority: "high",
    attachments: [{ id: "f-refund", name: "refund-form-errors.png", size: 174 * KB, type: PNG, by: "felix", at: "2026-10-22T16:00", picture: "form" }],
    comments: [
      { id: "m1", by: "hana", at: "2026-10-22T15:10", body: "Ready for review. @Felix the test bookings are in the description of the pull request." },
      { id: "m2", by: "felix", at: "2026-10-22T16:02", body: "Looks right. One thing: the error for a lowercase reference says \"invalid\", it should just uppercase it." },
    ],
    createdBy: "felix",
    createdAt: "2026-10-16T09:00",
    activity: [ev("hana", "2026-10-22T15:09", { type: "moved", from: "In progress", to: "Review" })],
  }),
  card({
    id: "FA-106",
    title: "Cache the timetables for a day",
    labels: ["backend"],
    assignees: ["kwame"],
    due: "2026-10-20",
    priority: "medium",
    checklist: [todo("c1", "Cache headers", true), todo("c2", "Purge when the timetable changes", true), todo("c3", "Graph in the dashboard", true)],
    createdBy: "kwame",
    createdAt: "2026-10-07T10:00",
    activity: [ev("kwame", "2026-10-19T18:00", { type: "moved", from: "In progress", to: "Review" })],
  }),
  card({
    id: "FA-108",
    title: "New app icon and splash screen",
    description: "The current icon is the old logo squeezed into a square. Three options attached; we picked the middle one on Tuesday.",
    labels: ["design"],
    assignees: ["rosa"],
    due: "2026-11-02",
    priority: "low",
    attachments: [
      { id: "f-icons", name: "icon-options.png", size: 380 * KB, type: PNG, by: "rosa", at: "2026-10-19T15:00", picture: "icons" },
      { id: "f-splash", name: "splash-dark.png", size: 210 * KB, type: PNG, by: "rosa", at: "2026-10-21T12:20", picture: "screens" },
      { id: "f-sizes", name: "app-icon-sizes.zip", size: 3.1 * MB, type: "application/zip", by: "rosa", at: "2026-10-21T12:24" },
    ],
    cover: "f-icons",
    comments: [
      { id: "m1", by: "priya", at: "2026-10-20T11:00", body: "The middle one. The others read as a sailing club." },
      { id: "m2", by: "tom", at: "2026-10-21T13:00", body: "@Rosa I need the 1024 px one without the rounded mask, the store adds its own." },
      { id: "m3", by: "rosa", at: "2026-10-21T13:10", body: "It's in the zip, @Tom: icon-1024-square.png." },
    ],
    createdBy: "rosa",
    createdAt: "2026-10-12T14:00",
    activity: [ev("rosa", "2026-10-21T12:30", { type: "moved", from: "In progress", to: "Review" })],
  }),

  // Done
  card({
    id: "FA-092",
    title: "Sign in with a one-time code by email",
    labels: ["backend", "frontend"],
    assignees: ["kwame", "tom"],
    due: "2026-10-16",
    priority: "high",
    checklist: [todo("c1", "Send the code", true), todo("c2", "Check the code", true), todo("c3", "Rate limit", true), todo("c4", "Copy", true), todo("c5", "Remove passwords", true)],
    createdBy: "priya",
    createdAt: "2026-09-28T10:00",
  }),
  card({
    id: "FA-095",
    title: "Dark mode for the boarding pass screen",
    labels: ["design", "frontend"],
    assignees: ["rosa", "leah"],
    priority: "medium",
    createdBy: "leah",
    createdAt: "2026-10-01T10:00",
  }),
  card({
    id: "FA-097",
    title: "Fix: charged twice when the payment page is reloaded",
    labels: ["bug", "backend"],
    assignees: ["kwame"],
    due: "2026-10-09",
    priority: "urgent",
    createdBy: "felix",
    createdAt: "2026-10-05T19:30",
  }),
  card({
    id: "FA-099",
    title: "Count page views without cookies",
    labels: ["frontend"],
    assignees: ["hana"],
    priority: "low",
    createdBy: "hana",
    createdAt: "2026-10-02T10:00",
  }),
  card({
    id: "FA-100",
    title: "Bigger tap targets on the passenger picker",
    labels: ["a11y"],
    assignees: ["leah"],
    priority: "medium",
    createdBy: "rosa",
    createdAt: "2026-10-03T10:00",
  }),
  card({
    id: "FA-101",
    title: "Download the timetable as a PDF",
    labels: ["frontend"],
    assignees: ["hana"],
    priority: "low",
    attachments: [{ id: "f-pdf", name: "timetable-winter-2026.pdf", size: 820 * KB, type: PDF, by: "hana", at: "2026-10-15T10:00" }],
    createdBy: "priya",
    createdAt: "2026-10-01T09:00",
  }),
  card({
    id: "FA-102",
    title: "Fix: crash on older Android phones when turning the screen during checkout",
    labels: ["bug", "frontend"],
    assignees: ["leah", "felix"],
    priority: "high",
    attachments: [
      { id: "f-log", name: "crash-log.txt", size: 18 * KB, type: "text/plain", by: "felix", at: "2026-10-08T11:00" },
      { id: "f-video", name: "rotate-during-checkout.mp4", size: 8.4 * MB, type: "video/mp4", by: "felix", at: "2026-10-08T11:02" },
    ],
    createdBy: "felix",
    createdAt: "2026-10-08T10:55",
  }),
];

export const COLUMNS: BoardColumn[] = [
  { id: "backlog", title: "Backlog", limit: null, cardIds: ["FA-145", "FA-139", "FA-131", "FA-134", "FA-140", "FA-142", "FA-137"] },
  { id: "todo", title: "To do", limit: 8, cardIds: ["FA-126", "FA-119", "FA-121", "FA-118", "FA-124", "FA-128", "FA-129"] },
  { id: "doing", title: "In progress", limit: 3, cardIds: ["FA-112", "FA-110", "FA-117", "FA-115"] },
  { id: "review", title: "Review", limit: 3, cardIds: ["FA-104", "FA-106", "FA-108"] },
  { id: "done", title: "Done", limit: null, cardIds: ["FA-102", "FA-101", "FA-100", "FA-099", "FA-097", "FA-095", "FA-092"] },
];

/** The cards by id, the shape the board blocks take */
export const CARDS_BY_ID: Record<string, BoardCard> = Object.fromEntries(CARDS.map((c) => [c.id, c]));

/** The column that marks work as finished: its cards are never overdue */
export const DONE_COLUMN = "done";
