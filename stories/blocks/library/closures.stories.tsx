import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { LibraryClosures } from "@/registry/plainspoken/blocks/library/closures";
import { CLOSURE_ROWS, TODAY } from "./fixtures";

const meta: Meta<typeof LibraryClosures> = {
  title: "Blocks/Library/Closures",
  component: LibraryClosures,
  args: { closures: CLOSURE_ROWS, today: TODAY, until: "2027-01-31" },
};
export default meta;
type Story = StoryObj<typeof LibraryClosures>;

/** This month: one branch closed all week. */
export const October: Story = {};

/** November: a holiday, a training day and Thanksgiving. Switch to List for the table. */
export const November: Story = { args: { month: "2026-11-01" } };

/** On a phone the day cells show dots instead of words. */
export const Phone: Story = { args: { month: "2026-11-01" }, globals: { viewport: { value: "iphoneSE", isRotated: false } } };
