import { THREADS } from "@/registry/plainspoken/blocks/mail/data";
import { senders, threadsIn } from "@/registry/plainspoken/blocks/mail/format";
import { MailSearch } from "@/registry/plainspoken/blocks/mail/search";

/** The box and the filter chips; From lists the senders in the folder. */
export default function MailSearchDemo() {
  return <MailSearch senders={senders(threadsIn(THREADS, "inbox"))} placeholder="Search Inbox" className="max-w-md" />;
}
