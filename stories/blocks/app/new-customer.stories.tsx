import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { AppNewCustomerDialog } from "@/registry/plainspoken/blocks/app/new-customer";

const meta: Meta<typeof AppNewCustomerDialog> = {
  title: "Blocks/App skeleton/New customer dialog",
  component: AppNewCustomerDialog,
  args: { open: true, onClose: () => {} },
  parameters: { layout: "fullscreen" },
  decorators: [(S) => <div className="min-h-[720px]">{S()}</div>],
};
export default meta;
type Story = StoryObj<typeof AppNewCustomerDialog>;

/** "A person" drops the company field. Escape or Cancel closes it; a click outside doesn't. */
export const Open: Story = {};

/** On a phone it fills the screen. */
export const Phone: Story = { globals: { viewport: { value: "iphoneSE", isRotated: false } } };
