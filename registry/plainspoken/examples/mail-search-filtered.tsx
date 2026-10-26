import { THREADS } from "@/registry/plainspoken/blocks/mail/data";
import { senders, threadsIn } from "@/registry/plainspoken/blocks/mail/format";
import { MailSearch } from "@/registry/plainspoken/blocks/mail/search";

/** With a query and filters on: pressed chips, a From chip with its ×, and Clear. */
export default function MailSearchFiltered() {
  return (
    <MailSearch
      senders={senders(threadsIn(THREADS, "inbox"))}
      placeholder="Search Inbox"
      defaultQuery="proof"
      defaultFilters={{ from: "marta.kowalska@kestrel-outdoor.example", attachment: true, unread: false }}
      className="max-w-md"
    />
  );
}
