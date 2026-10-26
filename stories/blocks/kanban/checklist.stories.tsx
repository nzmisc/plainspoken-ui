import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { CARDS_BY_ID } from "@/registry/plainspoken/blocks/kanban/data";
import { KanbanChecklist } from "@/registry/plainspoken/blocks/kanban/checklist";

const meta: Meta<typeof KanbanChecklist> = {
  title: "Blocks/Kanban/Checklist",
  component: KanbanChecklist,
  args: { defaultItems: CARDS_BY_ID["FA-124"].checklist },
  decorators: [(S) => <div className="max-w-lg">{S()}</div>],
};
export default meta;
type Story = StoryObj<typeof KanbanChecklist>;

/** Two of six done. Tick items, remove one with × (focus moves to the next), add one at the foot. */
export const Default: Story = {};

/** Every item done: the count turns green. */
export const AllDone: Story = { args: { defaultItems: CARDS_BY_ID["FA-106"].checklist } };

/** No items yet: a sentence, and the box to add the first. */
export const Empty: Story = { args: { defaultItems: [] } };

/** Read only: no ticking, removing or adding. */
export const ReadOnly: Story = { args: { readOnly: true } };
