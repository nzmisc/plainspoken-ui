import { MAIL_TODAY, THREADS } from "@/registry/plainspoken/blocks/mail/data";
import { threadsIn } from "@/registry/plainspoken/blocks/mail/format";
import { MailMessageList } from "@/registry/plainspoken/blocks/mail/message-list";

/** The same list in other folders: Drafts say so in red, Sent names the recipients, Snoozed shows when each comes back. */
export default function MailMessageListFolders() {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {(["drafts", "sent", "snoozed"] as const).map((f) => (
        <div key={f} className="min-w-0 border border-border">
          <MailMessageList threads={threadsIn(THREADS, f).slice(0, 2)} view={f} today={MAIL_TODAY} label={`${f} conversations`} />
        </div>
      ))}
    </div>
  );
}
