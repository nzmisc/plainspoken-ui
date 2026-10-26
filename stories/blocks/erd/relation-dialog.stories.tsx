import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { SHOP_MODEL } from "@/registry/plainspoken/blocks/erd/data";
import { ErdRelationDialog } from "@/registry/plainspoken/blocks/erd/relation-dialog";

/** Only primary keys and unique columns are offered as the referenced side. */
const meta: Meta<typeof ErdRelationDialog> = {
  title: "Blocks/ERD/Relationship dialog",
  component: ErdRelationDialog,
  // A dialog open on load would cover the whole docs page: there, each story gets its own frame
  parameters: { layout: "fullscreen", docs: { story: { inline: false, height: "640px" } } },
  args: { open: true, onClose: () => {}, onSave: () => {}, model: SHOP_MODEL, tableId: "sales.refunds" },
  argTypes: { model: { control: false } },
  decorators: [(S) => <div className="min-h-[640px]">{S()}</div>],
};
export default meta;
type Story = StoryObj<typeof ErdRelationDialog>;

/** From refunds.reason (text): it says the type will change to match the key. */
export const TypeChange: Story = { args: { defaultColumn: "reason" } };

/** A pair that's already connected: it says so. */
export const AlreadyThere: Story = { args: { defaultColumn: "payment_id" } };
