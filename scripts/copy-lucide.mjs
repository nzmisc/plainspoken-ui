// Copies icons from Lucide (https://lucide.dev, ISC license) into registry/plainspoken/lib/icons.ts.
// Lucide is not a dependency: each icon's SVG is taken once and kept as plain data, drawn by <Icon>.
//
//   npm run icons -- bell-ring folder-git-2   # add (or refresh) icons by their Lucide name
//   npm run icons -- --all                    # refresh every Lucide icon already in the file
//
// Each icon becomes one line, `export const BellRing: Glyph = { name: "bell-ring", nodes: [...] };`,
// sorted by name. Our own icons live between the "custom" markers at the end and are kept as they are.
import { readFileSync, writeFileSync } from "node:fs";

const FILE = new URL("../registry/plainspoken/lib/icons.ts", import.meta.url);
const SOURCE = "https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/";
const TAGS = ["path", "circle", "rect", "line", "polyline", "polygon", "ellipse"];
const CUSTOM_START = "// --- custom icons: ours, drawn on Lucide's 24px grid with its 2px round stroke ---";
const CUSTOM_END = "// --- end of custom icons ---";

const HEADER = `// Icons, as plain data drawn by <Icon> (ui/icon.tsx). Almost all are copied from Lucide
// (https://lucide.dev, ISC license, see LICENSE-lucide.txt next to this file) by
// scripts/copy-lucide.mjs; re-run it to add more rather than editing those lines by hand. Our own
// icons are at the end, between the "custom" markers.

/** The SVG elements an icon may be drawn with */
export type Shape = "path" | "circle" | "rect" | "line" | "polyline" | "polygon" | "ellipse";

/** One drawing element: tag plus its geometry attributes (\`d\`, \`cx\`, \`points\`...). No styling. */
export type GlyphNode = readonly [Shape, Readonly<Record<string, string>>];

/**
 * An icon: the shapes on a 24×24 grid, to be stroked 2px wide with round caps and joins (Lucide's
 * conventions). Styling lives in <Icon>, so every icon renders the same way.
 */
export interface Glyph {
  /** Kebab-case name: Lucide's for copied icons, ours for custom ones */
  readonly name: string;
  readonly nodes: readonly GlyphNode[];
}

/** True for a Glyph (as opposed to a React element passed where an icon is expected) */
export function isGlyph(x: unknown): x is Glyph {
  return typeof x === "object" && x !== null && "nodes" in x && "name" in x;
}
`;

/** "folder-git-2" -> "FolderGit2" */
const pascal = (name) => name.split("-").map((p) => p[0].toUpperCase() + p.slice(1)).join("");

/** Pull the drawing elements and their attributes out of a Lucide SVG. */
function parse(svg, name) {
  const nodes = [];
  for (const m of svg.matchAll(/<(\w+)\s([^>]*?)\/?>/g)) {
    if (m[1] === "svg") continue;
    if (!TAGS.includes(m[1])) throw new Error(`${name}: unexpected <${m[1]}>`);
    const attrs = Object.fromEntries([...m[2].matchAll(/([\w-]+)="([^"]*)"/g)].map((a) => [a[1], a[2]]));
    nodes.push([m[1], attrs]);
  }
  if (!nodes.length) throw new Error(`${name}: no shapes found`);
  return nodes;
}

let text = "";
try {
  text = readFileSync(FILE, "utf8");
} catch {}
const start = text.indexOf(CUSTOM_START);
const end = text.indexOf(CUSTOM_END);
const custom = start >= 0 && end > start ? text.slice(start + CUSTOM_START.length, end).trim() : "";
const lucidePart = start >= 0 ? text.slice(0, start) : text;
const lines = new Map(
  [...lucidePart.matchAll(/^export const (\w+): Glyph = \{ name: "([\w-]+)".*$/gm)].map((m) => [m[2], m[0]]),
);

const args = process.argv.slice(2);
const wanted = args.includes("--all") ? [...lines.keys()] : args;
if (!wanted.length) {
  console.error("usage: npm run icons -- <lucide-name>... | --all");
  process.exit(1);
}

const failed = [];
const queue = [...new Set(wanted)];
async function worker() {
  for (let name = queue.shift(); name; name = queue.shift()) {
    const res = await fetch(SOURCE + name + ".svg");
    if (!res.ok) {
      failed.push(name);
      console.error(`FAIL ${name}: ${res.status} (renamed? look it up on lucide.dev)`);
      continue;
    }
    const nodes = parse(await res.text(), name);
    lines.set(name, `export const ${pascal(name)}: Glyph = { name: ${JSON.stringify(name)}, nodes: ${JSON.stringify(nodes)} };`);
  }
}
await Promise.all(Array.from({ length: 8 }, worker));

const body = [...lines.keys()].sort().map((k) => lines.get(k)).join("\n");
writeFileSync(FILE, `${HEADER}\n${body}\n\n${CUSTOM_START}\n${custom ? custom + "\n" : ""}${CUSTOM_END}\n`);
console.log(`${lines.size} Lucide icons in icons.ts${failed.length ? `; failed: ${failed.join(", ")}` : ""}`);
if (failed.length) process.exit(1);
