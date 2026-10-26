import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { BibleChapter } from "@/registry/plainspoken/blocks/bible/chapter";
import { BibleReaderSettings } from "@/registry/plainspoken/blocks/bible/reader-settings";
import Psalm from "@/registry/plainspoken/examples/bible-chapter-psalm";
import { JOHN, RUTH } from "./fixtures";

const meta: Meta<typeof BibleChapter> = {
  title: "Blocks/Bible/Bible chapter",
  component: BibleChapter,
  args: { book: RUTH.book, chapter: 1, text: RUTH.chapters[0] },
};
export default meta;
type Story = StoryObj<typeof BibleChapter>;

/** Ruth 1: paragraphs, and the book's own title over chapter 1. */
export const Ruth1: Story = {};

/** John 3, with the reader settings in the toolbar slot: change them and the text follows. */
export const WithSettings: Story = { args: { book: JOHN.book, chapter: 3, text: JOHN.chapters[2], toolbar: <BibleReaderSettings size="sm" /> } };

/** A psalm: its title, and a line per verse. */
export const Poetry: Story = { render: () => <Psalm /> };

/** The shortest verse in the KJV, alone. */
export const OneVerse: Story = { args: { book: JOHN.book, chapter: 11, text: { verses: ["Jesus wept."] }, showBookTitle: false } };
