// Links from the docs into Storybook, which is built into /storybook. Story titles follow the
// convention in AGENTS.md: "Components/<category>/<title>" for every registry item with stories.

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export const STORYBOOK_URL = "/storybook/index.html";

/** The docs page of a component's stories */
export function storybookDocs(category: string, title: string): string {
  return `${STORYBOOK_URL}?path=/docs/components-${slug(category)}-${slug(title)}--docs`;
}
