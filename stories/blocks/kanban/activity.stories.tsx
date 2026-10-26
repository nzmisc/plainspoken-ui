import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { CARDS_BY_ID } from "@/registry/plainspoken/blocks/kanban/data";
import { KanbanActivity } from "@/registry/plainspoken/blocks/kanban/activity";

const meta: Meta<typeof KanbanActivity> = {
  title: "Blocks/Kanban/Activity",
  component: KanbanActivity,
  args: { entries: CARDS_BY_ID["FA-110"].activity },
  decorators: [(S) => <div className="max-w-xl">{S()}</div>],
};
export default meta;
type Story = StoryObj<typeof KanbanActivity>;

/** Thirteen things that happened to the seat map card, newest first: moves, files, labels, ticks, the cover. */
export const Default: Story = {};

/** A card just made. */
export const New: Story = { args: { entries: CARDS_BY_ID["FA-137"].activity } };

/** Nothing recorded. */
export const Empty: Story = { args: { entries: [] } };
