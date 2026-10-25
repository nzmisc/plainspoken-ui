import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { CARDS_BY_ID, COLUMNS, KANBAN_TODAY, ME } from "@/registry/plainspoken/blocks/kanban/data";
import { matchesFilter } from "@/registry/plainspoken/blocks/kanban/format";
import { KanbanBoard } from "@/registry/plainspoken/blocks/kanban/board";

const meta: Meta<typeof KanbanBoard> = {
  title: "Blocks/Kanban/Board",
  component: KanbanBoard,
  parameters: { layout: "fullscreen" },
  args: { defaultColumns: COLUMNS, cards: CARDS_BY_ID, today: KANBAN_TODAY, onOpen: () => {}, cardMenu: () => [], className: "h-[720px]" },
  argTypes: { defaultColumns: { control: false }, cards: { control: false }, columns: { control: false } },
};
export default meta;
type Story = StoryObj<typeof KanbanBoard>;

/**
 * The demo board keeping its own columns. Drag cards with the mouse (or touch and hold on a
 * phone); the board scrolls when a card nears its edge. Tab to the cards, arrows between them,
 * Space to pick one up, arrows to carry it, Space to drop, Escape to put it back.
 */
export const Default: Story = {};

/** Mid-drag with the pointer: the card's place is dashed, its copy is under the pointer, and a line shows where it lands. */
export const Dragging: Story = { args: { defaultDrag: { cardId: "FA-121", to: { columnId: "review", index: 1 }, mode: "pointer" } } };

/** Picked up from the keyboard and carried to In progress: it moves as the arrows are pressed, outlined until dropped. */
export const PickedUpWithKeys: Story = { args: { defaultDrag: { cardId: "FA-121", to: { columnId: "doing", index: 2 }, mode: "keyboard" } } };

/** Dragged towards an empty column: its dashed box is outlined. */
export const OntoAnEmptyColumn: Story = {
  args: {
    defaultColumns: COLUMNS.map((c) => (c.id === "review" ? { ...c, cardIds: [] } : c)),
    defaultDrag: { cardId: "FA-117", to: { columnId: "review", index: 0 }, mode: "pointer" },
  },
};

/** A filter on (cards with the Accessibility label): counts read "1 of 4", and moves keep the hidden cards in place. */
export const Filtered: Story = { args: { filter: (c) => matchesFilter(c, { query: "", people: [], labels: ["a11y"], mine: false }, ME) } };

/** A phone: one column to a screen, snapping as you swipe; touch and hold a card to drag it. */
export const Phone: Story = { globals: { viewport: { value: "iphoneSE", isRotated: false } }, args: { className: "h-dvh" } };
