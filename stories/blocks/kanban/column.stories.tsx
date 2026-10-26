import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { CARDS_BY_ID, COLUMNS, KANBAN_TODAY } from "@/registry/plainspoken/blocks/kanban/data";
import { KanbanCard } from "@/registry/plainspoken/blocks/kanban/card";
import { KanbanColumn } from "@/registry/plainspoken/blocks/kanban/column";

const column = (id: string) => COLUMNS.find((c) => c.id === id)!;
const cardsOf = (ids: string[]) =>
  ids.map((id) => (
    <li key={id}>
      <KanbanCard card={CARDS_BY_ID[id]} today={KANBAN_TODAY} onOpen={() => {}} />
    </li>
  ));

const meta: Meta<typeof KanbanColumn> = {
  title: "Blocks/Kanban/Column",
  component: KanbanColumn,
  args: { column: column("review"), onAddCard: () => {}, menu: [{ label: "Add card" }, { label: "Sort" }, { type: "separator" }, { label: "Archive all cards" }] },
  argTypes: { column: { control: false }, menu: { control: false }, children: { control: false } },
  render: (args) => (
    <div className="flex h-[600px]">
      <KanbanColumn {...args}>{cardsOf(args.column.cardIds)}</KanbanColumn>
    </div>
  ),
};
export default meta;
type Story = StoryObj<typeof KanbanColumn>;

/** Review, at its limit of three: the count and "max 3" in grey. */
export const AtTheLimit: Story = {};

/** In progress, over its limit: an amber top edge, a "4 / 3" badge with a symbol, and a line saying so. */
export const OverTheLimit: Story = { args: { column: column("doing") } };

/** No limit: just the count. The list scrolls on its own when it is longer than the column. */
export const NoLimit: Story = { args: { column: column("backlog") } };

/** Nothing in it: a dashed box, where a dragged card can be dropped. */
export const Empty: Story = { args: { column: { id: "blocked", title: "Blocked", limit: 2, cardIds: [] }, emptyDescription: "Drag a card here, or add one." } };

/** Empty while a card is dragged over it: the box is outlined in the main colour. */
export const EmptyDropTarget: Story = { args: { ...Empty.args, dropHere: true } };

/** A filter hides some cards: the count says "1 of 3". */
export const Filtered: Story = {
  args: { shown: 1 },
  render: (args) => (
    <div className="flex h-[600px]">
      <KanbanColumn {...args}>{cardsOf(["FA-108"])}</KanbanColumn>
    </div>
  ),
};

/** The new-card box open at the foot: Enter adds, Shift+Enter is a new line, Escape closes. */
export const Adding: Story = { args: { defaultAdding: true } };
