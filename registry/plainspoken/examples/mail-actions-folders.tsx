import { MAIL_NOW, MAIL_TODAY, THREADS } from "@/registry/plainspoken/blocks/mail/data";
import { MailActions } from "@/registry/plainspoken/blocks/mail/actions";

/** The buttons follow the folder: Archive gets "Move to Inbox", Trash "Delete forever", Spam "Not spam". */
export default function MailActionsFolders() {
  return (
    <dl className="ctl-sm grid grid-cols-[auto_1fr] items-center gap-x-4 gap-y-2 text-[14px]">
      {(["archive", "trash", "spam"] as const).map((f) => (
        <div key={f} className="contents">
          <dt className="text-muted-foreground capitalize">{f}</dt>
          <dd>
            <MailActions threads={THREADS.filter((t) => t.folder === f).slice(0, 1)} view={f} today={MAIL_TODAY} now={MAIL_NOW} />
          </dd>
        </div>
      ))}
    </dl>
  );
}
