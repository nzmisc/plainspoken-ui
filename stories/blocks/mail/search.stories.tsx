import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { THREADS } from "@/registry/plainspoken/blocks/mail/data";
import { senders, threadsIn } from "@/registry/plainspoken/blocks/mail/format";
import { MailSearch } from "@/registry/plainspoken/blocks/mail/search";

const meta: Meta<typeof MailSearch> = {
  title: "Blocks/Mail/Mail search",
  component: MailSearch,
  args: { senders: senders(threadsIn(THREADS, "inbox")), placeholder: "Search Inbox", className: "max-w-md" },
};
export default meta;
type Story = StoryObj<typeof MailSearch>;

/** Empty: the "/" hint in the box, and the filters off. */
export const Playground: Story = {};

/** Typed and filtered: the chips pressed, From as a chip with ×, and Clear. */
export const Filtered: Story = {
  args: { defaultQuery: "proof", defaultFilters: { from: "marta.kowalska@kestrel-outdoor.example", attachment: true, unread: true } },
};
