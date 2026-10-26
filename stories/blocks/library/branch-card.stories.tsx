import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { LibraryBranchCard } from "@/registry/plainspoken/blocks/library/branch-card";
import { BRANCHES, TODAY } from "./fixtures";

const meta: Meta<typeof LibraryBranchCard> = {
  title: "Blocks/Library/Branch card",
  component: LibraryBranchCard,
  args: { branch: BRANCHES[0], today: TODAY, className: "max-w-md" },
};
export default meta;
type Story = StoryObj<typeof LibraryBranchCard>;

/** Open today, Saturday marked. */
export const Open: Story = {};

/** Closed today for repairs, though Saturday has hours. */
export const ClosedForRepairs: Story = { args: { branch: BRANCHES[3], closedToday: "Floor refinishing" } };

/** Closed on its weekly day off. */
export const DayOff: Story = { args: { branch: BRANCHES[2], today: "2026-10-26" } };
