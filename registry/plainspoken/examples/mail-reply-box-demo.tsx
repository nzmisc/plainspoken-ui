import { CONTACTS, THREADS } from "@/registry/plainspoken/blocks/mail/data";
import { MailReplyBox } from "@/registry/plainspoken/blocks/mail/reply-box";

/** A forward: nobody to send to yet (type a name to get suggestions), and the files that go along. */
export default function MailReplyBoxDemo() {
  const m = THREADS.find((t) => t.id === "lumen")!.messages[3];
  return <MailReplyBox mode="forward" to={[]} attachments={m.attachments} contacts={CONTACTS} autoFocus={false} className="mt-0 max-w-xl" />;
}
