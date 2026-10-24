// Builds the shadcn registry from registry/items/*.json and the files they list.
//
//   node scripts/build-registry.ts           # everything: registry.json, registry/__index__.ts, public/r/*.json
//   node scripts/build-registry.ts --index   # only registry.json and registry/__index__.ts (fast; `npm run dev` runs this)
//
// An item file is shadcn's registry-item.json minus what can be worked out:
//   {
//     "name": "button", "type": "registry:ui", "title": "Button", "description": "…",
//     "category": "Controls",                 // docs and Storybook grouping
//     "files": ["ui/button.tsx"],             // relative to registry/plainspoken/
//     "examples": ["button-demo"],            // registry/plainspoken/examples/<name>.tsx, shown on the docs page
//     "dependencies": [], "registryDependencies": [], "cssVars": {}, "css": {}   // only extras
//   }
// Dependencies come from the files' imports: @/registry/plainspoken/… becomes the item that owns
// that file, @/lib/utils becomes shadcn's "utils", and bare package names become npm dependencies.
// In public/r, sibling items are absolute URLs on this deployment (lib/site.ts), so
// `npx shadcn add https://…/r/button.json` works without configuring anything. In registry.json
// they are namespaced (@plainspoken/button), for projects that add the registry to components.json.
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, posix } from "node:path";
import { fileURLToPath } from "node:url";
import { REGISTRY_NAMESPACE, REPO_URL, SITE_NAME, siteUrl } from "../lib/site.ts";
import { buildTheme, DEFAULT_THEME, themeRegistryItem } from "../lib/theme.ts";
import { FOUNDATION_CSS, foundationCssVars } from "../lib/foundation.ts";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const STYLE_DIR = "registry/plainspoken";
const ITEMS_DIR = join(ROOT, "registry/items");
const OUT_DIR = join(ROOT, "public/r");
const indexOnly = process.argv.includes("--index");

interface ItemSource {
  name: string;
  type: string;
  title: string;
  description: string;
  category?: string;
  files: (string | { path: string; type?: string; target?: string })[];
  examples?: string[];
  dependencies?: string[];
  devDependencies?: string[];
  registryDependencies?: string[];
  cssVars?: Record<string, Record<string, string>>;
  css?: Record<string, unknown>;
  docs?: string;
  meta?: Record<string, unknown>;
  /** Leave out of the docs component list (helpers like icons) */
  hidden?: boolean;
}

interface FileOut {
  path: string;
  type: string;
  target?: string;
  content?: string;
}

function fail(msg: string): never {
  console.error(`build-registry: ${msg}`);
  process.exit(1);
}

// ---------------------------------------------------------------------------------------------
// Load items

const sources: ItemSource[] = readdirSync(ITEMS_DIR)
  .filter((f) => f.endsWith(".json"))
  .sort()
  .map((f) => {
    const item = JSON.parse(readFileSync(join(ITEMS_DIR, f), "utf8")) as ItemSource;
    if (item.name !== f.replace(/\.json$/, "")) fail(`${f}: name "${item.name}" doesn't match the file name`);
    for (const key of ["type", "title", "description", "files"] as const) if (!item[key]) fail(`${f}: missing "${key}"`);
    return item;
  });

/** Default file type and install target for a path under registry/plainspoken/ */
function fileType(rel: string, itemType: string): { type: string; target?: string } {
  const [top] = rel.split("/");
  if (top === "ui") return { type: "registry:ui" };
  if (top === "lib") return rel.endsWith(".txt") ? { type: "registry:file", target: `lib/${posix.basename(rel)}` } : { type: "registry:lib" };
  if (top === "hooks") return { type: "registry:hook" };
  // Blocks and anything else: components/<path>, which is where the CLI's import rewriting points
  // @/registry/plainspoken/<path> (to the components alias).
  return { type: itemType === "registry:page" ? "registry:page" : "registry:component", target: `components/${rel}` };
}

const owner = new Map<string, string>(); // "ui/button" (no extension) → item name
const itemFiles = new Map<string, FileOut[]>();
for (const item of sources) {
  const files: FileOut[] = item.files.map((f) => {
    const spec = typeof f === "string" ? { path: f } : f;
    const abs = join(ROOT, STYLE_DIR, spec.path);
    if (!existsSync(abs)) fail(`${item.name}: file ${spec.path} not found`);
    const auto = fileType(spec.path, item.type);
    const key = spec.path.replace(/\.(tsx?|jsx?|json|css|txt)$/, "");
    if (owner.has(key)) fail(`${spec.path} is in both ${owner.get(key)} and ${item.name}`);
    owner.set(key, item.name);
    return { path: `${STYLE_DIR}/${spec.path}`, type: spec.type ?? auto.type, target: spec.target ?? auto.target };
  });
  itemFiles.set(item.name, files);
}

