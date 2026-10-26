import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ORDERS_MODEL, SHOP_MODEL } from "@/registry/plainspoken/blocks/erd/data";
import { ErdDiagram } from "@/registry/plainspoken/blocks/erd/diagram";

/**
 * Drag tables (Shift + click for several, Shift + drag on the background for a box); hover or
 * select one to bring out its relations; click a line for its details; drag the square at the end
 * of a row onto another table's key to connect them. Keyboard: Tab between tables, arrow keys
 * move, Enter opens.
 */
const meta: Meta<typeof ErdDiagram> = {
  title: "Blocks/ERD/Diagram",
  component: ErdDiagram,
  parameters: { layout: "fullscreen" },
  args: { model: SHOP_MODEL, className: "h-[640px]", onConnect: () => {} },
};
export default meta;
type Story = StoryObj<typeof ErdDiagram>;

/** The whole shop database: four schemas in frames, fitted to the view. */
export const Shop: Story = {};

/** A corner of it: customers, orders and payments. */
export const Orders: Story = { args: { model: ORDERS_MODEL } };

/** The simpler notation: 1 and N at the line ends, and curved lines. */
export const LabelsAndCurves: Story = { args: { model: ORDERS_MODEL, display: { notation: "labels", lines: "curved" } } };

/** Tables folded to their keys, no types, no frames. */
export const Compact: Story = {
  args: { display: { types: false, nullability: false, frames: false }, collapsed: SHOP_MODEL.tables.map((t) => t.id) },
};

/** One table selected: its relations stand out, the rest fade. */
export const Selected: Story = { args: { model: ORDERS_MODEL, selected: ["sales.orders"] } };

/** No tables yet. */
export const Empty: Story = { args: { model: { name: "empty", schemas: [], tables: [], relations: [] } } };
