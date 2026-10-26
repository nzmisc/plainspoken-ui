import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { CARDS_BY_ID, KANBAN_TODAY } from "@/registry/plainspoken/blocks/kanban/data";
import { KanbanCard } from "@/registry/plainspoken/blocks/kanban/card";

const card = (id: string) => CARDS_BY_ID[id];

const meta: Meta<typeof KanbanCard> = {
  title: "Blocks/Kanban/Card",
  component: KanbanCard,
  args: { card: card("FA-110"), today: KANBAN_TODAY, onOpen: () => {}, menu: [{ label: "Open card" }, { label: "Move to" }, { type: "separator" }, { label: "Archive card" }] },
  argTypes: { card: { control: false }, menu: { control: false } },
  decorators: [(S) => <div className="w-72">{S()}</div>],
};
export default meta;
type Story = StoryObj<typeof KanbanCard>;

/**
 * A card with a cover picture, two labels, a due date, checklist progress, files, comments and two
 * people. Hover it (or focus it) for the ⋯ menu; Enter or a click opens it.
 */
export const WithCover: Story = {};

/** Overdue: the date is red, bold and marked with a symbol, and a screen reader hears "Overdue". */
export const Overdue: Story = { args: { card: card("FA-112") } };

/** Due tomorrow: amber, with a clock. Today, tomorrow and the day after count as due soon. */
export const DueSoon: Story = { args: { card: card("FA-121") } };

/** A long title wraps; nothing is cut off. */
export const LongTitle: Story = { args: { card: card("FA-145") } };

/** Nothing on it but a title, a label and a priority: no attachments, comments, checklist or people. */
export const NoAttachments: Story = { args: { card: card("FA-137") } };

/** A finished card: the date it was due is no longer marked as late. */
export const Done: Story = { args: { card: card("FA-097"), done: true } };

/** Checklist complete: the count turns green with a ticked box. */
export const ChecklistDone: Story = { args: { card: card("FA-106") } };

/** Picked up from the keyboard: outlined in the main colour until dropped. */
export const PickedUp: Story = { args: { card: card("FA-121"), dragState: "lifted" } };

/** The place a card left while the pointer carries it: dashed and faded. */
export const LeftBehind: Story = { args: { card: card("FA-121"), dragState: "ghost" } };

/** The copy under the pointer while dragging: the one place a card has a shadow, as a floating layer. */
export const UnderThePointer: Story = { args: { card: card("FA-121"), dragState: "overlay" } };

/** Just dropped: outlined for a moment. */
export const JustDropped: Story = { args: { card: card("FA-121"), landed: true } };

/** Without onOpen and menu: a plain picture of a card, not a control. */
export const Static: Story = { args: { card: card("FA-118"), onOpen: undefined, menu: undefined } };

/** Six people on it: three round avatars and "+3", which names the rest on hover. Fourteen comments. */
export const ManyPeople: Story = { args: { card: card("FA-119") } };
