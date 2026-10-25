import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { NextLink } from "@/registry/plainspoken/lib/next-link";
import { ChevronRight } from "@/registry/plainspoken/lib/icons";
import { Breadcrumb } from "@/registry/plainspoken/ui/breadcrumb";
import { Icon } from "@/registry/plainspoken/ui/icon";

const LONG = [
  { label: "Drive", href: "#drive" },
  { label: "Shared with me", href: "#shared" },
  { label: "Studio Kranich", href: "#studio" },
  { label: "Clients", href: "#clients" },
  { label: "Bäckerei Hoffmann", href: "#hoffmann" },
  { label: "2026 rebrand", href: "#rebrand" },
  { label: "Logo drafts" },
];

const meta = {
  title: "Components/Navigation/Breadcrumb",
  component: Breadcrumb,
  args: {
    items: [{ label: "Home", href: "#home" }, { label: "Settings", href: "#settings" }, { label: "Billing" }],
    maxItems: 5,
  },
  argTypes: { separator: { control: false }, linkAs: { control: false } },
} satisfies Meta<typeof Breadcrumb>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/**
 * Past maxItems the middle folds into "…". Tab to it and press Enter: the rest appear and focus
 * moves to the first one revealed.
 */
export const Long: Story = { args: { items: LONG, separator: <Icon icon={ChevronRight} /> } };

/** A level with no page of its own (no href) is plain gray text. */
export const WithoutLinks: Story = {
  args: { items: [{ label: "Workspace", href: "#ws" }, { label: "Archive" }, { label: "2024" }, { label: "Q3 report" }] },
};

/** linkAs={NextLink} (the next-link item): next/link draws the links, for client-side navigation. */
export const RouterLinks: Story = { args: { items: LONG.slice(0, 3), linkAs: NextLink } };

/** Long labels truncate; at phone width the trail wraps. */
export const Narrow: Story = {
  args: { items: LONG, maxItems: 10 },
  decorators: [(S) => <div className="w-[300px] border border-dashed border-border p-1"><S /></div>],
};
