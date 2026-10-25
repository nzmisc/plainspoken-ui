import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useEffect } from "react";
import { KanbanApp } from "@/registry/plainspoken/blocks/kanban/kanban-app";
import { Toaster, toast } from "@/registry/plainspoken/ui/toast";

const meta: Meta<typeof KanbanApp> = {
  title: "Blocks/Kanban/Kanban app",
  component: KanbanApp,
  // Some stories open the card dialog on load: in the docs each story gets its own frame
  parameters: { layout: "fullscreen", docs: { story: { inline: false, height: "760px" } } },
  args: { className: "h-[760px]" },
};
export default meta;
type Story = StoryObj<typeof KanbanApp>;

/**
 * The board: drag cards between columns, filter them, open one. The five members shown are the
 * most recently active; "+35" lists all forty, and choosing someone shows the cards they are on.
 */
export const Board: Story = {};

/** A card open over the board. */
export const CardOpen: Story = { args: { defaultOpenCardId: "FA-110" } };

/** A busy card open: six people assigned, 23 participants, 14 comments. */
export const BusyCardOpen: Story = { args: { defaultOpenCardId: "FA-119" } };

/** Filtered to your own cards. */
export const MyCards: Story = { args: { defaultFilter: { query: "", people: [], labels: [], mine: true } } };

/** A card being carried by the pointer, from To do towards Review. */
export const Dragging: Story = { args: { defaultDrag: { cardId: "FA-121", to: { columnId: "review", index: 1 }, mode: "pointer" } } };

function ArchivedToast() {
  useEffect(() => {
    const id = toast({ title: "Card archived", description: "FA-129, Write the release notes for 3.2", action: { label: "Undo", onClick: () => {} }, duration: 0 });
    return () => toast.dismiss(id);
  }, []);
  return <Toaster />;
}

/** What archiving says: a toast with Undo. */
export const Archived: Story = {
  render: (args) => (
    <>
      <KanbanApp {...args} />
      <ArchivedToast />
    </>
  ),
};

/** A phone: one column to a screen. */
export const Phone: Story = { globals: { viewport: { value: "iphoneSE", isRotated: false } }, args: { className: "h-dvh" } };

/** A phone with a card open: a drawer the height of the screen. */
export const PhoneCard: Story = { globals: { viewport: { value: "iphoneSE", isRotated: false } }, args: { className: "h-dvh", defaultOpenCardId: "FA-121" } };
