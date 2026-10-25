import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { MAIL_NOW, MAIL_TODAY, THREADS } from "@/registry/plainspoken/blocks/mail/data";
import { MailActions } from "@/registry/plainspoken/blocks/mail/actions";

const one = (id: string) => THREADS.filter((t) => t.id === id);

const meta: Meta<typeof MailActions> = {
  title: "Blocks/Mail/Conversation actions",
  component: MailActions,
  args: { threads: one("catalogue"), view: "inbox", today: MAIL_TODAY, now: MAIL_NOW },
  decorators: [(S) => <div className="ctl-sm">{S()}</div>],
};
export default meta;
type Story = StoryObj<typeof MailActions>;

/** With words. Snooze offers times from the demo's Saturday morning; Label's items are checkboxes and leave the menu open. */
export const Playground: Story = {};

/** Icons only, each named and titled: the reading pane's toolbar. */
export const Compact: Story = { args: { compact: true } };

/** In Archive: Move to Inbox. */
export const Archive: Story = { args: { view: "archive", threads: one("kickoff") } };

/** In Trash: Delete forever, in red. */
export const Trash: Story = { args: { view: "trash", threads: one("trash-lunch") } };

/** In Spam: Not spam. */
export const Spam: Story = { args: { view: "spam", threads: one("spam-prize") } };

/** Snoozed: Move to Inbox, and Unsnooze in the Snooze menu. */
export const Snoozed: Story = { args: { view: "snoozed", threads: one("insurance") } };

/** The Snooze menu open. */
export const SnoozeMenu: Story = {
  args: { compact: true },
  play: async ({ canvasElement }) => {
    canvasElement.querySelector<HTMLButtonElement>('button[aria-label="Snooze"]')?.click();
  },
};
