import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { AppNewCustomerDialog } from "@/registry/plainspoken/blocks/app/new-customer";

const meta: Meta<typeof AppNewCustomerDialog> = {
  title: "Blocks/App skeleton/New customer dialog",
  component: AppNewCustomerDialog,
  args: { open: true, onClose: () => {} },
  // A dialog or drawer open on load would cover the whole docs page: there, each story gets its own frame
  parameters: { layout: "fullscreen", docs: { story: { inline: false, height: "640px" } } },
  decorators: [(S) => <div className="min-h-[720px]">{S()}</div>],
};
export default meta;
type Story = StoryObj<typeof AppNewCustomerDialog>;

/** "A person" drops the company field. Escape or Cancel closes it; a click outside doesn't. */
export const Open: Story = {};

/** On a phone it fills the screen. */
export const Phone: Story = { globals: { viewport: { value: "iphoneSE", isRotated: false } } };
