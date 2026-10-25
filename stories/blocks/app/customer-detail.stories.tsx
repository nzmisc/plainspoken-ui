import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { customerById } from "@/registry/plainspoken/blocks/app/data";
import { AppCustomerDetail } from "@/registry/plainspoken/blocks/app/customer-detail";

const meta: Meta<typeof AppCustomerDetail> = {
  title: "Blocks/App skeleton/Customer detail",
  component: AppCustomerDetail,
  args: { customer: customerById("lumen-dental")! },
};
export default meta;
type Story = StoryObj<typeof AppCustomerDetail>;

/** The overview tab. ←/→ on the tab strip move between tabs. */
export const Overview: Story = {};

/** The invoices tab. */
export const Invoices: Story = { args: { customer: customerById("tidewater-brewing")!, defaultTab: "invoices" } };

/** The projects tab, as cards. */
export const Projects: Story = { args: { customer: customerById("fjord-outdoor")!, defaultTab: "projects" } };

/** A lead with no projects: an empty state. */
export const NoProjects: Story = { args: { customer: customerById("marigold-florists")!, defaultTab: "projects" } };
