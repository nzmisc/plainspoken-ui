import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { AppInvoiceStatusChart } from "@/registry/plainspoken/blocks/app/invoice-status-chart";

const meta: Meta<typeof AppInvoiceStatusChart> = {
  title: "Blocks/App skeleton/Invoices by state",
  component: AppInvoiceStatusChart,
  decorators: [(S) => <div className="max-w-sm">{S()}</div>],
};
export default meta;
type Story = StoryObj<typeof AppInvoiceStatusChart>;

/** The ring, the amount owed in the hole, and every part written out. */
export const Default: Story = {};
