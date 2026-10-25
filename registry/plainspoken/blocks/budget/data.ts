// The budget demo's data: the design team of Kestrel Labs (invented), planning 2027 line by line
// against what it spent in 2026. Amounts are whole euros. Plus the sums the blocks show.

export const BUDGET_YEAR = 2027;
export const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] as const;
export type MonthKey = "jan" | "feb" | "mar" | "apr" | "may" | "jun" | "jul" | "aug" | "sep" | "oct" | "nov" | "dec";
export const MONTH_KEYS: MonthKey[] = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

export const CATEGORIES = ["Software", "Hardware", "People", "Travel", "Research", "Office"] as const;
export const OWNERS = ["Mira Okafor", "Tomás Ferreira", "Ilse Brandt", "Kwame Asante", "Yuki Moreau"] as const;

export type BudgetLine = {
  id: string;
  item: string;
  category: string | null;
  owner: string | null;
  /** What the line cost in the year before, from the books; not editable here */
  lastYear: number | null;
  approved: boolean;
  notes: string;
} & Record<MonthKey, number | null>;

/** Twelve months from a pattern: the same each month, or amounts in the listed months */
function months(each: number | Partial<Record<MonthKey, number>>): Record<MonthKey, number | null> {
  return Object.fromEntries(MONTH_KEYS.map((m) => [m, typeof each === "number" ? each : (each[m] ?? null)])) as Record<MonthKey, number | null>;
}

type Seed = [id: string, item: string, category: string, owner: string, amounts: number | Partial<Record<MonthKey, number>>, lastYear: number | null, approved: boolean, notes?: string];

const SEED: Seed[] = [
  ["figma", "Design tool, 12 seats", "Software", "Mira Okafor", 540, 5940, true, "Two seats more than last year, for the new hires"],
  ["adobe", "Creative suite, 4 seats", "Software", "Ilse Brandt", 330, 3960, true],
  ["testing", "Usability testing platform", "Software", "Kwame Asante", { feb: 6800 }, 6200, true, "Yearly plan, renews in February"],
  ["fonts", "Font licences", "Software", "Ilse Brandt", { mar: 1200, sep: 600 }, 1450, false],
  ["stock", "Stock photography", "Software", "Yuki Moreau", 150, 1800, true],
  ["proto", "Prototyping tool", "Software", "Tomás Ferreira", 96, 0, false, "New: trial ends in January"],
  ["laptops", "Laptop refresh", "Hardware", "Tomás Ferreira", { apr: 6000, oct: 2100 }, 5400, true, "Three in spring, one in autumn"],
  ["screens", "Monitors and peripherals", "Hardware", "Tomás Ferreira", { jan: 1400, jul: 900 }, 2650, true],
  ["devices", "Test phones and tablets", "Hardware", "Kwame Asante", { may: 1800 }, 1200, false],
  ["illustrator", "Contract illustrator", "People", "Yuki Moreau", { mar: 2400, apr: 2400, may: 2400, jun: 2400, jul: 2400, aug: 2400 }, 9600, true, "Six months for the brand refresh"],
  ["audit", "Accessibility audit", "People", "Mira Okafor", { jun: 4500, nov: 4500 }, 4500, true, "Twice this year: before and after the redesign"],
  ["training", "Training and courses", "People", "Mira Okafor", { jan: 600, apr: 600, jul: 600, oct: 600 }, 2900, true],
  ["tickets", "Conference tickets", "People", "Mira Okafor", { may: 1900, oct: 1200 }, 2600, false],
  ["conf-travel", "Conference travel", "Travel", "Mira Okafor", { may: 2600, oct: 1800 }, 3900, false],
  ["research-trips", "Research trips", "Travel", "Kwame Asante", { feb: 900, apr: 900, sep: 900 }, 1800, true, "Field visits to three customer sites"],
  ["offsite", "Team offsite", "Travel", "Yuki Moreau", { jun: 7500 }, 6800, false, "Two days, venue not booked yet"],
  ["incentives", "Participant incentives", "Research", "Kwame Asante", 400, 4400, true],
  ["recruiting", "Recruiting agency", "Research", "Kwame Asante", { feb: 1500, aug: 1500 }, 1500, true],
  ["supplies", "Studio supplies", "Office", "Ilse Brandt", 120, 1580, true],
  ["books", "Books and subscriptions", "Office", "Ilse Brandt", 60, 640, true],
];

export const BUDGET_LINES: BudgetLine[] = SEED.map(([id, item, category, owner, amounts, lastYear, approved, notes = ""]) => ({
  id,
  item,
  category,
  owner,
  ...months(amounts),
  lastYear,
  approved,
  notes,
}));

let made = 0;
/** A blank line, or a copy of one with a new id */
export function newBudgetLine(copyOf?: BudgetLine): BudgetLine {
  made += 1;
  if (copyOf) return { ...copyOf, id: `${copyOf.id}-copy-${made}`, item: `${copyOf.item} (copy)`, lastYear: null };
  return { id: `line-${made}`, item: "", category: null, owner: null, ...months({}), lastYear: null, approved: false, notes: "" };
}

// -------------------------------------------------------------------------------------------------
// Sums

export const lineTotal = (l: BudgetLine) => MONTH_KEYS.reduce((s, m) => s + (l[m] ?? 0), 0);

/** Planned spend per month, all lines together */
export function monthTotals(lines: BudgetLine[]): number[] {
  return MONTH_KEYS.map((m) => lines.reduce((s, l) => s + (l[m] ?? 0), 0));
}

export interface CategorySum {
  category: string;
  planned: number;
  lastYear: number;
  months: number[];
  lines: number;
}

/** Per category, in the fixed category order; lines without one go under "Other" */
export function categoryTotals(lines: BudgetLine[]): CategorySum[] {
  const names = [...CATEGORIES, ...new Set(lines.map((l) => l.category ?? "Other").filter((c) => !(CATEGORIES as readonly string[]).includes(c)))];
  return names
    .map((category) => {
      const ls = lines.filter((l) => (l.category ?? "Other") === category);
      return {
        category,
        planned: ls.reduce((s, l) => s + lineTotal(l), 0),
        lastYear: ls.reduce((s, l) => s + (l.lastYear ?? 0), 0),
        months: monthTotals(ls),
        lines: ls.length,
      };
    })
    .filter((c) => c.lines > 0);
}

const EURO = new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
const PLAIN = new Intl.NumberFormat("en-IE", { maximumFractionDigits: 0 });

export const euro = (n: number) => EURO.format(n);
/** "+€1,200", "−€300", "±€0": a change, with its sign always written */
export const signedEuro = (n: number) => (Math.round(n) === 0 ? "±€0" : `${n > 0 ? "+" : "−"}€${PLAIN.format(Math.abs(n))}`);
/** "+12%", "−4%", or "new" when there was nothing before */
export const percentChange = (now: number, before: number) =>
  before === 0 ? (now === 0 ? "±0%" : "new") : `${now >= before ? "+" : "−"}${Math.abs(Math.round(((now - before) / before) * 100))}%`;
