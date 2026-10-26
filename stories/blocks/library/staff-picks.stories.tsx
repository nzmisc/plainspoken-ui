import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { LibraryStaffPicks } from "@/registry/plainspoken/blocks/library/staff-picks";
import { BASE, PICKS } from "./fixtures";

const meta: Meta<typeof LibraryStaffPicks> = {
  title: "Blocks/Library/Staff picks",
  component: LibraryStaffPicks,
  args: { picks: PICKS, basePath: BASE },
};
export default meta;
type Story = StoryObj<typeof LibraryStaffPicks>;

/** Four picks, two to a row on wide screens. */
export const Four: Story = {};

/** One pick. */
export const One: Story = { args: { picks: PICKS.slice(0, 1) } };
