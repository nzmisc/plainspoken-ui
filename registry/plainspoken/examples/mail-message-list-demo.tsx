import { MAIL_TODAY, THREADS } from "@/registry/plainspoken/blocks/mail/data";
import { threadsIn } from "@/registry/plainspoken/blocks/mail/format";
import { MailMessageList } from "@/registry/plainspoken/blocks/mail/message-list";

/** The inbox, newest first, with one conversation open and two ticked. Right-click a row for its menu. */
export default function MailMessageListDemo() {
  const inbox = threadsIn(THREADS, "inbox").slice(0, 6);
  return (
    <div className="max-w-md border border-border">
      <MailMessageList threads={inbox} view="inbox" today={MAIL_TODAY} openId="harbour-invoice" selected={new Set(["mum-lunch", "vat"])} />
    </div>
  );
}
