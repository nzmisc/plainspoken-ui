// Getting a diagram out of the browser: as a standalone SVG drawn from the model (not a copy of
// the page, so it opens anywhere), as a PNG rendered from that SVG, and as JSON. Colours are read
// from the page's theme tokens and written as plain hex, which every SVG viewer understands.

import { Key, Link, type Glyph } from "@/registry/plainspoken/lib/icons";
import { END_LABEL, HEADER_H, MARK_R, NODE_BORDER, ROW_H, endMark, routeAll, schemaFrames, visibleColumns, type Box } from "@/registry/plainspoken/blocks/erd/geometry";
import { columnFlags, type ErdDisplay, type ErdDocument, type ErdModel } from "@/registry/plainspoken/blocks/erd/model";

/** The colours an exported diagram uses, as hex */
export interface ErdPalette {
  background: string;
  foreground: string;
  muted: string;
  mutedForeground: string;
  border: string;
  warning: string;
  /** By schema name */
  schemas: Record<string, string>;
}

/**
 * Turn CSS colours (tokens such as var(--chart-1), oklch()) into hex, by painting each on a 1px
 * canvas and reading it back: what the browser shows is what the file gets.
 */
export function resolvePalette(model: ErdModel, el: Element = document.documentElement): ErdPalette {
  const ctx = document.createElement("canvas").getContext("2d", { willReadFrequently: true });
  const probe = document.createElement("span");
  el.appendChild(probe);
  const hex = (css: string, fallback: string) => {
    probe.style.color = fallback;
    probe.style.color = css;
    const computed = getComputedStyle(probe).color;
    if (!ctx) return fallback;
    ctx.clearRect(0, 0, 1, 1);
    ctx.fillStyle = fallback;
    ctx.fillStyle = computed;
    ctx.fillRect(0, 0, 1, 1);
    const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
    return `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
  };
  const p: ErdPalette = {
    background: hex("var(--color-background)", "#ffffff"),
    foreground: hex("var(--color-foreground)", "#000000"),
    muted: hex("var(--color-muted)", "#f2f2f2"),
    mutedForeground: hex("var(--color-muted-foreground)", "#666666"),
    border: hex("var(--color-border)", "#c4c4c4"),
    warning: hex("var(--color-warning)", "#9a6700"),
    schemas: Object.fromEntries(model.schemas.map((s) => [s.name, hex(s.color, "#888888")])),
  };
  probe.remove();
  return p;
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const SANS = "Geist, ui-sans-serif, system-ui, sans-serif";
const MONO = "'Geist Mono', ui-monospace, SFMono-Regular, Menlo, monospace";

/** A glyph from lib/icons as SVG, 12px square at x, y */
function glyph(g: Glyph, x: number, y: number, color: string) {
  const shapes = g.nodes.map(([tag, attrs]) => `<${tag} ${Object.entries(attrs).map(([k, v]) => `${k}="${esc(v)}"`).join(" ")}/>`).join("");
  return `<g transform="translate(${x},${y}) scale(0.5)" fill="none" stroke="${color}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">${shapes}</g>`;
}

export interface SvgOptions {
  display: ErdDisplay;
  collapsed?: ReadonlySet<string>;
  palette: ErdPalette;
}

/**
 * The diagram as an SVG document: frames, lines with their marks or labels, and every table with
 * its rows, at the positions and sizes given (sizes as measured on screen, so it matches).
 */
export function diagramSvg(model: ErdModel, boxes: Record<string, Box>, o: SvgOptions): { svg: string; width: number; height: number } {
  const { display, palette: c } = o;
  const collapsed = o.collapsed ?? new Set<string>();
  const parts: string[] = [];
  const frames = display.frames ? schemaFrames(model, boxes) : [];
  for (const f of frames) {
    const col = c.schemas[f.schema] ?? c.border;
    const comment = model.schemas.find((s) => s.name === f.schema)?.comment;
    parts.push(
      `<rect x="${f.box.x + 0.5}" y="${f.box.y + 0.5}" width="${f.box.width - 1}" height="${f.box.height - 1}" fill="${col}" fill-opacity="0.05" stroke="${col}" stroke-opacity="0.45"/>`,
      `<rect x="${f.box.x + 8}" y="${f.box.y + 8}" width="10" height="10" fill="${col}"/>`,
      `<text x="${f.box.x + 24}" y="${f.box.y + 18}" font-family="${SANS}" font-size="14" font-weight="700" fill="${c.foreground}">${esc(f.schema)}${comment ? `<tspan dx="8" font-size="12" font-weight="400" fill="${c.mutedForeground}">${esc(comment)}</tspan>` : ""}</text>`,
    );
  }
  for (const { route, ends } of routeAll(model, boxes, collapsed, display.lines, display.notation)) {
    parts.push(`<path d="${route.d}" fill="none" stroke="${c.mutedForeground}" stroke-width="1.25"/>`);
    for (const [kind, end] of [
      [ends.parent, route.parent],
      [ends.child, route.child],
    ] as const) {
      if (display.notation === "crow") {
        const m = endMark(kind);
        parts.push(
          `<g transform="translate(${end.x},${end.y}) scale(${end.side === "left" ? -1 : 1},1)" fill="none" stroke="${c.mutedForeground}" stroke-width="1.25" stroke-linecap="round"><path d="${m.lines}"/>${m.circle ? `<circle cx="${m.circle.x}" cy="0" r="${MARK_R}" fill="${c.background}"/>` : ""}</g>`,
        );
      } else {
        const x = end.x + (end.side === "left" ? -6 : 6);
        parts.push(
          `<text x="${x}" y="${end.y - 5}" text-anchor="${end.side === "left" ? "end" : "start"}" font-family="${SANS}" font-size="11" font-weight="600" fill="${c.foreground}" stroke="${c.background}" stroke-width="3" paint-order="stroke">${END_LABEL[kind]}</text>`,
        );
      }
    }
  }
  for (const t of model.tables) {
    const b = boxes[t.id];
    if (!b) continue;
    const col = c.schemas[t.schema] ?? c.border;
    const x = b.x;
    const y = b.y;
    const w = b.width;
    parts.push(
      `<g>`,
      `<rect x="${x + 0.5}" y="${y + 0.5}" width="${w - 1}" height="${b.height - 1}" fill="${c.background}" stroke="${c.border}"/>`,
      `<rect x="${x + 1}" y="${y + 1}" width="${w - 2}" height="${HEADER_H - 1}" fill="${c.muted}"/>`,
      `<rect x="${x + 1}" y="${y + 1}" width="${w - 2}" height="3" fill="${col}"/>`,
      `<line x1="${x + 1}" x2="${x + w - 1}" y1="${y + HEADER_H + 0.5}" y2="${y + HEADER_H + 0.5}" stroke="${c.border}"/>`,
      `<text x="${x + 9}" y="${y + 23}" font-family="${SANS}" fill="${c.foreground}"><tspan font-size="11" fill="${c.mutedForeground}">${esc(t.schema)}</tspan><tspan dx="6" font-size="13" font-weight="700">${esc(t.name)}</tspan></text>`,
    );
    const cols = visibleColumns(model, t, collapsed.has(t.id));
    cols.forEach((col, i) => {
      const top = y + NODE_BORDER + HEADER_H + i * ROW_H;
      const base = top + 15;
      const f = columnFlags(model, t, col);
      if (f.pk) parts.push(glyph(Key, x + (f.fk ? 6 : 19), top + 5, c.warning));
      if (f.fk) parts.push(glyph(Link, x + 19, top + 5, c.mutedForeground));
      parts.push(`<text x="${x + 38}" y="${base}" font-family="${MONO}" font-size="12"${f.pk ? ' font-weight="700"' : ""} fill="${c.foreground}">${esc(col.name)}</text>`);
      // From the right edge: the marks, then the type
      const marks: string[] = [];
      if (f.unique && !f.pk) marks.push("UQ");
      if (col.identity) marks.push("ID");
      else if (col.default != null) marks.push("DEF");
      if (t.indexes.some((ix) => ix.columns.includes(col.name) && !(ix.unique && ix.columns.length === 1))) marks.push("IDX");
      if (display.nullability && !f.notNull) marks.push("NULL");
      let right = x + w - 9;
      for (const m of marks.reverse()) {
        const mw = m.length * 6 + 6;
        parts.push(
          `<rect x="${right - mw + 0.5}" y="${top + 4.5}" width="${mw}" height="13" fill="none" stroke="${c.border}"${m === "NULL" ? ' stroke-dasharray="2 1.5"' : ""}/>`,
          `<text x="${right - mw / 2 + 0.5}" y="${top + 14.5}" text-anchor="middle" font-family="${SANS}" font-size="9.5" font-weight="500" fill="${c.mutedForeground}">${m}</text>`,
        );
        right -= mw + 2;
      }
      if (display.types) parts.push(`<text x="${right - 4}" y="${base}" text-anchor="end" font-family="${MONO}" font-size="12" fill="${c.mutedForeground}">${esc(col.type)}</text>`);
    });
    const hidden = t.columns.length - cols.length;
    if (hidden > 0)
      parts.push(
        `<text x="${x + 38}" y="${y + NODE_BORDER + HEADER_H + cols.length * ROW_H + 15}" font-family="${SANS}" font-size="11" font-style="italic" fill="${c.mutedForeground}">${hidden} more ${hidden === 1 ? "column" : "columns"}</text>`,
      );
    parts.push(`</g>`);
  }
  const all = [...Object.values(boxes), ...frames.map((f) => f.box)];
  const pad = 32;
  const x0 = Math.min(0, ...all.map((b) => b.x)) - pad;
  const y0 = Math.min(0, ...all.map((b) => b.y)) - pad;
  const x1 = Math.max(0, ...all.map((b) => b.x + b.width)) + pad;
  const y1 = Math.max(0, ...all.map((b) => b.y + b.height)) + pad;
  const width = Math.ceil(x1 - x0);
  const height = Math.ceil(y1 - y0);
  const svg = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="${x0} ${y0} ${width} ${height}">`,
    `<title>${esc(model.name)}</title>`,
    `<rect x="${x0}" y="${y0}" width="${width}" height="${height}" fill="${c.background}"/>`,
    ...parts,
    `</svg>`,
  ].join("\n");
  return { svg, width, height };
}

