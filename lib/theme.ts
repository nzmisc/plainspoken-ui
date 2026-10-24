// The theme model: a base gray, a main colour, link colours and fonts, turned into the CSS
// variables shadcn/ui uses (background, foreground, primary, muted, border, ring...) plus the few
// plainspoken-ui adds (link, link-visited, success, warning).
//
// One source for every place a theme comes from: the default stylesheet (scripts/build-theme.ts
// writes app/theme.css from it), the registry's theme item, and the customizer, which runs this
// same code in the browser. No imports, so Node can run it directly (type stripping).

export type Mode = "light" | "dark";

/** A colour in OKLCH: lightness 0-1, chroma 0-0.4, hue in degrees. */
export interface Oklch {
  l: number;
  c: number;
  h: number;
  /** 0-1; left out means opaque */
  alpha?: number;
}

// ---------------------------------------------------------------------------------------------
// Colour math (Björn Ottosson's OKLab, sRGB D65). Enough for hex in, CSS out and contrast checks.

const toLinear = (v: number) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
const toGamma = (v: number) => (v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055);
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

/** "#2a78d6" or "#fff" → OKLCH */
export function hexToOklch(hex: string): Oklch {
  let h = hex.trim().replace(/^#/, "");
  if (h.length === 3) h = [...h].map((x) => x + x).join("");
  const n = parseInt(h.slice(0, 6), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => toLinear(v / 255));
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  const c = Math.hypot(A, B);
  const hue = c < 1e-4 ? 0 : ((Math.atan2(B, A) * 180) / Math.PI + 360) % 360;
  return { l: L, c: c < 1e-4 ? 0 : c, h: hue };
}

/** OKLCH → linear sRGB channels, clipped into the sRGB gamut */
function oklchToLinear({ l, c, h }: Oklch): [number, number, number] {
  const a = c * Math.cos((h * Math.PI) / 180);
  const b = c * Math.sin((h * Math.PI) / 180);
  const l_ = (l + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m_ = (l - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s_ = (l - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [
    clamp01(4.0767416621 * l_ - 3.3077115913 * m_ + 0.2309699292 * s_),
    clamp01(-1.2684380046 * l_ + 2.6097574011 * m_ - 0.3413193965 * s_),
    clamp01(-0.0041960863 * l_ - 0.7034186147 * m_ + 1.707614701 * s_),
  ];
}

/** OKLCH → "#rrggbb" (for <input type="color"> and for people who think in hex) */
export function oklchToHex(c: Oklch): string {
  return (
    "#" +
    oklchToLinear(c)
      .map((v) => Math.round(toGamma(v) * 255).toString(16).padStart(2, "0"))
      .join("")
  );
}

/** WCAG 2 relative luminance */
export function luminance(c: Oklch): number {
  const [r, g, b] = oklchToLinear(c);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG 2 contrast ratio, 1-21 */
export function contrast(a: Oklch, b: Oklch): number {
  const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}

const round = (n: number, digits: number) => Number(n.toFixed(digits));

/** "oklch(0.546 0.245 262.9)", or with " / 50%" when translucent */
export function css(c: Oklch): string {
  const alpha = c.alpha != null && c.alpha < 1 ? ` / ${round(c.alpha * 100, 1)}%` : "";
  return `oklch(${round(c.l, 3)} ${round(c.c, 3)} ${round(c.h, 1)}${alpha})`;
}

/** Parse what css() writes (and plain "oklch(L C H)"); null for anything else */
export function parseOklch(text: string): Oklch | null {
  const m = text.trim().match(/^oklch\(\s*([\d.]+)(%?)\s+([\d.]+)\s+([\d.]+)\s*(?:\/\s*([\d.]+)(%?))?\s*\)$/);
  if (!m) return null;
  const l = Number(m[1]) / (m[2] ? 100 : 1);
  const alpha = m[5] == null ? undefined : Number(m[5]) / (m[6] ? 100 : 1);
  return { l, c: Number(m[3]), h: Number(m[4]), alpha };
}

// ---------------------------------------------------------------------------------------------
// Base grays. Each is a hue and how much chroma its mid grays carry; lighter and darker steps get
// less, the way shadcn/ui's base colours do (hues and chroma measured from them: shadcn/ui, MIT).

export interface BaseGray {
  id: string;
  label: string;
  /** Hue of the tint */
  hue: number;
  /** Chroma at mid lightness (L 0.55); 0 is a pure gray */
  chroma: number;
}

export const BASE_GRAYS: BaseGray[] = [
  { id: "neutral", label: "Neutral", hue: 0, chroma: 0 },
  { id: "stone", label: "Stone", hue: 58.1, chroma: 0.013 },
  { id: "zinc", label: "Zinc", hue: 285.9, chroma: 0.016 },
  { id: "mauve", label: "Mauve", hue: 322.5, chroma: 0.034 },
  { id: "olive", label: "Olive", hue: 107.3, chroma: 0.031 },
  { id: "mist", label: "Mist", hue: 213.5, chroma: 0.021 },
  { id: "taupe", label: "Taupe", hue: 43.1, chroma: 0.021 },
];

/** A gray of the given lightness in the given base: full tint at mid lightness, none at black or white */
export function gray(base: BaseGray, l: number, alpha?: number): Oklch {
  const t = Math.max(0, 1 - Math.abs(l - 0.55) / 0.5);
  return { l, c: base.chroma * t ** 1.2, h: base.hue, alpha };
}

/**
 * Lightness of every gray token. The light values are a plain HTML page's (white, black text,
 * #b4b4b4 rules, #eee header rows); inputs get a darker #8f8f8f edge so their outline passes the
 * 3:1 non-text contrast check against white. Dark is the same idea inverted.
 */
const GRAY_STEPS: Record<Mode, Record<string, number>> = {
  light: {
    background: 1,
    foreground: 0,
    card: 1,
    "card-foreground": 0,
    popover: 1,
    "popover-foreground": 0,
    secondary: 0.949,
    "secondary-foreground": 0,
    muted: 0.949,
    "muted-foreground": 0.479,
    accent: 0.913,
    "accent-foreground": 0,
    border: 0.776,
    input: 0.649,
    sidebar: 0.979,
    "sidebar-foreground": 0,
    "sidebar-accent": 0.913,
    "sidebar-accent-foreground": 0,
    "sidebar-border": 0.776,
  },
  dark: {
    background: 0.183,
    foreground: 0.925,
    card: 0.205,
    "card-foreground": 0.925,
    popover: 0.226,
    "popover-foreground": 0.925,
    secondary: 0.249,
    "secondary-foreground": 0.925,
    muted: 0.249,
    "muted-foreground": 0.705,
    accent: 0.32,
    "accent-foreground": 0.925,
    border: 0.399,
    input: 0.52,
    sidebar: 0.205,
    "sidebar-foreground": 0.925,
    "sidebar-accent": 0.32,
    "sidebar-accent-foreground": 0.925,
    "sidebar-border": 0.399,
  },
};

// ---------------------------------------------------------------------------------------------
// Main colour: primary actions, the selected segment, focus rings. Black (white in dark mode) by
// default. The coloured ones are Tailwind's: a shade dark enough for white text in light mode, the
// 400 shade with dark text in dark mode.

export interface MainColour {
  id: string;
  label: string;
  /** null for black/white, which takes the base gray's tint */
  light: Oklch | null;
  dark: Oklch | null;
}

const ok = (l: number, c: number, h: number): Oklch => ({ l, c, h });

export const MAIN_COLOURS: MainColour[] = [
  { id: "black", label: "Black", light: null, dark: null },
  { id: "blue", label: "Blue", light: ok(0.546, 0.245, 262.881), dark: ok(0.707, 0.165, 254.624) },
  { id: "indigo", label: "Indigo", light: ok(0.511, 0.262, 276.966), dark: ok(0.673, 0.182, 276.935) },
  { id: "violet", label: "Violet", light: ok(0.541, 0.281, 293.009), dark: ok(0.702, 0.183, 293.541) },
  { id: "pink", label: "Pink", light: ok(0.525, 0.223, 3.958), dark: ok(0.718, 0.202, 349.761) },
  { id: "red", label: "Red", light: ok(0.505, 0.213, 27.518), dark: ok(0.704, 0.191, 22.216) },
  { id: "orange", label: "Orange", light: ok(0.553, 0.195, 38.402), dark: ok(0.75, 0.183, 55.934) },
  { id: "amber", label: "Amber", light: ok(0.555, 0.163, 48.998), dark: ok(0.828, 0.189, 84.429) },
  { id: "green", label: "Green", light: ok(0.527, 0.154, 150.069), dark: ok(0.792, 0.209, 151.711) },
  { id: "teal", label: "Teal", light: ok(0.511, 0.096, 186.391), dark: ok(0.777, 0.152, 181.912) },
  { id: "sky", label: "Sky", light: ok(0.5, 0.134, 242.749), dark: ok(0.746, 0.16, 232.661) },
];

/**
 * A main colour from any hex: used as given in light mode, and lifted to a lighter, softer shade in
 * dark mode so it stays readable on the dark background.
 */
export function customMainColour(hex: string): MainColour {
  const light = hexToOklch(hex);
  const dark: Oklch = { l: Math.max(light.l, 0.72), c: Math.min(light.c, 0.19), h: light.h };
  return { id: "custom", label: "Custom", light, dark };
}

// ---------------------------------------------------------------------------------------------
// Link colours. Classic is the browser's own blue and purple; "main" ties links to the main colour.

export interface LinkColours {
  id: string;
  label: string;
  light: { link: Oklch; visited: Oklch } | null;
  dark: { link: Oklch; visited: Oklch } | null;
}

export const LINK_COLOURS: LinkColours[] = [
  {
    id: "classic",
    label: "Classic blue and purple",
    light: { link: hexToOklch("#0000ee"), visited: hexToOklch("#551a8b") },
    dark: { link: hexToOklch("#8ab4f8"), visited: hexToOklch("#c58af9") },
  },
  { id: "main", label: "Main colour", light: null, dark: null },
];

/** Link colours from two hex values, lifted for dark mode like a custom main colour */
export function customLinkColours(link: string, visited: string): LinkColours {
  const lift = (c: Oklch): Oklch => ({ l: Math.max(c.l, 0.74), c: Math.min(c.c, 0.17), h: c.h });
  const [l, v] = [hexToOklch(link), hexToOklch(visited)];
  return { id: "custom", label: "Custom", light: { link: l, visited: v }, dark: { link: lift(l), visited: lift(v) } };
}

// ---------------------------------------------------------------------------------------------
// Fonts. The stacks are what goes into --font-sans and --font-mono; loading the font is up to the
// app (next/font, a <link>, or self-hosted files), except for the system stacks.

export interface FontChoice {
  id: string;
  label: string;
  kind: "sans" | "serif" | "mono";
  stack: string;
  /** Where to get it, for the instructions; null for system fonts */
  source: string | null;
  /** next/font/google export name, when it's on Google Fonts */
  google?: string;
}

const SANS_FALLBACK = "ui-sans-serif, system-ui, sans-serif";
const SERIF_FALLBACK = "ui-serif, Georgia, Cambria, \"Times New Roman\", serif";
const MONO_FALLBACK = "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";

export const FONTS: FontChoice[] = [
  { id: "geist", label: "Geist", kind: "sans", stack: `"Geist", ${SANS_FALLBACK}`, source: "https://vercel.com/font", google: "Geist" },
  { id: "system", label: "System UI", kind: "sans", stack: SANS_FALLBACK, source: null },
  { id: "inter", label: "Inter", kind: "sans", stack: `"Inter", ${SANS_FALLBACK}`, source: "https://rsms.me/inter/", google: "Inter" },
  { id: "ibm-plex-sans", label: "IBM Plex Sans", kind: "sans", stack: `"IBM Plex Sans", ${SANS_FALLBACK}`, source: "https://www.ibm.com/plex/", google: "IBM_Plex_Sans" },
  { id: "source-serif", label: "Source Serif 4", kind: "serif", stack: `"Source Serif 4", ${SERIF_FALLBACK}`, source: "https://fonts.google.com/specimen/Source+Serif+4", google: "Source_Serif_4" },
  { id: "system-serif", label: "System serif", kind: "serif", stack: SERIF_FALLBACK, source: null },
  { id: "geist-mono", label: "Geist Mono", kind: "mono", stack: `"Geist Mono", ${MONO_FALLBACK}`, source: "https://vercel.com/font", google: "Geist_Mono" },
  { id: "jetbrains-mono", label: "JetBrains Mono", kind: "mono", stack: `"JetBrains Mono", ${MONO_FALLBACK}`, source: "https://www.jetbrains.com/lp/mono/", google: "JetBrains_Mono" },
  { id: "ibm-plex-mono", label: "IBM Plex Mono", kind: "mono", stack: `"IBM Plex Mono", ${MONO_FALLBACK}`, source: "https://www.ibm.com/plex/", google: "IBM_Plex_Mono" },
  { id: "system-mono", label: "System monospace", kind: "mono", stack: MONO_FALLBACK, source: null },
];

// ---------------------------------------------------------------------------------------------
// Fixed colours: not theme settings, but every theme has them.

const FIXED: Record<Mode, Record<string, Oklch>> = {
  light: {
    destructive: hexToOklch("#c4161c"),
    "destructive-foreground": ok(1, 0, 0),
    success: hexToOklch("#1d7a1d"),
    warning: hexToOklch("#a15c00"),
    // Series colours: blue, orange and aqua pass the colour-blindness checks as a set (from an
    // earlier dashboard); 4 and 5 have not been checked against them.
    "chart-1": hexToOklch("#2a78d6"),
    "chart-2": hexToOklch("#eb6834"),
    "chart-3": hexToOklch("#1baf7a"),
    "chart-4": hexToOklch("#8b5cf6"),
    "chart-5": hexToOklch("#737373"),
  },
  dark: {
    destructive: hexToOklch("#ff6b6b"),
    "destructive-foreground": ok(0.183, 0, 0),
    success: hexToOklch("#5fbf5f"),
    warning: hexToOklch("#e0a030"),
    "chart-1": hexToOklch("#3987e5"),
    "chart-2": hexToOklch("#d95926"),
    "chart-3": hexToOklch("#199e70"),
    "chart-4": hexToOklch("#a78bfa"),
    "chart-5": hexToOklch("#a3a3a3"),
  },
};

// ---------------------------------------------------------------------------------------------
// The theme.

export interface ThemeOptions {
  base: BaseGray;
  main: MainColour;
  links: LinkColours;
  sans: FontChoice;
  mono: FontChoice;
}

export const DEFAULT_THEME: ThemeOptions = {
  base: BASE_GRAYS[0],
  main: MAIN_COLOURS[0],
  links: LINK_COLOURS[0],
  sans: FONTS.find((f) => f.id === "geist")!,
  mono: FONTS.find((f) => f.id === "geist-mono")!,
};

export interface Theme {
  /** CSS variable name (without --) → value, for :root and for .dark */
  light: Record<string, string>;
  dark: Record<string, string>;
  /** For @theme: fonts, and the radius (none, see docs/concepts/theming.md) */
  theme: Record<string, string>;
}

/** Text colour for a fill: white or near-black, whichever reads better (WCAG contrast). */
function onFill(fill: Oklch, base: BaseGray): Oklch {
  const white = gray(base, 1);
  const black = gray(base, 0.183);
  return contrast(fill, white) >= contrast(fill, black) ? white : black;
}

function mode(o: ThemeOptions, m: Mode): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [token, l] of Object.entries(GRAY_STEPS[m])) out[token] = css(gray(o.base, l));

  const primary = o.main[m] ?? gray(o.base, m === "light" ? 0.2 : 0.93);
  const primaryFg = onFill(primary, o.base);
  out.primary = css(primary);
  out["primary-foreground"] = css(primaryFg);
  out.ring = css(primary);
  out["sidebar-primary"] = out.primary;
  out["sidebar-primary-foreground"] = out["primary-foreground"];
  out["sidebar-ring"] = out.ring;

  for (const [token, c] of Object.entries(FIXED[m])) out[token] = css(c);

  // Links: as chosen, or the main colour (black's links are the text colour, visited ones muted)
  const links = o.links[m];
  if (links) {
    out.link = css(links.link);
    out["link-visited"] = css(links.visited);
  } else if (o.main[m]) {
    out.link = css(primary);
    out["link-visited"] = css({ ...primary, l: m === "light" ? primary.l * 0.75 : primary.l * 0.85, c: primary.c * 0.6 });
  } else {
    out.link = out.foreground;
    out["link-visited"] = out["muted-foreground"];
  }
  return out;
}

export function buildTheme(o: ThemeOptions = DEFAULT_THEME): Theme {
  return {
    light: mode(o, "light"),
    dark: mode(o, "dark"),
    theme: { "font-sans": o.sans.stack, "font-mono": o.mono.stack, radius: "0rem" },
  };
}

/** Every colour token, in the order the stylesheet lists them */
export const COLOR_TOKENS = [
  "background", "foreground", "card", "card-foreground", "popover", "popover-foreground",
  "primary", "primary-foreground", "secondary", "secondary-foreground", "muted", "muted-foreground",
  "accent", "accent-foreground", "destructive", "destructive-foreground", "success", "warning",
  "border", "input", "ring", "link", "link-visited",
  "chart-1", "chart-2", "chart-3", "chart-4", "chart-5",
  "sidebar", "sidebar-foreground", "sidebar-primary", "sidebar-primary-foreground",
  "sidebar-accent", "sidebar-accent-foreground", "sidebar-border", "sidebar-ring",
] as const;

const block = (selector: string, vars: Record<string, string>, indent = "  ") =>
  `${selector} {\n${Object.entries(vars).map(([k, v]) => `${indent}--${k}: ${v};`).join("\n")}\n}`;

const ordered = (vars: Record<string, string>) =>
  Object.fromEntries(COLOR_TOKENS.filter((t) => t in vars).map((t) => [t, vars[t]]));

/**
 * The CSS for a theme: :root and .dark with the values, and the @theme inline block that makes
 * Tailwind utilities of them (bg-background, text-muted-foreground, border-input, text-link...).
 */
export function themeCss(t: Theme, opts: { fontVars?: { sans?: string; mono?: string } } = {}): string {
  // A font variable (from next/font) goes first, with a fallback so the stack still works where it isn't set
  const first = (stack: string) => stack.split(",")[0].trim();
  const fontSans = opts.fontVars?.sans ? `var(${opts.fontVars.sans}, ${first(t.theme["font-sans"])}), ${t.theme["font-sans"]}` : t.theme["font-sans"];
  const fontMono = opts.fontVars?.mono ? `var(${opts.fontVars.mono}, ${first(t.theme["font-mono"])}), ${t.theme["font-mono"]}` : t.theme["font-mono"];
  const inline: Record<string, string> = {
    "font-sans": fontSans,
    "font-mono": fontMono,
    ...Object.fromEntries(COLOR_TOKENS.map((tok) => [`color-${tok}`, `var(--${tok})`])),
    "radius-sm": "max(0px, calc(var(--radius) - 4px))",
    "radius-md": "max(0px, calc(var(--radius) - 2px))",
    "radius-lg": "var(--radius)",
    "radius-xl": "calc(var(--radius) + 4px)",
  };
  return [
    block(":root", { radius: t.theme.radius, ...ordered(t.light) }),
    block(".dark", ordered(t.dark)),
    block("@theme inline", inline),
  ].join("\n\n");
}

/** The registry item (shadcn's registry:theme) for a theme, as the CLI wants it */
export function themeRegistryItem(t: Theme, name = "theme", title = "plainspoken-ui theme") {
  return {
    $schema: "https://ui.shadcn.com/schema/registry-item.json",
    name,
    type: "registry:theme",
    title,
    description: "Colours, fonts and (no) radius for plainspoken-ui, as shadcn/ui CSS variables.",
    cssVars: {
      theme: { "font-sans": t.theme["font-sans"], "font-mono": t.theme["font-mono"] },
      light: { radius: t.theme.radius, ...ordered(t.light) },
      dark: ordered(t.dark),
    },
  };
}

// ---------------------------------------------------------------------------------------------
// Options ⇄ URL search params, so a customized theme is a link (and a registry URL).

export function themeToParams(o: ThemeOptions): URLSearchParams {
  const p = new URLSearchParams();
  if (o.base.id !== DEFAULT_THEME.base.id) p.set("base", o.base.id);
  if (o.main.id === "custom" && o.main.light) p.set("main", oklchToHex(o.main.light));
  else if (o.main.id !== DEFAULT_THEME.main.id) p.set("main", o.main.id);
  if (o.links.id === "custom" && o.links.light) p.set("links", `${oklchToHex(o.links.light.link)},${oklchToHex(o.links.light.visited)}`);
  else if (o.links.id !== DEFAULT_THEME.links.id) p.set("links", o.links.id);
  if (o.sans.id !== DEFAULT_THEME.sans.id) p.set("sans", o.sans.id);
  if (o.mono.id !== DEFAULT_THEME.mono.id) p.set("mono", o.mono.id);
  return p;
}

const HEX = /^#?[0-9a-f]{6}$/i;

export function themeFromParams(p: URLSearchParams | Record<string, string | undefined>): ThemeOptions {
  const get = (k: string) => (p instanceof URLSearchParams ? p.get(k) : p[k]) ?? undefined;
  const main = get("main");
  const links = get("links");
  const [link, visited] = links?.split(",") ?? [];
  return {
    base: BASE_GRAYS.find((b) => b.id === get("base")) ?? DEFAULT_THEME.base,
    main: main && HEX.test(main) ? customMainColour(main.startsWith("#") ? main : `#${main}`) : (MAIN_COLOURS.find((c) => c.id === main) ?? DEFAULT_THEME.main),
    links:
      link && visited && HEX.test(link) && HEX.test(visited)
        ? customLinkColours(link.startsWith("#") ? link : `#${link}`, visited.startsWith("#") ? visited : `#${visited}`)
        : (LINK_COLOURS.find((c) => c.id === links) ?? DEFAULT_THEME.links),
    sans: FONTS.find((f) => f.id === get("sans") && f.kind !== "mono") ?? DEFAULT_THEME.sans,
    mono: FONTS.find((f) => f.id === get("mono") && f.kind === "mono") ?? DEFAULT_THEME.mono,
  };
}
