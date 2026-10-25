import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { customerById } from "@/registry/plainspoken/blocks/app/data";
import { AppCustomerDrawer } from "@/registry/plainspoken/blocks/app/customer-drawer";

const meta: Meta<typeof AppCustomerDrawer> = {
  title: "Blocks/App skeleton/Customer drawer",
  component: AppCustomerDrawer,
  args: { customer: customerById("harbor-coffee")!, onClose: () => {} },
  // A dialog or drawer open on load would cover the whole docs page: there, each story gets its own frame
  parameters: { layout: "fullscreen", docs: { story: { inline: false, height: "640px" } } },
  decorators: [(S) => <div className="min-h-[720px]">{S()}</div>],
};
export default meta;
type Story = StoryObj<typeof AppCustomerDrawer>;

/** A customer who owes something. */
export const Active: Story = {};

/** A lead: nothing invoiced yet. */
export const Lead: Story = { args: { customer: customerById("copperleaf-tea")! } };

/** On a phone: a sheet from the bottom. */
export const Phone: Story = { globals: { viewport: { value: "iphoneSE", isRotated: false } } };
