import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { AppNewInvoiceDialog } from "@/registry/plainspoken/blocks/app/new-invoice";

const meta: Meta<typeof AppNewInvoiceDialog> = {
  title: "Blocks/App skeleton/New invoice dialog",
  component: AppNewInvoiceDialog,
  args: { open: true, onClose: () => {} },
  parameters: { layout: "fullscreen" },
  decorators: [(S) => <div className="min-h-[760px]">{S()}</div>],
};
export default meta;
type Story = StoryObj<typeof AppNewInvoiceDialog>;

/** Change a quantity or rate: the line, subtotal, VAT and total follow. Add a line, remove one. */
export const Open: Story = {};

/** From a customer's page: that customer chosen. */
export const ForACustomer: Story = { args: { customerId: "fjord-outdoor" } };
