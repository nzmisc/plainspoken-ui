import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { BookCover } from "@/registry/plainspoken/blocks/library/book-cover";
import { BOOKS, book } from "./fixtures";

const meta: Meta<typeof BookCover> = {
  title: "Blocks/Library/Book cover",
  component: BookCover,
  args: { book: book("beloved"), size: "lg" },
  argTypes: { size: { control: "inline-radio", options: ["xs", "sm", "md", "lg"] } },
};
export default meta;
type Story = StoryObj<typeof BookCover>;

export const Playground: Story = {};

/** The first 40 titles of the catalogue: three designs, four colours, picked from each id. */
export const Shelf: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      {BOOKS.slice(0, 40).map((b) => (
        <BookCover key={b.id} book={b} size="sm" />
      ))}
    </div>
  ),
};

/** Long titles clamp; long words wrap anywhere rather than spill out. */
export const LongTitles: Story = {
  render: () => (
    <div className="flex flex-wrap items-end gap-3">
      {["aristotle-and-dante-discover-the-secrets-of-the-universe", "capital-in-the-twenty-first-century", "the-immortal-life-of-henrietta-lacks", "the-hitchhikers-guide-to-the-galaxy"].map((id) => (
        <BookCover key={id} book={book(id)} size="md" />
      ))}
    </div>
  ),
};

/** Every size. */
export const Sizes: Story = {
  render: (args) => (
    <div className="flex items-end gap-3">
      {(["xs", "sm", "md", "lg"] as const).map((s) => (
        <BookCover key={s} {...args} size={s} />
      ))}
    </div>
  ),
};

/** Other scripts and a DVD label. */
export const OtherScripts: Story = {
  render: () => (
    <div className="flex flex-wrap items-end gap-3">
      {["noruwei-no-mori", "parasite", "spirited-away", "cien-anos-de-soledad"].map((id) => (
        <BookCover key={id} book={book(id)} size="md" />
      ))}
    </div>
  ),
};
