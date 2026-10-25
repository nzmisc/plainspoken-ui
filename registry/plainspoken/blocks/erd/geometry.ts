// Where things are on an ERD: the table node's fixed metrics (so a column's row can be found
// without measuring it), relation routing between column rows, the crow's foot marks, and the
// frames round each schema. Shared by the diagram and the SVG export.

import { cardinality, keyColumns, tableById, type EndKind, type ErdModel, type ErdPoint, type ErdRelation, type ErdTable } from "@/registry/plainspoken/blocks/erd/model";

/** The node's border, header (a 3px colour strip, a 28px title row and its 1px rule) and rows, px */
export const NODE_BORDER = 1;
export const HEADER_H = 32;
export const ROW_H = 22;
/** Room at each end of a line for its crow's foot */
export const STUB = 26;

export interface Size {
  width: number;
  height: number;
}

export interface Box extends ErdPoint, Size {}

/** The columns a node shows: all, or only the keys when collapsed */
export function visibleColumns(m: ErdModel, t: ErdTable, collapsed: boolean) {
  return collapsed ? keyColumns(m, t) : t.columns;
}

/** The rows a node draws: its columns, plus "n more" when collapsed and some are hidden */
export function rowCount(m: ErdModel, t: ErdTable, collapsed: boolean) {
  const shown = visibleColumns(m, t, collapsed).length;
  return shown + (shown < t.columns.length ? 1 : 0);
}

/**
 * A node's size before it is measured: enough for the auto-layout and the first paint, a little
 * generous on width. Geist Mono at 12px is about 7.2px a character.
 */
export function estimateSize(m: ErdModel, t: ErdTable, o: { collapsed?: boolean; types?: boolean } = {}): Size {
  const cols = visibleColumns(m, t, !!o.collapsed);
  const types = o.types ?? true;
  const row = Math.max(0, ...cols.map((c) => 30 + c.name.length * 7.3 + (types ? 18 + c.type.length * 7.3 : 0) + 44));
  const head = 16 + t.name.length * 8 + t.schema.length * 6.5 + 44;
  return { width: Math.ceil(Math.max(180, row, head)), height: NODE_BORDER * 2 + HEADER_H + rowCount(m, t, !!o.collapsed) * ROW_H };
}

/** The y of a column's row centre, from the top of the node; the header's centre when the column isn't shown */
export function rowCentre(m: ErdModel, t: ErdTable, columns: string[], collapsed: boolean) {
  const cols = visibleColumns(m, t, collapsed);
  const i = cols.findIndex((c) => columns.includes(c.name));
  return i < 0 ? NODE_BORDER + HEADER_H / 2 : NODE_BORDER + HEADER_H + i * ROW_H + ROW_H / 2;
}

export type Side = "left" | "right";

export interface Route {
  /** SVG path data */
  d: string;
  /** The ends: where they touch the tables, and which way they leave them */
  child: ErdPoint & { side: Side };
  parent: ErdPoint & { side: Side };
  /** A point half way along, for a label */
  mid: ErdPoint;
}

const dirOf = (s: Side) => (s === "left" ? -1 : 1);

/** How many boxes a path of horizontal and vertical segments runs through */
function crossings(pts: ErdPoint[], boxes: Box[]) {
  let n = 0;
  for (const b of boxes) {
    for (let i = 1; i < pts.length; i++) {
      const [a, z] = [pts[i - 1], pts[i]];
      const x0 = Math.min(a.x, z.x);
      const x1 = Math.max(a.x, z.x);
      const y0 = Math.min(a.y, z.y);
      const y1 = Math.max(a.y, z.y);
      if (x0 < b.x + b.width && x1 > b.x && y0 < b.y + b.height && y1 > b.y) {
        n++;
        break;
      }
    }
  }
  return n;
}

