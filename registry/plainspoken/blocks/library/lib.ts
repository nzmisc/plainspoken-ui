// What the Library blocks share: the shape of a catalogue record, its copies and availability, and
// how to say them. No React here, so it is safe on the server.
import { Book, Disc3, Headphones, TabletSmartphone, type Glyph } from "@/registry/plainspoken/lib/icons";
import type { ISODate } from "@/registry/plainspoken/lib/dates";
import type { StatusVariant } from "@/registry/plainspoken/ui/status";

export type Format = "book" | "ebook" | "audiobook" | "dvd";

export const FORMATS: Format[] = ["book", "ebook", "audiobook", "dvd"];

export const FORMAT_LABELS: Record<Format, string> = { book: "Book", ebook: "E-book", audiobook: "Audiobook", dvd: "DVD" };

export const FORMAT_ICONS: Record<Format, Glyph> = { book: Book, ebook: TabletSmartphone, audiobook: Headphones, dvd: Disc3 };

/** E-books and audiobooks are lent as licences, not copies on a shelf */
export const isDigital = (f: Format) => f === "ebook" || f === "audiobook";

/** One record in the catalogue: a work, in every format the library holds it in */
export interface LibraryBook {
  id: string;
  /** As published: the original-language title for editions in other languages */
  title: string;
  subtitle?: string;
  /** For films, the director */
  author: string;
  /** "Director" for films; leave out for authors */
  creatorRole?: string;
  year: number;
  language: string;
  audience: "Adult" | "Teen" | "Children";
  subjects: string[];
  formats: Format[];
  description: string;
  /** When the library added it */
  added: ISODate;
}

export interface Branch {
  id: string;
  name: string;
  address: string;
  phone: string;
  /** Opening hours by weekday, 0 = Sunday: ["09:00", "20:00"], or null when closed */
  hours: ([string, string] | null)[];
  /** Short notes: "Parking", "Makerspace" */
  services?: string[];
}

export type CopyStatus = "available" | "checked-out" | "in-transit" | "hold-shelf" | "processing";

/** One physical copy on a shelf (books and DVDs) */
export interface LibraryCopy {
  branch: string;
  format: Format;
  callNumber: string;
  /** Where it is shelved: "Adult fiction", "Teen", "Children's", "DVDs" */
  location: string;
  status: CopyStatus;
  /** When a checked-out copy is due back */
  due?: ISODate;
}

/** How one format of a title stands: copies (or licences), how many are free, and the queue */
export interface FormatAvailability {
  format: Format;
  total: number;
  available: number;
  /** People waiting */
  holds: number;
}

/** The words and the state for one format: "2 of 5 available", "On hold: 3 waiting" */
export function availabilityText(a: FormatAvailability): { text: string; variant: StatusVariant } {
  if (a.total === 0) return { text: "On order", variant: "info" };
  if (a.available > 0)
    return { text: a.total === 1 ? "Available" : `${a.available} of ${a.total} available`, variant: "success" };
  if (a.holds > 0) return { text: `On hold: ${a.holds} waiting`, variant: "warning" };
  return { text: a.total === 1 ? "Checked out" : `All ${a.total} checked out`, variant: "default" };
}

export const COPY_STATUS: Record<CopyStatus, { label: string; variant: StatusVariant }> = {
  available: { label: "Available", variant: "success" },
  "checked-out": { label: "Checked out", variant: "default" },
  "in-transit": { label: "In transit", variant: "info" },
  "hold-shelf": { label: "On the hold shelf", variant: "warning" },
  processing: { label: "Being processed", variant: "info" },
};

/** "Toni Morrison", or "Michael Curtiz (Director)" */
export const creatorLine = (b: Pick<LibraryBook, "author" | "creatorRole">) => (b.creatorRole ? `${b.author} (${b.creatorRole})` : b.author);

/** "24 Oct" style dates, fixed to English so server and browser agree */
export function shortDate(d: ISODate, withYear = false): string {
  const [y, m, day] = d.split("-").map(Number);
  const month = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][m - 1];
  return withYear ? `${day} ${month} ${y}` : `${day} ${month}`;
}

/** A branch's hours on a weekday (0 = Sunday), as "10:00–17:00" or "Closed" */
export function hoursText(b: Branch, weekday: number): string {
  const h = b.hours[weekday];
  return h ? `${h[0]}–${h[1]}` : "Closed";
}

export const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
