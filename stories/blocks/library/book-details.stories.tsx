import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { LibraryBookDetails } from "@/registry/plainspoken/blocks/library/book-details";
import { LibraryHoldDialog } from "@/registry/plainspoken/blocks/library/hold-dialog";
import { BASE, BRANCHES, TODAY, availabilityOf, book, callNumber } from "./fixtures";

const details = (id: string) => ({ book: book(id), availability: availabilityOf(book(id)), callNumber: callNumber(book(id)) });

const meta: Meta<typeof LibraryBookDetails> = {
  title: "Blocks/Library/Book details",
  component: LibraryBookDetails,
  args: { ...details("wolf-hall"), searchPath: `${BASE}/search` },
};
export default meta;
type Story = StoryObj<typeof LibraryBookDetails>;

/** A novel in three formats. */
export const Novel: Story = {};

/** With the hold dialog as its action. */
export const WithActions: Story = {
  args: {
    ...details("orbital"),
    actions: <LibraryHoldDialog book={book("orbital")} availability={availabilityOf(book("orbital"))} branches={BRANCHES} today={TODAY} variant="primary" />,
  },
};

/** A film: “Director” instead of author, and a subtitle in English. */
export const Film: Story = { args: details("seven-samurai") };

/** On a phone the cover goes above the text. */
export const Phone: Story = { globals: { viewport: { value: "iphoneSE", isRotated: false } } };
