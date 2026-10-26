import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { ORDERS } from "@/registry/plainspoken/blocks/grid/data";
import { GridOrderDrawer } from "@/registry/plainspoken/blocks/grid/order-drawer";

const late = ORDERS.find((o) => (o.late ?? 0) >= 3 && o.coupon && o.rating)!;
const fresh = ORDERS.findLast((o) => o.status === "Pending")!;
const noted = ORDERS.find((o) => o.note && o.status === "Delivered")!;

const meta: Meta<typeof GridOrderDrawer> = {
  title: "Blocks/Data grid/Order drawer",
  component: GridOrderDrawer,
  // Open on load: each story gets its own frame in the docs
  parameters: { docs: { story: { inline: false, height: "640px" } } },
  args: { order: late, onClose: () => {} },
};
export default meta;
type Story = StoryObj<typeof GridOrderDrawer>;

/** A delivered order that arrived days late, with a coupon, tracking and a rating. Escape or Close shuts it. */
export const LateDelivery: Story = {};

/** Placed minutes ago: not shipped yet, so no carrier, tracking or lateness. */
export const JustPlaced: Story = { args: { order: fresh } };

/** With a note the customer left at checkout. */
export const WithNote: Story = { args: { order: noted } };

/** Previous and Next walk through a list, as the app does with the table's rows. */
export const PreviousAndNext: Story = {
  render: function Render() {
    const list = ORDERS.slice(-5).reverse();
    const [at, setAt] = useState<number | null>(0);
    return (
      <GridOrderDrawer
        order={at == null ? null : list[at]}
        onClose={() => setAt(null)}
        onPrevious={at ? () => setAt(at - 1) : undefined}
        onNext={at != null && at < list.length - 1 ? () => setAt(at + 1) : undefined}
      />
    );
  },
};

/** On a phone it comes up from the bottom. */
export const Phone: Story = { globals: { viewport: { value: "iphoneSE", isRotated: false } } };
