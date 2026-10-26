import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { PAGES } from "@/registry/plainspoken/blocks/milkdown/data";
import { countWords } from "@/registry/plainspoken/blocks/milkdown/format";
import { NotebookPageHeader } from "@/registry/plainspoken/blocks/milkdown/document-header";

const page = (id: string) => PAGES.find((p) => p.id === id)!;

const meta: Meta<typeof NotebookPageHeader> = {
  title: "Blocks/Editor (Milkdown)/Page header",
  component: NotebookPageHeader,
  args: { page: page("rfc-0045"), words: countWords(page("rfc-0045").body), onTitleChange: () => {}, onStatusChange: () => {}, onDuplicate: () => {}, onDelete: () => {} },
  decorators: [(Story) => <div className="max-w-3xl border border-border">{Story()}</div>],
};
export default meta;
type Story = StoryObj<typeof NotebookPageHeader>;

/** An RFC in review, by two authors. */
export const InReview: Story = {};

/** Published, in a folder: the trail reads "Operations / Runbooks". */
export const Published: Story = { args: { page: page("validator-latency"), words: countWords(page("validator-latency").body) } };

/** A new page: no title yet (the placeholder), a draft, edited just now by you. */
export const NewPage: Story = {
  args: { page: { ...page("rfc-0045"), id: "untitled", title: "", status: "draft", authors: ["sofia"], editedBy: "sofia", editedAt: "2026-10-23T15:39:30Z", body: "" }, words: 0 },
};

/** A long title wraps under the trail; the menu stays at the top. */
export const LongTitle: Story = {
  args: { page: { ...page("rfc-0045"), title: "RFC-0045: Fare caps on offline validators, and what the weekly cap needs from the card layout", status: "outdated" } },
};
