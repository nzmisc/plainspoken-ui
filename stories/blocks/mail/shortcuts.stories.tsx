import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { MailShortcutsDialog } from "@/registry/plainspoken/blocks/mail/shortcuts";

const meta: Meta<typeof MailShortcutsDialog> = {
  title: "Blocks/Mail/Shortcuts dialog",
  component: MailShortcutsDialog,
  // A dialog or drawer open on load would cover the whole docs page: there, each story gets its own frame
  parameters: { layout: "fullscreen", docs: { story: { inline: false, height: "640px" } } },
  args: { open: true, onClose: () => {} },
  decorators: [(S) => <div className="min-h-[640px]">{S()}</div>],
};
export default meta;
type Story = StoryObj<typeof MailShortcutsDialog>;

/** Three groups of single-key shortcuts as keycaps; Escape or Close shuts it. */
export const Open: Story = {};
