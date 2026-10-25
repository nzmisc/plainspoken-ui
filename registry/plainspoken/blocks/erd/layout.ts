// Auto-layout for an ERD, without a graph library: each schema is laid out in layers by its
// foreign keys (referenced tables on the left, the tables that point at them to the right), and the
// schema blocks are then arranged in rows to suit a wide screen.

import type { ErdModel, ErdPoint } from "@/registry/plainspoken/blocks/erd/model";
import type { Size } from "@/registry/plainspoken/blocks/erd/geometry";

export interface LayoutOptions {
  /** Between layers, px. Default 80, room for the lines and their marks. */
  gapX?: number;
  /** Between tables in a layer. Default 28. */
  gapY?: number;
  /** Between schema frames. Default 72. */
  groupGap?: number;
  /** The shape to aim for, width over height. Default 1.6. */
  aspect?: number;
}

/** Room a schema's frame takes round its tables (see schemaFrames) */
const FRAME_PAD = 24;
const FRAME_LABEL = 26;

interface Block {
  positions: Record<string, ErdPoint>;
  width: number;
  height: number;
}

function layoutGroup(m: ErdModel, ids: string[], sizeOf: (id: string) => Size, gapX: number, gapY: number): Block {
  const inGroup = new Set(ids);
  const parents = new Map<string, Set<string>>(ids.map((id) => [id, new Set()]));
  const children = new Map<string, Set<string>>(ids.map((id) => [id, new Set()]));
  for (const r of m.relations) {
    const c = r.from.table;
    const p = r.to.table;
    if (c === p || !inGroup.has(c) || !inGroup.has(p)) continue;
    parents.get(c)!.add(p);
    children.get(p)!.add(c);
  }

  // Break cycles: an edge back to a table still on the depth-first path is ignored
  const state = new Map<string, 1 | 2>();
  const back = new Set<string>();
  const visit = (v: string) => {
    state.set(v, 1);
    for (const c of children.get(v)!) {
      if (state.get(c) === 1) back.add(`${v}>${c}`);
      else if (!state.has(c)) visit(c);
    }
    state.set(v, 2);
  };
  for (const id of ids) if (!state.has(id)) visit(id);
  const ps = (v: string) => [...parents.get(v)!].filter((p) => !back.has(`${p}>${v}`));
  const cs = (v: string) => [...children.get(v)!].filter((c) => !back.has(`${v}>${c}`));

  // Longest path from the sources
  const layer = new Map<string, number>();
  const depth = (v: string): number => {
    if (layer.has(v)) return layer.get(v)!;
    layer.set(v, 0);
    const d = Math.max(0, ...ps(v).map((p) => depth(p) + 1));
    layer.set(v, d);
    return d;
  };
  ids.forEach(depth);
  // A source sits just before its nearest child, not at the far left
  for (const v of ids) {
    const kids = cs(v);
    if (!ps(v).length && kids.length) layer.set(v, Math.max(0, Math.min(...kids.map((c) => layer.get(c)!)) - 1));
  }

  const count = Math.max(0, ...layer.values()) + 1;
  const layers: string[][] = Array.from({ length: count }, () => []);
  for (const v of ids) layers[layer.get(v)!].push(v);

  // Order within layers: a few sweeps of the barycentre heuristic
  const pos = new Map<string, number>();
  const index = () => layers.forEach((l) => l.forEach((v, i) => pos.set(v, i)));
  index();
  const bary = (v: string, by: (v: string) => string[]) => {
    const ns = by(v);
    return ns.length ? ns.reduce((s, n) => s + pos.get(n)!, 0) / ns.length : pos.get(v)!;
  };
  for (let sweep = 0; sweep < 4; sweep++) {
    for (let l = 1; l < count; l++) layers[l].sort((a, b) => bary(a, ps) - bary(b, ps));
    index();
    for (let l = count - 2; l >= 0; l--) layers[l].sort((a, b) => bary(a, cs) - bary(b, cs));
    index();
  }

  // Columns left to right; in each, tables go as near their parents' height as the ones above allow
  const positions: Record<string, ErdPoint> = {};
  let x = 0;
  for (const l of layers) {
    const w = Math.max(0, ...l.map((v) => sizeOf(v).width));
    let bottom = -gapY;
    for (const v of l) {
      const pp = ps(v).filter((p) => positions[p]);
      const want = pp.length ? pp.reduce((s, p) => s + positions[p].y, 0) / pp.length : 0;
      const y = Math.max(bottom + gapY, want);
      positions[v] = { x, y };
      bottom = y + sizeOf(v).height;
    }
    x += w + gapX;
  }
  const width = Math.max(0, x - gapX);
  const height = Math.max(0, ...ids.map((v) => positions[v].y + sizeOf(v).height));
  return { positions, width, height };
}

