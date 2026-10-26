import { CONTACTS, MAIL_NOW, MAIL_TODAY, THREADS } from "@/registry/plainspoken/blocks/mail/data";
import { MailThreadView } from "@/registry/plainspoken/blocks/mail/thread";

/**
 * A five-message conversation: the first one line, the read middle folded into "earlier
 * messages", the unread ones open. Hover a sender's name for their card; Reply opens the box.
 */
export default function MailThreadDemo() {
  const thread = THREADS.find((t) => t.id === "lumen")!;
  return (
    <div className="max-h-[640px] overflow-y-auto border border-border">
      <MailThreadView thread={{ ...thread, unread: false }} view="inbox" today={MAIL_TODAY} now={MAIL_NOW} contacts={CONTACTS} />
    </div>
  );
}
