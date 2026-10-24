import { registry } from "@/registry/__index__";
import type { DocsNavSection } from "@/components/site/docs-nav";

/** The order categories appear in the docs and Storybook */
export const CATEGORY_ORDER = [
  "Controls",
  "Forms",
  "Feedback",
  "Overlays",
  "Navigation",
  "Data display",
  "Layout",
  "Typography",
  "Charts",
  "Foundations",
  "Other",
];

export function componentEntries() {
  return registry.filter((e) => !e.hidden && e.type === "registry:ui");
}

export function blockEntries() {
  return registry.filter((e) => !e.hidden && (e.type === "registry:block" || e.type === "registry:page"));
}

export function componentsByCategory() {
  const groups = new Map<string, ReturnType<typeof componentEntries>>();
  for (const e of componentEntries()) groups.set(e.category, [...(groups.get(e.category) ?? []), e]);
  return [...groups.entries()]
    .sort(([a], [b]) => (CATEGORY_ORDER.indexOf(a) + 1 || 99) - (CATEGORY_ORDER.indexOf(b) + 1 || 99))
    .map(([category, entries]) => ({ category, entries: entries.sort((a, b) => a.title.localeCompare(b.title)) }));
}

export function docsNav(): DocsNavSection[] {
  return [
    {
      title: "Getting started",
      items: [
        { href: "/docs", label: "Introduction" },
        { href: "/docs/installation", label: "Installation" },
        { href: "/docs/theming", label: "Theming" },
        { href: "/docs/control-sizes", label: "Control sizes" },
        { href: "/docs/icons", label: "Icons" },
        { href: "/docs/components", label: "All components" },
        { href: "/docs/blocks", label: "Blocks" },
      ],
    },
    ...componentsByCategory().map(({ category, entries }) => ({
      title: category,
      items: entries.map((e) => ({ href: `/docs/components/${e.name}`, label: e.title })),
    })),
  ];
}