// ---------------------------------------------------------------------------------------------
// Dependencies from imports

const IMPLICIT_NPM = new Set(["react", "react-dom", "next"]);
const IMPORT_RE = /(?:import|export)\s[^'"]*?from\s*["']([^"']+)["']|import\(\s*["']([^"']+)["']\s*\)|^\s*import\s*["']([^"']+)["']/gm;

function scanImports(item: ItemSource) {
  const registry = new Set<string>();
  const npm = new Set<string>();
  for (const f of itemFiles.get(item.name)!) {
    if (!/\.(tsx?|jsx?)$/.test(f.path)) continue;
    // Comments out first: doc comments show imports as examples
    const text = readFileSync(join(ROOT, f.path), "utf8").replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
    for (const m of text.matchAll(IMPORT_RE)) {
      const spec = m[1] ?? m[2] ?? m[3];
      if (spec.startsWith("@/registry/plainspoken/")) {
        const key = spec.slice("@/registry/plainspoken/".length);
        const dep = owner.get(key);
        if (!dep) fail(`${item.name}: ${f.path} imports ${spec}, which no item lists in its files`);
        if (dep !== item.name) registry.add(dep);
      } else if (spec === "@/lib/utils") {
        registry.add("utils");
      } else if (spec.startsWith("@/")) {
        fail(`${item.name}: ${f.path} imports ${spec}; registry files may only import @/registry/plainspoken/… and @/lib/utils`);
      } else if (!spec.startsWith(".") && !spec.startsWith("node:")) {
        const pkg = spec.startsWith("@") ? spec.split("/").slice(0, 2).join("/") : spec.split("/")[0];
        if (!IMPLICIT_NPM.has(pkg)) npm.add(pkg);
      }
    }
  }
  return { registry, npm };
}

const SELF_STANDING = new Set(["foundation", "icons", "theme", "utils"]);

const resolved = sources.map((item) => {
  const { registry, npm } = scanImports(item);
  for (const d of item.registryDependencies ?? []) registry.add(d);
  if (!SELF_STANDING.has(item.name) && item.type !== "registry:theme") registry.add("foundation");
  registry.delete(item.name);
  return {
    item,
    registryDependencies: [...registry].sort(),
    dependencies: [...new Set([...(item.dependencies ?? []), ...npm])].sort(),
  };
});

const names = new Set(sources.map((s) => s.name));
const depRef = (dep: string, mode: "url" | "namespace") => {
  if (dep === "utils" || dep.startsWith("http") || dep.startsWith("@")) return dep;
  if (!names.has(dep)) fail(`unknown registry dependency "${dep}"`);
  return mode === "url" ? `${siteUrl()}/r/${dep}.json` : `${REGISTRY_NAMESPACE}/${dep}`;
};

// ---------------------------------------------------------------------------------------------
// The foundation and theme items are made from lib/foundation.ts and lib/theme.ts, so the CSS
// they add is exactly this site's.

function generated(name: string): Partial<ItemSource> {
  if (name === "foundation") return { cssVars: foundationCssVars(), css: FOUNDATION_CSS };
  if (name === "theme") {
    const t = themeRegistryItem(buildTheme(DEFAULT_THEME));
    return { cssVars: t.cssVars };
  }
  return {};
}

function itemJson(r: (typeof resolved)[number], mode: "url" | "namespace", withContent: boolean) {
  const { item } = r;
  const extra = generated(item.name);
  const files = itemFiles.get(item.name)!.map((f) => ({
    path: f.path,
    type: f.type,
    ...(f.target ? { target: f.target } : {}),
    ...(withContent ? { content: readFileSync(join(ROOT, f.path), "utf8") } : {}),
  }));
  const out: Record<string, unknown> = {
    ...(withContent ? { $schema: "https://ui.shadcn.com/schema/registry-item.json" } : {}),
    name: item.name,
    type: item.type,
    title: item.title,
    description: item.description,
    author: "plainspoken-ui <" + REPO_URL + ">",
  };
  if (r.dependencies.length) out.dependencies = r.dependencies;
  if (item.devDependencies?.length) out.devDependencies = item.devDependencies;
  if (r.registryDependencies.length) out.registryDependencies = r.registryDependencies.map((d) => depRef(d, mode));
  if (files.length) out.files = files;
  const cssVars = extra.cssVars ?? item.cssVars;
  if (cssVars) out.cssVars = cssVars;
  const css = extra.css ?? item.css;
  if (css) out.css = css;
  if (item.docs) out.docs = item.docs;
  if (item.category) out.categories = [item.category.toLowerCase().replace(/\s+/g, "-")];
  if (item.meta) out.meta = item.meta;
  return out;
}

// ---------------------------------------------------------------------------------------------
// registry.json (namespaced, the source list in shadcn's format) and the docs index

const registryJson = {
  $schema: "https://ui.shadcn.com/schema/registry.json",
  name: SITE_NAME,
  homepage: REPO_URL,
  items: resolved.map((r) => itemJson(r, "namespace", false)),
};
writeFileSync(join(ROOT, "registry.json"), JSON.stringify(registryJson, null, 2) + "\n");

const examples = new Map<string, string>();
for (const item of sources)
  for (const ex of item.examples ?? []) {
    const file = join(ROOT, STYLE_DIR, "examples", `${ex}.tsx`);
    if (!existsSync(file)) fail(`${item.name}: example ${ex} not found at ${STYLE_DIR}/examples/${ex}.tsx`);
    if (examples.has(ex)) fail(`example ${ex} is listed by both ${examples.get(ex)} and ${item.name}`);
    examples.set(ex, item.name);
  }

const index = `// Generated by scripts/build-registry.ts from registry/items/*.json. Don't edit by hand.
// What the docs site knows about every registry item. No imports, so client components can use it;
// the examples themselves are in __examples__.ts.

export interface RegistryEntry {
  name: string;
  type: string;
  title: string;
  description: string;
  category: string;
  files: { path: string; type: string; target?: string }[];
  examples: string[];
  registryDependencies: string[];
  dependencies: string[];
  hidden: boolean;
}

export const registry: RegistryEntry[] = ${JSON.stringify(
  resolved.map((r) => ({
    name: r.item.name,
    type: r.item.type,
    title: r.item.title,
    description: r.item.description,
    category: r.item.category ?? "Other",
    files: itemFiles.get(r.item.name)!.map(({ path, type, target }) => ({ path, type, ...(target ? { target } : {}) })),
    examples: r.item.examples ?? [],
    registryDependencies: r.registryDependencies,
    dependencies: r.dependencies,
    hidden: r.item.hidden ?? false,
  })),
  null,
  2,
)};

`;
writeFileSync(join(ROOT, "registry/__index__.ts"), index);

const exampleNames = [...examples.keys()].sort();
const ident = (ex: string) => "E_" + ex.replace(/[^a-zA-Z0-9]/g, "_");
const examplesIndex = `// Generated by scripts/build-registry.ts from registry/items/*.json. Don't edit by hand.
// Every docs example, imported statically so the docs pages prerender. Server-side only: importing
// this from a client component would bundle every example.
import type { ComponentType } from "react";
${exampleNames.map((ex) => `import ${ident(ex)} from "@/registry/plainspoken/examples/${ex}";`).join("\n")}

export const examples: Record<string, ComponentType> = {
${exampleNames.map((ex) => `  ${JSON.stringify(ex)}: ${ident(ex)},`).join("\n")}
};
`;
writeFileSync(join(ROOT, "registry/__examples__.ts"), examplesIndex);

// ---------------------------------------------------------------------------------------------
// public/r: one JSON per item, with file contents and absolute URLs, plus the index

if (!indexOnly) {
  rmSync(OUT_DIR, { recursive: true, force: true });
  mkdirSync(OUT_DIR, { recursive: true });
  for (const r of resolved) writeFileSync(join(OUT_DIR, `${r.item.name}.json`), JSON.stringify(itemJson(r, "url", true), null, 2) + "\n");
  writeFileSync(
    join(OUT_DIR, "registry.json"),
    JSON.stringify({ ...registryJson, items: resolved.map((r) => itemJson(r, "url", false)) }, null, 2) + "\n",
  );
  console.log(`${resolved.length} items in public/r for ${siteUrl()}`);
} else {
  console.log(`${resolved.length} items indexed`);
}
