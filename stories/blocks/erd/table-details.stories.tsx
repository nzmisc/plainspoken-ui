import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { SHOP_MODEL } from "@/registry/plainspoken/blocks/erd/data";
import { ErdTableDetails } from "@/registry/plainspoken/blocks/erd/table-details";
import Editable from "@/registry/plainspoken/examples/erd-table-details-demo";

/** Name: Enter or leaving the field saves, Escape puts it back. Each column's ⋯ opens a menu (↓ and Enter work on it). */
const meta: Meta<typeof ErdTableDetails> = {
  title: "Blocks/ERD/Table details",
  component: ErdTableDetails,
  args: { model: SHOP_MODEL, tableId: "sales.orders", onShowRelation: () => {}, onSelectTable: () => {}, onClose: () => {}, className: "h-[40rem] w-[25rem] border border-border" },
  argTypes: { model: { control: false } },
};
export default meta;
type Story = StoryObj<typeof ErdTableDetails>;

/** Read-only (no onModelChange): columns, indexes and both lists of relations. */
export const ReadOnly: Story = {};

/** Editable, as in the app. */
export const EditableStory: Story = { name: "Editable", render: () => <Editable /> };

/** A table nobody references, with a composite key. */
export const JoinTable: Story = { args: { tableId: "auth.user_roles" } };

/** A table that references itself. */
export const SelfReference: Story = { args: { tableId: "catalog.categories" } };
