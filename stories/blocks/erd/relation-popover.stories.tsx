import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { pointAnchor } from "@/registry/plainspoken/lib/position";
import { SHOP_MODEL } from "@/registry/plainspoken/blocks/erd/data";
import { ErdRelationPopover } from "@/registry/plainspoken/blocks/erd/relation-popover";
import Demo from "@/registry/plainspoken/examples/erd-relation-popover-demo";

/** Escape or a click outside closes it. */
const meta: Meta<typeof ErdRelationPopover> = {
  title: "Blocks/ERD/Relationship popover",
  component: ErdRelationPopover,
  // A popover open on load would sit over the docs page: there, each story gets its own frame
  parameters: { docs: { story: { inline: false, height: "420px" } } },
  args: { model: SHOP_MODEL, anchor: pointAnchor(220, 40), onClose: () => {}, onChange: () => {}, onDelete: () => {}, onShowTable: () => {} },
  argTypes: { model: { control: false }, anchor: { control: false } },
};
export default meta;
type Story = StoryObj<typeof ErdRelationPopover>;

/** Many orders to one customer, ON DELETE RESTRICT. */
export const ManyToOne: Story = { args: { relationId: "orders_customer_id_fkey" } };

/** A nullable foreign key: zero or one at the referenced end. */
export const Optional: Story = { args: { relationId: "orders_shipping_address_id_fkey" } };

/** One to one: the foreign key is unique. */
export const OneToOne: Story = { args: { relationId: "customers_user_id_fkey", notation: "labels" } };

/** A composite foreign key, read-only (no onChange, no onDelete). */
export const Composite: Story = { args: { relationId: "stock_movements_warehouse_id_variant_id_fkey", onChange: undefined, onDelete: undefined } };

/** Opened from a button, as in the docs. */
export const FromAButton: Story = { render: () => <Demo />, parameters: { docs: { story: { inline: true } } } };