/** A polyline with its corners rounded off */
function rounded(points: ErdPoint[], radius: number) {
  let d = `M${points[0].x},${points[0].y}`;
  for (let i = 1; i < points.length - 1; i++) {
    const [a, b, c] = [points[i - 1], points[i], points[i + 1]];
    const r = Math.min(radius, Math.hypot(b.x - a.x, b.y - a.y) / 2, Math.hypot(c.x - b.x, c.y - b.y) / 2);
    if (r < 0.5) {
      d += ` L${b.x},${b.y}`;
      continue;
    }
    const p = { x: b.x - (Math.sign(b.x - a.x) * r || 0), y: b.y - (Math.sign(b.y - a.y) * r || 0) };
    const q = { x: b.x + (Math.sign(c.x - b.x) * r || 0), y: b.y + (Math.sign(c.y - b.y) * r || 0) };
    d += ` L${p.x},${p.y} Q${b.x},${b.y} ${q.x},${q.y}`;
  }
  const last = points[points.length - 1];
  return d + ` L${last.x},${last.y}`;
}

/**
 * The line from a foreign key's row (in the child table) to the referenced key's row (in the
 * parent): out of facing sides when the tables stand apart, round the outside of both when they
 * overlap side to side, and in a loop for a table that references itself. "orthogonal" draws
 * right angles with rounded corners, "curved" a smooth S. `lane` shifts the middle a few pixels,
 * so lines that run side by side don't lie on top of each other.
 */
export function route(
  child: Box,
  childY: number,
  parent: Box,
  parentY: number,
  style: "orthogonal" | "curved",
  lane = 0,
  self = false,
  obstacles: Box[] = [],
): Route {
  const cy = child.y + childY;
  const py = parent.y + parentY;
  let cs: Side;
  let ps: Side;
  if (self) [cs, ps] = ["right", "right"];
  else if (child.x >= parent.x + parent.width + STUB * 2) [cs, ps] = ["left", "right"];
  else if (parent.x >= child.x + child.width + STUB * 2) [cs, ps] = ["right", "left"];
  else {
    // Overlapping side to side: go round whichever side is the shorter way
    const right = Math.abs(child.x + child.width - (parent.x + parent.width));
    const left = Math.abs(child.x - parent.x);
    cs = ps = left < right ? "left" : "right";
  }
  const c = { x: cs === "left" ? child.x : child.x + child.width, y: cy, side: cs };
  const p = { x: ps === "left" ? parent.x : parent.x + parent.width, y: py, side: ps };
  const dc = dirOf(cs);
  const dp = dirOf(ps);

  if (style === "curved") {
    const k = cs === ps ? 60 + Math.abs(cy - py) * 0.2 + (self ? 20 : 0) : Math.max(50, Math.abs(c.x - p.x) / 2);
    const d = `M${c.x},${c.y} C${c.x + dc * k},${c.y + lane} ${p.x + dp * k},${p.y + lane} ${p.x},${p.y}`;
    // The bezier's own midpoint
    const mid = { x: (c.x + 3 * (c.x + dc * k) + 3 * (p.x + dp * k) + p.x) / 8, y: (c.y + 3 * (c.y + lane) + 3 * (p.y + lane) + p.y) / 8 };
    return { d, child: c, parent: p, mid };
  }

  let pts: ErdPoint[];
  if (cs !== ps) {
    // Z: out, across in the middle of the gap, in
    const lo = Math.min(c.x, p.x) + STUB;
    const hi = Math.max(c.x, p.x) - STUB;
    const fit = (x: number) => Math.max(lo, Math.min(hi, x));
    // The middle of the gap, or just beside either table: whichever runs through fewest other tables
    const options = [fit((c.x + p.x) / 2 + lane), fit(c.x + dc * (STUB + 10) + lane), fit(p.x + dp * (STUB + 10) + lane)];
    const cost = (mx: number) => crossings([c, { x: mx, y: c.y }, { x: mx, y: p.y }, p], obstacles);
    const mx = options.reduce((best, x) => (cost(x) < cost(best) ? x : best), options[0]);
    pts = [c, { x: mx, y: c.y }, { x: mx, y: p.y }, p];
  } else {
    // C: out past whichever table sticks out further, along, and back in
    const lx = cs === "right" ? Math.max(c.x, p.x) + STUB + 8 + Math.abs(lane) : Math.min(c.x, p.x) - STUB - 8 - Math.abs(lane);
    pts = [c, { x: lx, y: c.y }, { x: lx, y: p.y }, p];
  }
  const mid = { x: (pts[1].x + pts[2].x) / 2, y: (pts[1].y + pts[2].y) / 2 };
  return { d: rounded(pts, 8), child: c, parent: p, mid };
}

