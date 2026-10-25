import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { BibleChapterPager } from "@/registry/plainspoken/blocks/bible/chapter-pager";
import { BASE } from "./fixtures";

const meta: Meta<typeof BibleChapterPager> = {
  title: "Blocks/Bible/Bible chapter pager",
  component: BibleChapterPager,
  args: { prev: { slug: "john", name: "John", chapter: 2 }, next: { slug: "john", name: "John", chapter: 4 }, basePath: BASE, className: "max-w-xl" },
};
export default meta;
type Story = StoryObj<typeof BibleChapterPager>;

/** In the middle of a book. Press ← or → with focus on the page (not in a control). */
export const Middle: Story = {};

/** Across books: Malachi 4 leads to Matthew 1. */
export const AcrossBooks: Story = { args: { prev: { slug: "malachi", name: "Malachi", chapter: 3 }, next: { slug: "matthew", name: "Matthew", chapter: 1 } } };

/** At the very start there is nothing before. */
export const Genesis1: Story = { args: { prev: null, next: { slug: "genesis", name: "Genesis", chapter: 2 } } };

/** And at the very end nothing after. */
export const Revelation22: Story = { args: { prev: { slug: "revelation", name: "Revelation", chapter: 21 }, next: null } };
