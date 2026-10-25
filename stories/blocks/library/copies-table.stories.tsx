import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { LibraryCopiesTable } from "@/registry/plainspoken/blocks/library/copies-table";
import { BRANCHES, TODAY, availabilityOf, book, copiesOf } from "./fixtures";

const of = (id: string) => ({ copies: copiesOf(book(id)), digital: availabilityOf(book(id)) });

const meta: Meta<typeof LibraryCopiesTable> = {
  title: "Blocks/Library/Copies table",
  component: LibraryCopiesTable,
  args: { ...of("harry-potter-and-the-philosophers-stone"), branches: BRANCHES, today: TODAY },
};
export default meta;
type Story = StoryObj<typeof LibraryCopiesTable>;

/** Books and a DVD across the branches, then the e-book and audiobook licences. */
export const ManyCopies: Story = {};

/** A new arrival: everything out. */
export const AllOut: Story = { args: of("fourth-wing") };

/** One copy, no digital. */
export const OneCopy: Story = { args: of("ariel") };
