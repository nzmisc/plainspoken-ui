import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { LibraryHoursToday } from "@/registry/plainspoken/blocks/library/hours-today";
import { BASE, BRANCHES, TODAY } from "./fixtures";

const meta: Meta<typeof LibraryHoursToday> = {
  title: "Blocks/Library/Hours today",
  component: LibraryHoursToday,
  args: { branches: BRANCHES, date: TODAY, closed: { "oak-hill": "Floor refinishing" }, href: `${BASE}/branches`, className: "max-w-sm" },
};
export default meta;
type Story = StoryObj<typeof LibraryHoursToday>;

/** A Saturday with one branch shut for repairs. */
export const Saturday: Story = {};

/** A Monday: two branches keep no Monday hours. */
export const Monday: Story = { args: { date: "2026-10-26", closed: {} } };

/** A public holiday: closed everywhere. */
export const Holiday: Story = { args: { date: "2026-11-11", closed: Object.fromEntries(BRANCHES.map((b) => [b.id, "Veterans Day"])) } };
