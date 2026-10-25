import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { CONTACTS, MAIL_NOW, MAIL_TODAY, THREADS } from "@/registry/plainspoken/blocks/mail/data";
import { MailThreadView } from "@/registry/plainspoken/blocks/mail/thread";

const thread = (id: string) => THREADS.find((t) => t.id === id)!;

const meta: Meta<typeof MailThreadView> = {
  title: "Blocks/Mail/Reading pane",
  component: MailThreadView,
  args: { thread: thread("catalogue"), view: "inbox", today: MAIL_TODAY, now: MAIL_NOW, contacts: CONTACTS, backLabel: "Inbox", onBack: () => {} },
  decorators: [(S) => <div className="max-w-3xl border border-border">{S()}</div>],
};
export default meta;
type Story = StoryObj<typeof MailThreadView>;

/**
 * An unread conversation: everything since your own last message is open. Hover (or focus) a
 * sender's name for their card. "Show quoted text" unfolds the message being answered.
 */
export const Unread: Story = { args: { position: { index: 0, total: 18, onOlder: () => {} } } };

/** A long read conversation: the middle folds into "3 earlier messages". */
export const Folded: Story = { args: { thread: { ...thread("lumen"), unread: false } } };

/** With pictures attached: thumbnails, and a preview on click. */
export const Pictures: Story = { args: { thread: thread("cabin") } };

/** The reply box open, replying to all. */
export const ReplyAll: Story = { args: { thread: thread("standup"), defaultReply: "replyAll" } };

/** Forwarding: nobody yet, and the files listed. */
export const Forward: Story = { args: { thread: thread("rail"), defaultReply: "forward" } };

/** In Spam: a warning with Not spam. */
export const Spam: Story = { args: { thread: thread("spam-invoice"), view: "spam" } };

/** In Trash. */
export const Trash: Story = { args: { thread: thread("trash-lunch"), view: "trash" } };

/** Snoozed: when it comes back, and Unsnooze. */
export const Snoozed: Story = { args: { thread: thread("insurance"), view: "snoozed" } };
