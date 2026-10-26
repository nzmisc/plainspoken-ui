import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { BibleBookList } from "@/registry/plainspoken/blocks/bible/book-list";
import { BASE, BOOKS } from "./fixtures";

const meta: Meta<typeof BibleBookList> = {
  title: "Blocks/Bible/Bible book list",
  component: BibleBookList,
  args: { books: BOOKS, basePath: BASE },
};
export default meta;
type Story = StoryObj<typeof BibleBookList>;

/** All 66 books. Two columns on wide screens, one on phones. */
export const WholeBible: Story = {};

/** Only the New Testament: an empty testament leaves no heading behind. */
export const NewTestament: Story = { args: { books: BOOKS.filter((b) => b.testament === "NT") } };
