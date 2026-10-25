import { MAIL_NOW, MAIL_TODAY, THREADS } from "@/registry/plainspoken/blocks/mail/data";
import { threadsIn } from "@/registry/plainspoken/blocks/mail/format";
import { MailListToolbar } from "@/registry/plainspoken/blocks/mail/list-toolbar";

/** Nothing ticked: the count. Three ticked: the box is part-ticked and the actions appear. */
export default function MailListToolbarDemo() {
  const inbox = threadsIn(THREADS, "inbox");
  return (
    <div className="flex max-w-md flex-col gap-3">
      <MailListToolbar threads={inbox} view="inbox" today={MAIL_TODAY} now={MAIL_NOW} className="border border-border" />
      <MailListToolbar threads={inbox} selected={new Set(["vat", "tea", "rail"])} view="inbox" today={MAIL_TODAY} now={MAIL_NOW} className="border border-border" />
    </div>
  );
}
