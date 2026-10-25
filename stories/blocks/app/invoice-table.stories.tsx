import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { INVOICES } from "@/registry/plainspoken/blocks/app/data";
import { AppInvoiceTable } from "@/registry/plainspoken/blocks/app/invoice-table";

const meta: Meta<typeof AppInvoiceTable> = {
  title: "Blocks/App skeleton/Invoice table",
  component: AppInvoiceTable,
  args: { invoices: INVOICES.slice(0, 8) },
};
export default meta;
type Story = StoryObj<typeof AppInvoiceTable>;

/** With the customer column, linking to each customer. */
export const WithCustomers: Story = {};

/** On a customer's page: what each invoice was for instead of the customer. */
export const ForOneCustomer: Story = { args: { invoices: INVOICES.filter((i) => i.customer === "tidewater-brewing"), showCustomer: false } };

/** Overdue invoices say how late they are. */
export const Overdue: Story = { args: { invoices: INVOICES.filter((i) => i.status === "Overdue") } };

/** None. */
export const Empty: Story = { args: { invoices: [] } };