/** What the 1 / N notation writes at an end */
export const END_LABEL: Record<EndKind, string> = { one: "1", "zero-or-one": "0..1", many: "1..N", "zero-or-many": "N" };

/**
 * The crow's foot mark for one end, drawn pointing along +x from the table edge at 0,0; place it
 * with `translate(x, y) scale(±1, 1)`. Bars mean one, a circle zero (optional), the three-toed
 * foot many.
 */
export function endMark(kind: EndKind): { lines: string; circle?: ErdPoint } {
  const foot = "M12,0 L0,-6 M12,0 L0,0 M12,0 L0,6";
  switch (kind) {
    case "one":
      return { lines: "M8,-6 V6 M13,-6 V6" };
    case "zero-or-one":
      return { lines: "M8,-6 V6", circle: { x: 17, y: 0 } };
    case "many":
      return { lines: `${foot} M15,-6 V6` };
    case "zero-or-many":
      return { lines: foot, circle: { x: 18, y: 0 } };
  }
}

export interface RoutedRelation {
  relation: ErdRelation;
  route: Route;
  ends: { parent: EndKind; child: EndKind };
}

/** Every relation whose tables have a place, routed */
export function routeAll(
  m: ErdModel,
  boxes: Record<string, Box>,
  collapsed: ReadonlySet<string>,
  style: "orthogonal" | "curved",
): RoutedRelation[] {
  const out: RoutedRelation[] = [];
  m.relations.forEach((r, i) => {
    const ct = tableById(m, r.from.table);
    const pt = tableById(m, r.to.table);
    const cb = boxes[r.from.table];
    const pb = boxes[r.to.table];
    if (!ct || !pt || !cb || !pb) return;
    const route_ = route(
      cb,
      rowCentre(m, ct, r.from.columns, collapsed.has(ct.id)),
      pb,
      rowCentre(m, pt, r.to.columns, collapsed.has(pt.id)),
      style,
      ((i % 5) - 2) * 6,
      ct.id === pt.id,
      Object.entries(boxes)
        .filter(([id]) => id !== ct.id && id !== pt.id)
        .map(([, b]) => b),
    );
    out.push({ relation: r, route: route_, ends: cardinality(m, r) });
  });
  return out;
}

/** The frame round each schema's tables: their bounds, padded, with room for the name on top */
export function schemaFrames(m: ErdModel, boxes: Record<string, Box>, pad = 24, label = 26): { schema: string; color: string; box: Box }[] {
  return m.schemas.flatMap((s) => {
    const bs = m.tables.filter((t) => t.schema === s.name && boxes[t.id]).map((t) => boxes[t.id]);
    if (!bs.length) return [];
    const x0 = Math.min(...bs.map((b) => b.x)) - pad;
    const y0 = Math.min(...bs.map((b) => b.y)) - pad - label;
    const x1 = Math.max(...bs.map((b) => b.x + b.width)) + pad;
    const y1 = Math.max(...bs.map((b) => b.y + b.height)) + pad;
    return [{ schema: s.name, color: s.color, box: { x: x0, y: y0, width: x1 - x0, height: y1 - y0 } }];
  });
}
