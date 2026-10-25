import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { MAIL_NOW, MAIL_TODAY, THREADS } from "@/registry/plainspoken/blocks/mail/data";
import { threadsIn } from "@/registry/plainspoken/blocks/mail/format";
import { MailListToolbar } from "@/registry/plainspoken/blocks/mail/list-toolbar";

const meta: Meta<typeof MailListToolbar> = {
  title: "Blocks/Mail/List toolbar",
  component: MailListToolbar,
  args: { threads: threadsIn(THREADS, "inbox"), view: "inbox", today: MAIL_TODAY, now: MAIL_NOW, className: "border border-border" },
  decorators: [(S) => <div className="max-w-md">{S()}</div>],
};
export default meta;
type Story = StoryObj<typeof MailListToolbar>;

/** Nothing ticked: the count, and how many are unread. */
export const Nothing: Story = {};

/** Some ticked: the part-ticked box, "3 selected" and the actions as icon buttons. */
export const Some: Story = { args: { selected: new Set(["vat", "tea", "rail"]) } };

/** All ticked. */
export const All: Story = { args: { selected: new Set(threadsIn(THREADS, "inbox").map((t) => t.id)) } };

/** In Trash: "Move to Inbox" and "Delete forever". */
export const InTrash: Story = { args: { threads: threadsIn(THREADS, "trash"), view: "trash", selected: new Set(["trash-stock"]) } };
