import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { AppNewInvoiceDialog } from "@/registry/plainspoken/blocks/app/new-invoice";

const meta: Meta<typeof AppNewInvoiceDialog> = {
  title: "Blocks/App skeleton/New invoice dialog",
  component: AppNewInvoiceDialog,
  args: { open: true, onClose: () => {} },
  // A dialog or drawer open on load would cover the whole docs page: there, each story gets its own frame
  parameters: { layout: "fullscreen", docs: { story: { inline: false, height: "640px" } } },
  decorators: [(S) => <div className="min-h-[760px]">{S()}</div>],
};
export default meta;
type Story = StoryObj<typeof AppNewInvoiceDialog>;

/** Change a quantity or rate: the line, subtotal, VAT and total follow. Add a line, remove one. */
export const Open: Story = {};

/** From a customer's page: that customer chosen. */
export const ForACustomer: Story = { args: { customerId: "fjord-outdoor" } };
