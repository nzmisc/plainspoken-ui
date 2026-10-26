import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { AppInvoiceTabs } from "@/registry/plainspoken/blocks/app/invoice-tabs";

const meta: Meta<typeof AppInvoiceTabs> = {
  title: "Blocks/App skeleton/Invoice tabs",
  component: AppInvoiceTabs,
};
export default meta;
type Story = StoryObj<typeof AppInvoiceTabs>;

/** All invoices, with page links under the table. ←/→ move between the tabs. */
export const All: Story = {};

/** The Overdue tab, one page. */
export const Overdue: Story = { args: { defaultTab: "overdue" } };