/** Render an SVG document to a PNG, at `scale` (2 for sharp text), capped at 8000px a side */
export function svgToPng(svg: string, width: number, height: number, scale = 2): Promise<Blob> {
  const s = Math.min(scale, 8000 / width, 8000 / height);
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(width * s);
      canvas.height = Math.round(height * s);
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("No 2D canvas"));
      ctx.scale(s, s);
      ctx.drawImage(img, 0, 0, width, height);
      URL.revokeObjectURL(url);
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Couldn't make the PNG"))), "image/png");
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Couldn't draw the SVG"));
    };
    img.src = url;
  });
}

/** Save a file the way a download link does */
export function download(filename: string, data: Blob | string, type = "text/plain") {
  const blob = typeof data === "string" ? new Blob([data], { type: `${type};charset=utf-8` }) : data;
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** The document (schema and positions) as JSON, with a version for later readers */
export function toJson(doc: ErdDocument): string {
  return JSON.stringify({ format: "plainspoken-erd", version: 1, ...doc }, null, 2);
}

/** Read JSON written by toJson, or say what's wrong with it */
export function parseJson(text: string): { doc: ErdDocument } | { error: string } {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch (e) {
    return { error: `That isn't valid JSON: ${(e as Error).message}` };
  }
  const d = data as Partial<ErdDocument> & { format?: string };
  if (d?.format !== "plainspoken-erd" || !d.model || !Array.isArray(d.model.tables) || !Array.isArray(d.model.relations) || typeof d.positions !== "object")
    return { error: "That JSON isn't a diagram exported from here (format “plainspoken-erd”)." };
  return { doc: { model: d.model, positions: d.positions ?? {} } };
}
