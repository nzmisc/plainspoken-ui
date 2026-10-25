import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { LibraryHoldDialog } from "@/registry/plainspoken/blocks/library/hold-dialog";
import { BRANCHES, TODAY, availabilityOf, book } from "./fixtures";

const hobbit = book("the-hobbit");

const meta: Meta<typeof LibraryHoldDialog> = {
  title: "Blocks/Library/Hold dialog",
  // A dialog or drawer open on load would cover the whole docs page: there, each story gets its own frame
  parameters: { docs: { story: { inline: false, height: "640px" } } },
  component: LibraryHoldDialog,
  args: { book: hobbit, availability: availabilityOf(hobbit), branches: BRANCHES, defaultBranch: "riverside", today: TODAY },
  argTypes: { variant: { control: "inline-radio", options: ["default", "primary", "outline"] }, size: { control: "inline-radio", options: ["xs", "sm", "md", "lg"] } },
};
export default meta;
type Story = StoryObj<typeof LibraryHoldDialog>;

/** The button; it opens the dialog. */
export const Button: Story = {};

/** Open: format with each one's availability, pickup branch, a not-needed-after date, email notice. Place the hold to see your place in line. */
export const Open: Story = { args: { defaultOpen: true } };

/** A DVD only: one format to choose. */
export const DVD: Story = { args: { book: book("casablanca"), availability: availabilityOf(book("casablanca")), defaultOpen: true } };

/** As the main action on a title's page. */
export const Primary: Story = { args: { variant: "primary", size: "lg" } };
