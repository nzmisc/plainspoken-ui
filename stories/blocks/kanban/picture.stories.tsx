import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { KanbanPicture } from "@/registry/plainspoken/blocks/kanban/picture";

const meta: Meta<typeof KanbanPicture> = {
  title: "Blocks/Kanban/Stand-in pictures",
  component: KanbanPicture,
  args: { kind: "seat-map", className: "h-24 w-72 border border-border" },
  argTypes: { kind: { control: "select", options: ["seat-map", "screens", "form", "map", "icons", "chart"] } },
};
export default meta;
type Story = StoryObj<typeof KanbanPicture>;

/** One picture at a card cover's size; pick another kind in the controls. */
export const Playground: Story = {};

/** Every kind, as covers. They are drawn in the chart colours, so dark mode needs nothing. */
export const All: Story = {
  render: (args) => (
    <div className="grid max-w-3xl grid-cols-3 gap-3">
      {(["seat-map", "screens", "form", "map", "icons", "chart"] as const).map((kind) => (
        <KanbanPicture key={kind} {...args} kind={kind} className="h-24 w-full border border-border" />
      ))}
    </div>
  ),
};

/** Large, as in the preview dialog: it crops to fill its box. */
export const Large: Story = { args: { kind: "map", label: "Route map with the three ports", className: "aspect-[2/1] w-full max-w-2xl border border-border" } };
