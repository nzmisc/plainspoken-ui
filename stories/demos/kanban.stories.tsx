import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { KanbanApp } from "@/registry/plainspoken/blocks/kanban/kanban-app";

const meta: Meta<typeof KanbanApp> = {
  title: "Demos/Kanban",
  component: KanbanApp,
  // A dialog or drawer open on load would cover the whole docs page: there, each story gets its own frame
  parameters: { layout: "fullscreen", docs: { story: { inline: false, height: "760px" } } },
  args: { className: "h-dvh" },
};
export default meta;
type Story = StoryObj<typeof KanbanApp>;

/** The demo as it is at /demos/kanban: Corkboard, with the Saltmarsh Ferries app team's board for release 3.2. */
export const Board: Story = {};

/** A card open, as when the address has ?card=FA-110. */
export const CardOpen: Story = { args: { defaultOpenCardId: "FA-110" } };

/** On a phone: the board. */
export const Phone: Story = { globals: { viewport: { value: "iphoneSE", isRotated: false } } };

/** On a phone, a card open. */
export const PhoneCard: Story = { globals: { viewport: { value: "iphoneSE", isRotated: false } }, args: { defaultOpenCardId: "FA-119" } };
