import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { MailShortcutsDialog } from "@/registry/plainspoken/blocks/mail/shortcuts";

const meta: Meta<typeof MailShortcutsDialog> = {
  title: "Blocks/Mail/Shortcuts dialog",
  component: MailShortcutsDialog,
  parameters: { layout: "fullscreen" },
  args: { open: true, onClose: () => {} },
  decorators: [(S) => <div className="min-h-[640px]">{S()}</div>],
};
export default meta;
type Story = StoryObj<typeof MailShortcutsDialog>;

/** Three groups of single-key shortcuts as keycaps; Escape or Close shuts it. */
export const Open: Story = {};
