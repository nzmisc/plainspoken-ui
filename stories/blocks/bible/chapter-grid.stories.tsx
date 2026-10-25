import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { BibleChapterGrid } from "@/registry/plainspoken/blocks/bible/chapter-grid";
import { BASE, book } from "./fixtures";

const meta: Meta<typeof BibleChapterGrid> = {
  title: "Blocks/Bible/Bible chapter grid",
  component: BibleChapterGrid,
  args: { book: book("genesis"), basePath: BASE, current: 3 },
};
export default meta;
type Story = StoryObj<typeof BibleChapterGrid>;

export const Genesis: Story = {};

/** The longest book: 150 psalms. */
export const Psalms: Story = { args: { book: book("psalms"), current: undefined } };

/** A one-chapter book. */
export const Obadiah: Story = { args: { book: book("obadiah"), current: 1 } };
