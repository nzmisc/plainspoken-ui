// Links from the docs into Storybook, which is built into /storybook. Story titles follow the
// convention in AGENTS.md: "Components/<category>/<title>" for components and
// "Blocks/<demo>/<title>" for blocks.

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export const STORYBOOK_URL = "/storybook/index.html";

/** The docs page of a component's or block's stories */
export function storybookDocsFor(entry: { type: string; category: string; title: string }): string {
  const section = entry.type === "registry:ui" ? "components" : "blocks";
  return `${STORYBOOK_URL}?path=/docs/${section}-${slug(entry.category)}-${slug(entry.title)}--docs`;
}
