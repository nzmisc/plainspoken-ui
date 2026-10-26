import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { SHOP_MODEL } from "@/registry/plainspoken/blocks/erd/data";
import { tableById } from "@/registry/plainspoken/blocks/erd/model";
import { ErdColumnDialog } from "@/registry/plainspoken/blocks/erd/column-dialog";

/** Focus starts in the name. A bad name is explained when saving. */
const meta: Meta<typeof ErdColumnDialog> = {
  title: "Blocks/ERD/Column dialog",
  component: ErdColumnDialog,
  // A dialog open on load would cover the whole docs page: there, each story gets its own frame
  parameters: { layout: "fullscreen", docs: { story: { inline: false, height: "640px" } } },
  args: { open: true, onClose: () => {}, onSave: () => {}, onDelete: () => {}, model: SHOP_MODEL, tableId: "sales.orders" },
  argTypes: { model: { control: false }, column: { control: false } },
  decorators: [(S) => <div className="min-h-[640px]">{S()}</div>],
};
export default meta;
type Story = StoryObj<typeof ErdColumnDialog>;

/** A new column. */
export const New: Story = { args: { column: null } };

/** Editing orders.status: a default and a comment, with Delete. */
export const Edit: Story = { args: { column: tableById(SHOP_MODEL, "sales.orders")!.columns.find((c) => c.name === "status")! } };

/** A type that isn't in the list keeps its own entry. */
export const OtherType: Story = { args: { column: { name: "location", type: "point", comment: "Longitude and latitude" } } };
