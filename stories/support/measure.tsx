import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/** What counts as a control. Checkbox rows and segmented controls are measured whole. */
const SELECTOR = [
  "[data-slot=input]",
  "[data-slot=select]",
  "[data-slot=segmented-control]",
  "[data-slot=chip]",
  "[data-measure]",
  "button",
  "select",
  "input:not([type=checkbox]):not([type=radio]):not([type=hidden]):not([type=range])",
  "label[data-slot=checkbox]",
].join(",");

const BOXES = "[data-slot=input],[data-slot=select],[data-slot=segmented-control],[data-slot=chip],[data-measure]";

const hasBox = (el: Element) => {
  const cs = getComputedStyle(el);
  return parseFloat(cs.borderTopWidth) > 0 && parseFloat(cs.borderBottomWidth) > 0;
};

/** The visible box of a control: the bordered wrapper around a bare <input>, <select> or borderless inner button. */
function boxOf(el: Element, root: Element): Element {
  const box = el.closest(BOXES);
  if (box && root.contains(box)) return box;
  if (!/^(INPUT|SELECT|BUTTON)$/.test(el.tagName) || hasBox(el)) return el;
  let cur = el.parentElement;
  for (let i = 0; i < 2 && cur && cur !== root; i++, cur = cur.parentElement) if (hasBox(cur)) return cur;
  return el;
}

interface Row {
  top: number;
  bottom: number;
  heights: number[];
  edges: number[];
}

const round = (n: number) => Math.round(n * 10) / 10;
const fmt = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1));

function measure(content: HTMLElement): Row[] {
  const origin = content.getBoundingClientRect();
  const boxes = new Set<Element>();
  for (const el of content.querySelectorAll(SELECTOR)) boxes.add(boxOf(el, content));
  const rects = [...boxes]
    .map((b) => b.getBoundingClientRect())
    .filter((r) => r.width > 2 && r.height > 2)
    .map((r) => ({ top: r.top - origin.top, bottom: r.bottom - origin.top, h: r.height, mid: (r.top + r.bottom) / 2 - origin.top }))
    .sort((a, b) => a.mid - b.mid);
  const rows: (typeof rects)[] = [];
  for (const r of rects) {
    const last = rows.at(-1);
    if (last && Math.abs(r.mid - last[0].mid) <= 5) last.push(r);
    else rows.push([r]);
  }
  return rows.map((rs) => {
    const edges: number[] = [];
    for (const y of rs.flatMap((r) => [r.top, r.bottom])) if (!edges.some((e) => Math.abs(e - y) < 0.4)) edges.push(y);
    const heights = [...new Set(rs.map((r) => round(r.h)))].sort((a, b) => b - a);
    return { top: Math.min(...rs.map((r) => r.top)), bottom: Math.max(...rs.map((r) => r.bottom)), heights, edges };
  });
}

/**
 * Measures the controls inside it, as rendered, and groups them into rows (controls whose centres
 * are within 5px). With `guides` it draws each row's top and bottom edges and prints the row's
 * height on the right: one gray number when every control in the row is the same height, a red
 * range when they differ. Under the content it sums up. Use it in stories to prove controls line up.
 */
export function Measure({ children, guides = true }: { children: ReactNode; guides?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const [rows, setRows] = useState<Row[]>([]);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    let last = "";
    const update = () => {
      const next = measure(el);
      const key = JSON.stringify(next);
      if (key !== last) {
        last = key;
        setRows(next);
      }
    };
    update();
    void document.fonts.ready.then(update);
    const ro = new ResizeObserver(update);
    ro.observe(el);
    const mo = new MutationObserver(update);
    mo.observe(el, { subtree: true, childList: true, attributes: true, characterData: true });
    return () => {
      ro.disconnect();
      mo.disconnect();
    };
  }, []);
  const uneven = rows.filter((r) => r.heights.length > 1);
  return (
    <div>
      <div className={cn("relative", guides && "pr-16")}>
        <div ref={ref}>{children}</div>
        {guides &&
          rows.map((r, i) => {
            const bad = r.heights.length > 1;
            return (
              <div key={i} aria-hidden className="pointer-events-none">
                {r.edges.map((y, j) => (
                  <div key={j} className={cn("absolute inset-x-0 border-t border-dashed", bad ? "border-destructive/70" : "border-[#c026d3]/30")} style={{ top: y }} />
                ))}
                <span
                  className={cn("absolute right-0 text-[11px] leading-none tabular-nums", bad ? "font-bold text-destructive" : "text-muted-foreground")}
                  style={{ top: (r.top + r.bottom) / 2 - 5 }}
                >
                  {bad ? `${fmt(r.heights.at(-1)!)}–${fmt(r.heights[0])}` : fmt(r.heights[0])}
                </span>
              </div>
            );
          })}
      </div>
      <p data-measure-summary className={cn("mt-1 text-[12px]", uneven.length ? "text-destructive" : "text-muted-foreground")}>
        {rows.length === 0
          ? "No controls found."
          : uneven.length === 0
            ? `${rows.length} ${rows.length === 1 ? "row" : "rows"} of controls, each row one height.`
            : `${uneven.length} of ${rows.length} rows mix heights: ${uneven.map((r) => `${fmt(r.heights.at(-1)!)}–${fmt(r.heights[0])}px`).join(", ")}.`}
      </p>
    </div>
  );
}
