import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import descriptions from "@/content/bible/descriptions.json";
import { BibleBookIntro } from "@/registry/plainspoken/blocks/bible/book-intro";
import { BASE, book } from "./fixtures";

const meta: Meta<typeof BibleBookIntro> = {
  title: "Blocks/Bible/Bible book intro",
  component: BibleBookIntro,
  args: { book: book("genesis"), description: (descriptions as Record<string, string>).genesis, basePath: BASE },
};
export default meta;
type Story = StoryObj<typeof BibleBookIntro>;

export const Genesis: Story = {};

/** The Psalms: "Read Psalm 1", not "Psalms 1". */
export const Psalms: Story = { args: { book: book("psalms"), description: (descriptions as Record<string, string>).psalms } };

/** Without a description. */
export const Bare: Story = { args: { book: book("jude"), description: undefined } };
