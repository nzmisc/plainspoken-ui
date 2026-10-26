import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { LibraryResultsBar } from "@/registry/plainspoken/blocks/library/results-bar";

const meta: Meta<typeof LibraryResultsBar> = {
  title: "Blocks/Library/Results bar",
  component: LibraryResultsBar,
  args: { total: 64, from: 1, to: 20, query: "ocean" },
};
export default meta;
type Story = StoryObj<typeof LibraryResultsBar>;

export const Playground: Story = {};

/** Filters as chips: remove one with its ×, or all at once. */
export const WithFilters: Story = { args: { filters: ["Format: Book", "Audience: Teen", "Available now"] } };

/** Browsing everything, newest first. */
export const Browsing: Story = { args: { query: undefined, total: 193, defaultSort: "added" } };

/** Nothing matched. */
export const NoResults: Story = { args: { total: 0, from: 0, to: 0, query: "dinosaurs in space" } };