/** Split blocks into rows, in order: every split for a few, greedily for many; the shape nearest `aspect` wins. */
function arrange(blocks: { w: number; h: number }[], gap: number, aspect: number): number[][] {
  const n = blocks.length;
  const rowsFor = (breaks: number[]) => {
    const rows: number[][] = [[]];
    blocks.forEach((_, i) => {
      if (i > 0 && breaks.includes(i)) rows.push([]);
      rows[rows.length - 1].push(i);
    });
    return rows;
  };
  const score = (rows: number[][]) => {
    const w = Math.max(...rows.map((r) => r.reduce((s, i) => s + blocks[i].w, 0) + gap * (r.length - 1)));
    const h = rows.reduce((s, r) => s + Math.max(...r.map((i) => blocks[i].h)), 0) + gap * (rows.length - 1);
    return Math.max(w / aspect, h);
  };
  if (n <= 8) {
    let best: number[][] = [blocks.map((_, i) => i)];
    let bestScore = score(best);
    for (let mask = 1; mask < 1 << (n - 1); mask++) {
      const breaks = Array.from({ length: n - 1 }, (_, i) => i + 1).filter((_, i) => mask & (1 << i));
      const rows = rowsFor(breaks);
      const s = score(rows);
      if (s < bestScore) [best, bestScore] = [rows, s];
    }
    return best;
  }
  const area = blocks.reduce((s, b) => s + b.w * b.h, 0);
  const target = Math.max(...blocks.map((b) => b.w), Math.sqrt(area * aspect) * 1.2);
  const rows: number[][] = [[]];
  let w = 0;
  blocks.forEach((b, i) => {
    if (rows[rows.length - 1].length && w + gap + b.w > target) {
      rows.push([]);
      w = 0;
    }
    rows[rows.length - 1].push(i);
    w += (w ? gap : 0) + b.w;
  });
  return rows;
}

/**
 * Positions for every table: schemas as blocks (in the model's order), each laid out in layers by
 * its relations, the blocks in rows. `sizeOf` gives each table's size, measured or estimated.
 */
export function autoLayout(m: ErdModel, sizeOf: (id: string) => Size, o: LayoutOptions = {}): Record<string, ErdPoint> {
  const { gapX = 80, gapY = 28, groupGap = 72, aspect = 1.6 } = o;
  const names = [...new Set([...m.schemas.map((s) => s.name), ...m.tables.map((t) => t.schema)])];
  const groups = names
    .map((name) => m.tables.filter((t) => t.schema === name).map((t) => t.id))
    .filter((ids) => ids.length)
    .map((ids) => layoutGroup(m, ids, sizeOf, gapX, gapY));
  // Each block with its frame round it
  const outer = groups.map((g) => ({ w: g.width + FRAME_PAD * 2, h: g.height + FRAME_PAD * 2 + FRAME_LABEL }));
  const rows = arrange(outer, groupGap, aspect);
  const out: Record<string, ErdPoint> = {};
  let y = 0;
  for (const row of rows) {
    let x = 0;
    for (const i of row) {
      for (const [id, p] of Object.entries(groups[i].positions)) out[id] = { x: Math.round(x + FRAME_PAD + p.x), y: Math.round(y + FRAME_PAD + FRAME_LABEL + p.y) };
      x += outer[i].w + groupGap;
    }
    y += Math.max(...row.map((i) => outer[i].h)) + groupGap;
  }
  return out;
}
