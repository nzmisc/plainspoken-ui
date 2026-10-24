import { Check, TriangleAlert, X } from "@/registry/plainspoken/lib/icons";
import { Icon } from "@/registry/plainspoken/ui/icon";
import { contrast, parseOklch, type Mode, type Theme, type ThemeOptions } from "@/lib/theme";

type Source = "gray" | "main" | "links";

interface Pair {
  fg: string;
  bg: string;
  label: string;
  /** WCAG AA: 4.5 for text, 3 for the edges of controls and the focus indicator */
  min: 4.5 | 3;
  /** Which choice decides it, for the advice */
  source: Source;
}

/** The pairs that decide whether a theme is readable and usable, in the order a page is read */
const PAIRS: Pair[] = [
  { fg: "foreground", bg: "background", label: "Text on the background", min: 4.5, source: "gray" },
  { fg: "muted-foreground", bg: "background", label: "Muted text on the background", min: 4.5, source: "gray" },
  { fg: "muted-foreground", bg: "muted", label: "Muted text on a muted fill", min: 4.5, source: "gray" },
  { fg: "primary-foreground", bg: "primary", label: "Text on a primary button", min: 4.5, source: "main" },
  { fg: "link", bg: "background", label: "Links", min: 4.5, source: "links" },
  { fg: "link-visited", bg: "background", label: "Visited links", min: 4.5, source: "links" },
  { fg: "input", bg: "background", label: "Edges of inputs", min: 3, source: "gray" },
  { fg: "ring", bg: "background", label: "Focus ring", min: 3, source: "main" },
];

export interface ContrastResult extends Pair {
  ratio: Record<Mode, number>;
}

export function contrastResults(t: Theme): ContrastResult[] {
  const ratio = (p: Pair, m: Mode) => contrast(parseOklch(t[m][p.fg])!, parseOklch(t[m][p.bg])!);
  return PAIRS.map((p) => ({ ...p, ratio: { light: ratio(p, "light"), dark: ratio(p, "dark") } }));
}

/** 4.47 shows as 4.4, not 4.5, so a failing ratio never reads as the number it misses */
const fmt = (r: number) => `${(Math.floor(r * 10) / 10).toFixed(1)}:1`;

function Verdict({ ratio, min }: { ratio: number; min: number }) {
  const pass = ratio >= min;
  return (
    <span className="inline-flex items-center gap-1.5 tabular-nums">
      <span className="min-w-[3.5em] text-right">{fmt(ratio)}</span>
      <span className={pass ? "text-success" : "font-semibold text-destructive"}>
        <Icon icon={pass ? Check : X} className="mr-0.5" />
        {pass ? "Pass" : "Fail"}
      </span>
    </span>
  );
}

/**
 * A short warning by a colour choice, for the pairs it decides that fail: "Focus ring 2.1:1 in
 * light mode (needs 3:1)". Nothing when they all pass.
 */
export function ChoiceWarning({ results, source }: { results: ContrastResult[]; source: "main" | "links" }) {
  const fails = results.flatMap((r) =>
    r.source === source ? (["light", "dark"] as const).filter((m) => r.ratio[m] < r.min).map((m) => `${r.label} ${fmt(r.ratio[m])} in ${m} mode`) : [],
  );
  if (!fails.length) return null;
  return (
    <p className="mt-1 flex gap-1.5 text-[13px]">
      <Icon icon={TriangleAlert} className="mt-[0.2em] text-warning" />
      <span>
        Low contrast: {fails.join("; ")}. <a href="#contrast" className="text-link underline visited:text-link-visited">See contrast</a>
      </span>
    </p>
  );
}

/** What to do about a failing pair, in words */
function advice(r: ContrastResult, mode: Mode, o: ThemeOptions): string {
  const ratio = fmt(r.ratio[mode]);
  const where = mode === "light" ? "In light mode" : "In dark mode";
  const shade = mode === "light" ? "darker" : "lighter";
  const customMain = o.main.id === "custom";
  if (r.fg === "primary-foreground")
    return `${where}, neither white nor black text reads well on the main colour (${ratio}, needs 4.5:1), so primary buttons are hard to read. Pick a ${shade}${customMain ? " or more saturated" : ""} main colour.`;
  if (r.fg === "ring")
    return `${where}, the focus ring is drawn in the main colour and stands out only ${ratio} from the background (needs 3:1), so keyboard users can lose track of where they are. Pick a ${shade} main colour.`;
  if (r.source === "links") {
    const what = r.fg === "link" ? "Links" : "Visited links";
    const fix =
      o.links.id === "custom"
        ? `Pick a ${shade} ${r.fg === "link" ? "link" : "visited"} colour${mode === "dark" ? " (the dark mode shade is made from yours)" : ""}.`
        : o.links.id === "main"
          ? `Pick a ${shade} main colour, or the classic link colours.`
          : "";
    return `${where}, ${what.toLowerCase()} are ${ratio} on the background (needs 4.5:1) and hard to read. ${fix}`.trim();
  }
  return `${where}, ${r.label.toLowerCase()} is ${ratio} (needs ${r.min}:1).`;
}

/**
 * WCAG contrast of the pairs that matter, in both modes, against AA (4.5:1 for text, 3:1 for
 * control edges and the focus ring), with what to do about each failure.
 */
export function ContrastReport({ results, options }: { results: ContrastResult[]; options: ThemeOptions }) {
  const failures = results.flatMap((r) => (["light", "dark"] as const).filter((m) => r.ratio[m] < r.min).map((m) => ({ r, m })));
  return (
    <div className="flex flex-col gap-3">
      <div className="max-w-full overflow-x-auto">
        <table className="border-collapse text-[13px] [&_td]:border [&_td]:border-border [&_td]:px-2 [&_td]:py-0.5 [&_th]:border [&_th]:border-border [&_th]:bg-muted [&_th]:px-2 [&_th]:py-1 [&_th]:text-left [&_th]:font-semibold">
          <thead>
            <tr>
              <th scope="col">Pair</th>
              <th scope="col">Needs</th>
              <th scope="col">Light</th>
              <th scope="col">Dark</th>
            </tr>
          </thead>
          <tbody>
            {results.map((r) => (
              <tr key={r.fg + r.bg}>
                <th scope="row" className="bg-transparent! font-normal!">
                  {r.label}
                  <span className="block font-mono text-[11px] text-muted-foreground">
                    {r.fg} on {r.bg}
                  </span>
                </th>
                <td className="text-right tabular-nums">{r.min}:1</td>
                <td className="whitespace-nowrap">
                  <Verdict ratio={r.ratio.light} min={r.min} />
                </td>
                <td className="whitespace-nowrap">
                  <Verdict ratio={r.ratio.dark} min={r.min} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div aria-live="polite">
        {failures.length === 0 ? (
          <p className="text-[13px] text-muted-foreground">Every pair passes WCAG AA in both modes.</p>
        ) : (
          <ul className="flex flex-col gap-1.5 text-[13px]">
            {failures.map(({ r, m }) => (
              <li key={r.fg + r.bg + m} className="flex gap-2 border-l-2 border-warning pl-2">
                <Icon icon={TriangleAlert} className="mt-[0.2em] text-warning" />
                <span>{advice(r, m, options)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
