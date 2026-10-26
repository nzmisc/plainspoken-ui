// Where things are on an ERD: the table node's fixed metrics (so a column's row can be found
// without measuring it), relation routing between column rows, the crow's foot marks, and the
// frames round each schema. Shared by the diagram and the SVG export.

import { cardinality, keyColumns, tableById, type EndKind, type ErdModel, type ErdPoint, type ErdRelation, type ErdTable } from "@/registry/plainspoken/blocks/erd/model";

/** The node's border, header (a 3px colour strip, a 28px title row and its 1px rule) and rows, px */
export const NODE_BORDER = 1;
export const HEADER_H = 32;
export const ROW_H = 22;
/** Room at each end of a line for its crow's foot: no bend or turn comes closer to a table than this */
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
  /**
   * SVG path data, from table edge to table edge: straight out of each table at right angles for
   * as long as its end mark (`reach`), and bending only past that, so the mark sits on a straight
   * stub and the curve or the corners start at the mark's outer tip
   */
  d: string;
  /** The ends: where they touch the tables, and which way they leave them */
  child: ErdPoint & { side: Side };
  parent: ErdPoint & { side: Side };
  /** A point half way along, for a label */
  mid: ErdPoint;
}

/** How long the straight stub at each end is: the reach of the mark drawn there (`endMark(kind).reach`), 0 for none */
export interface RouteReach {
  child?: number;
  parent?: number;
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

/** A polyline with its corners rounded off; points on a straight run are kept as plain line ends */
function rounded(all: ErdPoint[], radius: number) {
  const points = all.filter((q, i) => i === 0 || q.x !== all[i - 1].x || q.y !== all[i - 1].y);
  let d = `M${points[0].x},${points[0].y}`;
  for (let i = 1; i < points.length - 1; i++) {
    const [a, b, c] = [points[i - 1], points[i], points[i + 1]];
    if ((a.x === b.x && b.x === c.x) || (a.y === b.y && b.y === c.y)) {
      d += ` L${b.x},${b.y}`;
      continue;
    }
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
 * so lines that run side by side don't lie on top of each other. `reach` keeps each end straight
 * for the length of its end mark, so the line bends only past the mark's tip.
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
  reach: RouteReach = {},
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
  // The tips of the end marks: the straight stubs end here, and the bends start here
  const ct = { x: c.x + dc * (reach.child ?? 0), y: c.y };
  const pt = { x: p.x + dp * (reach.parent ?? 0), y: p.y };

  if (style === "curved") {
    // Both handles stay level with the ends, so the curve leaves each tip in line with its stub;
    // the lane lengthens or shortens them instead, which still parts lines that share their ends
    const k = (cs === ps ? 60 + Math.abs(cy - py) * 0.2 + (self ? 20 : 0) : Math.max(50, Math.abs(ct.x - pt.x) / 2)) + lane;
    const [h1, h2] = [{ x: ct.x + dc * k, y: ct.y }, { x: pt.x + dp * k, y: pt.y }];
    const d = `M${c.x},${c.y} L${ct.x},${ct.y} C${h1.x},${h1.y} ${h2.x},${h2.y} ${pt.x},${pt.y} L${p.x},${p.y}`;
    // The bezier's own midpoint
    const mid = { x: (ct.x + 3 * h1.x + 3 * h2.x + pt.x) / 8, y: (ct.y + 3 * h1.y + 3 * h2.y + pt.y) / 8 };
    return { d, child: c, parent: p, mid };
  }

  let pts: ErdPoint[];
  if (cs !== ps) {
    // Z: out, across in the middle of the gap, in; never turning before a mark's tip
    const [l, r] = c.x < p.x ? [ct, pt] : [pt, ct];
    const lo = Math.min(c.x, p.x) + STUB;
    const hi = Math.max(c.x, p.x) - STUB;
    const fit = (x: number) => Math.max(Math.max(lo, l.x), Math.min(Math.min(hi, r.x), x));
    // The middle of the gap, or just beside either table: whichever runs through fewest other tables
    const options = [fit((c.x + p.x) / 2 + lane), fit(c.x + dc * (STUB + 10) + lane), fit(p.x + dp * (STUB + 10) + lane)];
    const cost = (mx: number) => crossings([c, { x: mx, y: c.y }, { x: mx, y: p.y }, p], obstacles);
    const mx = options.reduce((best, x) => (cost(x) < cost(best) ? x : best), options[0]);
    pts = [c, ct, { x: mx, y: c.y }, { x: mx, y: p.y }, pt, p];
  } else {
    // C: out past whichever table (or mark) sticks out further, along, and back in
    const out = (xs: number[]) => (cs === "right" ? Math.max(...xs) : Math.min(...xs));
    const lx = out([out([c.x, p.x]) + dc * (STUB + 8), out([ct.x, pt.x]) + dc * 8]) + dc * Math.abs(lane);
    pts = [c, ct, { x: lx, y: c.y }, { x: lx, y: p.y }, pt, p];
  }
  const mid = { x: (pts[2].x + pts[3].x) / 2, y: (pts[2].y + pts[3].y) / 2 };
  return { d: rounded(pts, 8), child: c, parent: p, mid };
}

/** What the 1 / N notation writes at an end */
export const END_LABEL: Record<EndKind, string> = { one: "1", "zero-or-one": "0..1", many: "1..N", "zero-or-many": "N" };

/** The radius of the circle that means zero (optional) */
export const MARK_R = 3.5;

/**
 * The crow's foot mark for one end, drawn pointing along +x from the table edge at 0,0; place it
 * with `translate(x, y) scale(±1, 1)`. Bars mean one, a circle zero (optional), the three-toed
 * foot many. `reach` is how far out its outer tip is (the far bar, or the far side of the
 * circle): the line runs straight that far, through the mark, before it bends.
 */
export function endMark(kind: EndKind): { lines: string; circle?: ErdPoint; reach: number } {
  const foot = "M12,0 L0,-6 M12,0 L0,0 M12,0 L0,6";
  switch (kind) {
    case "one":
      return { lines: "M8,-6 V6 M13,-6 V6", reach: 13 };
    case "zero-or-one":
      return { lines: "M8,-6 V6", circle: { x: 17, y: 0 }, reach: 17 + MARK_R };
    case "many":
      return { lines: `${foot} M15,-6 V6`, reach: 15 };
    case "zero-or-many":
      return { lines: foot, circle: { x: 18, y: 0 }, reach: 18 + MARK_R };
  }
}

export interface RoutedRelation {
  relation: ErdRelation;
  route: Route;
  ends: { parent: EndKind; child: EndKind };
}

/**
 * Every relation whose tables have a place, routed. With crow's foot marks (the default) each end
 * runs straight for its mark's reach; where several ends meet at one port they all run as far as
 * the longest mark there, so no line bends inside another's mark. With 1 / N labels the lines bend
 * right from the tables.
 */
export function routeAll(
  m: ErdModel,
  boxes: Record<string, Box>,
  collapsed: ReadonlySet<string>,
  style: "orthogonal" | "curved",
  notation: "crow" | "labels" = "crow",
): RoutedRelation[] {
  const jobs = m.relations.flatMap((r, i) => {
    const ct = tableById(m, r.from.table);
    const pt = tableById(m, r.to.table);
    const cb = boxes[r.from.table];
    const pb = boxes[r.to.table];
    if (!ct || !pt || !cb || !pb) return [];
    const ends = cardinality(m, r);
    const reach: RouteReach =
      notation === "crow" ? { child: endMark(ends.child).reach, parent: endMark(ends.parent).reach } : {};
    const run = (rc: RouteReach) =>
      route(
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
        rc,
      );
    return [{ relation: r, ends, reach, run, route: run(reach) }];
  });
  // The longest reach at each port (a point on a table's edge, facing one way)
  const port = (q: Route["child"]) => `${q.x},${q.y},${q.side}`;
  const longest = new Map<string, number>();
  const note = (q: Route["child"], n = 0) => longest.set(port(q), Math.max(longest.get(port(q)) ?? 0, n));
  for (const j of jobs) {
    note(j.route.child, j.reach.child);
    note(j.route.parent, j.reach.parent);
  }
  return jobs.map(({ relation, ends, reach, run, route: first }) => {
    const shared = { child: longest.get(port(first.child)), parent: longest.get(port(first.parent)) };
    const same = shared.child === (reach.child ?? 0) && shared.parent === (reach.parent ?? 0);
    return { relation, ends, route: same ? first : run(shared) };
  });
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
