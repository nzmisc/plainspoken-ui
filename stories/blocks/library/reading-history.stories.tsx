import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { LibraryReadingHistory } from "@/registry/plainspoken/blocks/library/reading-history";
import { BASE, HISTORY_ROWS } from "./fixtures";

const meta: Meta<typeof LibraryReadingHistory> = {
  title: "Blocks/Library/Reading history",
  component: LibraryReadingHistory,
  args: { rows: HISTORY_ROWS, basePath: BASE },
};
export default meta;
type Story = StoryObj<typeof LibraryReadingHistory>;

/** Thirty loans over two years: filter by format, sort by days kept, export as CSV. */
export const TwoYears: Story = {};

/** A new card holder. */
export const Empty: Story = { args: { rows: [] } };
