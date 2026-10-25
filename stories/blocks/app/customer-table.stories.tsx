import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { AppCustomerTable } from "@/registry/plainspoken/blocks/app/customer-table";

const meta: Meta<typeof AppCustomerTable> = {
  title: "Blocks/App skeleton/Customer table",
  // A dialog or drawer open on load would cover the whole docs page: there, each story gets its own frame
  parameters: { docs: { story: { inline: false, height: "640px" } } },
  component: AppCustomerTable,
};
export default meta;
type Story = StoryObj<typeof AppCustomerTable>;

/** Click a row (or Tab to a name and press Enter) for the drawer. Filter, sort (shift-click for more keys), pick columns, export. */
export const Default: Story = {};

/** Two ticked: the selection bar with its bulk action. */
export const Selected: Story = { args: { defaultSelected: ["northwind-cycles", "meridian-architects"] } };

/** With a customer's drawer open. */
export const DrawerOpen: Story = { args: { defaultOpen: "harbor-coffee" } };
