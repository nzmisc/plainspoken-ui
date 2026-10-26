import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { AppPageHeader } from "@/registry/plainspoken/blocks/app/page-header";
import { Badge } from "@/registry/plainspoken/ui/badge";
import { Button } from "@/registry/plainspoken/ui/button";

const meta: Meta<typeof AppPageHeader> = {
  title: "Blocks/App skeleton/Page header",
  component: AppPageHeader,
  args: { crumbs: [{ label: "Brightwater Studio", href: "/demos/app" }, { label: "Customers", href: "/demos/app/customers" }, { label: "Fjord Outdoor" }], title: "Fjord Outdoor" },
};
export default meta;
type Story = StoryObj<typeof AppPageHeader>;

/** Breadcrumb, title, badge, description and buttons. */
export const Full: Story = {
  args: {
    badge: <Badge variant="success">Active</Badge>,
    description: "Ingrid Solberg · Bergen, Norway · customer since 3 Mar 2025",
    actions: (
      <>
        <Button>Edit</Button>
        <Button variant="primary">New invoice</Button>
      </>
    ),
  },
};

/** Just the trail and the title. */
export const Plain: Story = {};

/** A long title wraps; the buttons go under it on narrow screens. */
export const LongTitle: Story = { args: { title: "Oakridge Public Library, reading festival 2026 posters and programme", actions: <Button variant="primary">New invoice</Button> } };
