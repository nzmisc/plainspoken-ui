import { MAIL_NOW, MAIL_TODAY, THREADS } from "@/registry/plainspoken/blocks/mail/data";
import { MailThreadView } from "@/registry/plainspoken/blocks/mail/thread";

/** In Spam the pane says why, with the way out; Trash and Snoozed have their own notes. */
export default function MailThreadSpam() {
  const thread = THREADS.find((t) => t.id === "spam-invoice")!;
  return (
    <div className="border border-border">
      <MailThreadView thread={thread} view="spam" today={MAIL_TODAY} now={MAIL_NOW} />
    </div>
  );
}
