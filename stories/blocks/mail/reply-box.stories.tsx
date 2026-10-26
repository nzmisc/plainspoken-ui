import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { CONTACTS, THREADS } from "@/registry/plainspoken/blocks/mail/data";
import { MailReplyBox } from "@/registry/plainspoken/blocks/mail/reply-box";

const [tomas, lena, marta] = CONTACTS;

const meta: Meta<typeof MailReplyBox> = {
  title: "Blocks/Mail/Reply box",
  component: MailReplyBox,
  args: { mode: "reply", to: [marta], contacts: CONTACTS, autoFocus: false, className: "mt-0 max-w-xl" },
};
export default meta;
type Story = StoryObj<typeof MailReplyBox>;

/** A reply to one person. */
export const Reply: Story = {};

/** Reply all: the others in Cc. */
export const ReplyAll: Story = { args: { mode: "replyAll", to: [marta], cc: [tomas, lena] } };

/** Forward: nobody yet, and the files that go along. */
export const Forward: Story = { args: { mode: "forward", to: [], attachments: THREADS.find((t) => t.id === "lumen")!.messages[3].attachments } };

/** Half written. */
export const Written: Story = {
  args: { defaultBody: "Hi Marta,\n\nThe white logo works much better, agreed. Tomás will send the revised spread on Monday.\n\nNora" },
};
