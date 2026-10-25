import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { MAIL_TODAY, THREADS } from "@/registry/plainspoken/blocks/mail/data";
import { threadsIn } from "@/registry/plainspoken/blocks/mail/format";
import { MailMessageList } from "@/registry/plainspoken/blocks/mail/message-list";

const meta: Meta<typeof MailMessageList> = {
  title: "Blocks/Mail/Message list",
  component: MailMessageList,
  args: { threads: threadsIn(THREADS, "inbox"), view: "inbox", today: MAIL_TODAY },
  decorators: [(S) => <div className="max-w-md border border-border">{S()}</div>],
};
export default meta;
type Story = StoryObj<typeof MailMessageList>;

/**
 * The inbox. Keyboard: one Tab stop for the list; ↑/↓, Home and End move between rows, Enter
 * opens, and the row's checkbox and star come before its link in the Tab order. Right-click (or
 * Shift+F10) a row for its menu when `menuFor` is given.
 */
export const Inbox: Story = {};

/** One open (the current row, with a bar on its left edge) and three ticked. */
export const OpenAndSelected: Story = { args: { openId: "lumen", selected: new Set(["harbour-invoice", "mum-lunch", "kerning"]) } };

/** Drafts: "Draft" in red and the recipients. */
export const Drafts: Story = { args: { threads: threadsIn(THREADS, "drafts"), view: "drafts" } };

/** Sent: "To:" and the recipients. */
export const Sent: Story = { args: { threads: threadsIn(THREADS, "sent"), view: "sent" } };

/** Snoozed: when each comes back, with a clock. */
export const Snoozed: Story = { args: { threads: threadsIn(THREADS, "snoozed"), view: "snoozed" } };

/** With a right-click menu. */
export const WithMenu: Story = {
  args: {
    menuFor: (t) => [
      { label: "Open" },
      { label: t.unread ? "Mark as read" : "Mark as unread" },
      { type: "separator" },
      { label: "Archive" },
      { label: "Delete", destructive: true },
    ],
  },
};

/** Nothing in the folder. */
export const Empty: Story = { args: { threads: [], view: "trash" } };
