import { MAIL_NOW, MAIL_TODAY, THREADS } from "@/registry/plainspoken/blocks/mail/data";
import { MailActions } from "@/registry/plainspoken/blocks/mail/actions";

/** With words, and compact (icons only) as in the reading pane. The Snooze, Move and Label menus open. */
export default function MailActionsDemo() {
  const t = THREADS.filter((x) => x.id === "catalogue");
  return (
    <div className="ctl-sm flex flex-col gap-3">
      <MailActions threads={t} view="inbox" today={MAIL_TODAY} now={MAIL_NOW} />
      <MailActions threads={t} view="inbox" today={MAIL_TODAY} now={MAIL_NOW} compact />
    </div>
  );
}
