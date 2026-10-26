import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { LibraryFacets, type FacetGroup } from "@/registry/plainspoken/blocks/library/facets";
import { FORMAT_LABELS, FORMATS, type LibraryBook } from "@/registry/plainspoken/blocks/library/lib";
import { BOOKS, BRANCHES } from "./fixtures";

function facet(key: string, label: string, values: (b: LibraryBook) => string[]): FacetGroup {
  const counts = new Map<string, number>();
  for (const b of BOOKS) for (const v of values(b)) counts.set(v, (counts.get(v) ?? 0) + 1);
  return { key, label, options: [...counts].sort((a, b) => b[1] - a[1]).map(([v, n]) => ({ value: v, label: v, count: n })) };
}

const GROUPS = [
  facet("format", "Format", (b) => FORMATS.filter((f) => b.formats.includes(f)).map((f) => FORMAT_LABELS[f])),
  facet("subject", "Subject", (b) => b.subjects),
  facet("audience", "Audience", (b) => [b.audience]),
  facet("language", "Language", (b) => [b.language]),
];

const meta: Meta<typeof LibraryFacets> = {
  title: "Blocks/Library/Library facets",
  component: LibraryFacets,
  args: { groups: GROUPS, years: { min: 1605, max: 2025 }, branches: BRANCHES, className: "max-w-xs" },
};
export default meta;
type Story = StoryObj<typeof LibraryFacets>;

/** The whole catalogue's facets. Subject has a long tail behind “Show more”. */
export const Catalogue: Story = {};

/** Some values ticked, every section open. */
export const Chosen: Story = { args: { defaultSelected: { format: ["Book", "Audiobook"], audience: ["Teen"] }, defaultOpen: ["format", "subject", "audience", "language"] } };

/** On a phone: a Filters button that opens the same panel in a drawer. */
export const Phone: Story = { globals: { viewport: { value: "iphoneSE", isRotated: false } } };
