import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { KanbanToolbar } from "@/registry/plainspoken/blocks/kanban/toolbar";
import { PEOPLE, TEAM } from "@/registry/plainspoken/blocks/kanban/data";

const meta: Meta<typeof KanbanToolbar> = {
  title: "Blocks/Kanban/Board toolbar",
  component: KanbanToolbar,
  args: { total: 28, people: PEOPLE.filter((p) => TEAM.includes(p.id)) },
};
export default meta;
type Story = StoryObj<typeof KanbanToolbar>;

/** Nothing set: search, the two filter buttons, My cards, and the count. Press / on the board page to jump to the search. */
export const Default: Story = {};

/**
 * Everything set: a search, two people (each also a removable chip), a label, My cards, and a
 * board member chosen from the header ("Cards with …"). Clear filters takes it all off.
 */
export const Filtered: Story = {
  args: { shown: 3, defaultFilter: { query: "seat", people: ["hana", "kwame"], labels: ["frontend"], mine: true, involved: "niamh" } },
};

/** On a phone the search takes the whole first line. */
export const Phone: Story = { globals: { viewport: { value: "iphoneSE", isRotated: false } }, args: { shown: 6, defaultFilter: { query: "", people: ["hana"], labels: [], mine: false } } };
