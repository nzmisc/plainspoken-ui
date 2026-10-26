// What every plainspoken-ui component needs in the app's CSS besides the shadcn/ui colour tokens:
// the control height scale (ctl-xs ... ctl-lg) and four colours shadcn/ui doesn't have (link,
// link-visited, success, warning). The registry's "foundation" item adds exactly this to a
// project's CSS file; scripts/build-theme.ts writes the same into app/theme.css for this site.
// No imports except lib/theme.ts, so Node can run it directly.

import { buildTheme, DEFAULT_THEME } from "./theme.ts";

type CssObject = { [selectorOrProperty: string]: string | CssObject };

/** One size of the scale: height, side padding, inner inset, text size, gap and icon size */
const SCALE = {
  xs: { h: "20px", px: "6px", inset: "4px", text: "12px", gap: "4px", icon: "12px" },
  sm: { h: "24px", px: "8px", inset: "6px", text: "13px", gap: "6px", icon: "14px" },
  md: { h: "28px", px: "10px", inset: "8px", text: "14px", gap: "6px", icon: "16px" },
  lg: { h: "36px", px: "14px", inset: "10px", text: "16px", gap: "8px", icon: "18px" },
} as const;

const vars = (s: (typeof SCALE)[keyof typeof SCALE]) => ({
  "--ctl-h": s.h,
  "--ctl-px": s.px,
  "--ctl-inset": s.inset,
  "--ctl-text": s.text,
  "--ctl-gap": s.gap,
  "--ctl-icon": s.icon,
});

/** In shadcn's registry-item `css` format: at-rule or selector → declarations or nested rules */
export const FOUNDATION_CSS: CssObject = {
  "@utility ctl-xs": vars(SCALE.xs),
  "@utility ctl-sm": vars(SCALE.sm),
  "@utility ctl-md": vars(SCALE.md),
  "@utility ctl-lg": vars(SCALE.lg),
  "@layer base": { ":root": vars(SCALE.md) },
};

const EXTRA_COLOURS = ["link", "link-visited", "success", "warning"] as const;

/** In shadcn's registry-item `cssVars` format */
export function foundationCssVars() {
  const t = buildTheme(DEFAULT_THEME);
  const pick = (m: Record<string, string>) => Object.fromEntries(EXTRA_COLOURS.map((k) => [k, m[k]]));
  return {
    theme: {
      ...Object.fromEntries(EXTRA_COLOURS.map((k) => [`color-${k}`, `var(--${k})`])),
      ...Object.fromEntries(Object.entries(SCALE).map(([k, s]) => [`spacing-ctl-${k}`, s.h])),
    },
    light: pick(t.light),
    dark: pick(t.dark),
  };
}

/** Write a CssObject as CSS text */
export function cssText(obj: CssObject, indent = ""): string {
  return Object.entries(obj)
    .map(([k, v]) =>
      typeof v === "string" ? `${indent}${k}: ${v};` : `${indent}${k} {\n${cssText(v, indent + "  ")}\n${indent}}`,
    )
    .join("\n");
}

/** Control heights as Tailwind spacing (h-ctl-md, min-h-ctl-sm), for this site's own @theme */
export function spacingTheme(): string {
  return `@theme {\n${Object.entries(SCALE).map(([k, s]) => `  --spacing-ctl-${k}: ${s.h};`).join("\n")}\n}`;
}
