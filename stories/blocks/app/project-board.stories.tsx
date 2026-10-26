import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { AppProjectBoard } from "@/registry/plainspoken/blocks/app/project-board";

const meta: Meta<typeof AppProjectBoard> = {
  title: "Blocks/App skeleton/Project board",
  component: AppProjectBoard,
};
export default meta;
type Story = StoryObj<typeof AppProjectBoard>;

/** Columns by stage, scrolling sideways on narrow screens. */
export const Default: Story = {};

/** The same projects as one table. */
export const List: Story = { args: { defaultView: "list" } };
