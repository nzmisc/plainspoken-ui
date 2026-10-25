import { CONTACTS, MAIL_NOW, MAIL_TODAY, THREADS } from "@/registry/plainspoken/blocks/mail/data";
import { MailThreadView } from "@/registry/plainspoken/blocks/mail/thread";

/** Replying to all: the reply box in place of the buttons, addressed to the sender with the others in Cc. */
export default function MailThreadReply() {
  const thread = THREADS.find((t) => t.id === "standup")!;
  return (
    <div className="border border-border">
      <MailThreadView thread={thread} view="inbox" today={MAIL_TODAY} now={MAIL_NOW} contacts={CONTACTS} defaultReply="replyAll" />
    </div>
  );
}
