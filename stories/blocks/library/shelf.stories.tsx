import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { LibraryShelf } from "@/registry/plainspoken/blocks/library/shelf";
import { BASE, NEW_ARRIVALS, book } from "./fixtures";

const meta: Meta<typeof LibraryShelf> = {
  title: "Blocks/Library/Library shelf",
  component: LibraryShelf,
  args: { title: "New arrivals", books: NEW_ARRIVALS, basePath: BASE },
};
export default meta;
type Story = StoryObj<typeof LibraryShelf>;

/** Eighteen new titles: the row scrolls sideways. */
export const NewArrivals: Story = { args: { action: <a href="#all" className="text-link underline">See all</a> } };

/** A short shelf that fits. */
export const Short: Story = { args: { title: "Similar titles", books: ["dune", "foundation", "the-left-hand-of-darkness"].map(book) } };
