import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Toaster } from "@/registry/plainspoken/ui/toast";
import { LibraryLoans } from "@/registry/plainspoken/blocks/library/loans";
import { BASE, LOAN_ROWS, TODAY } from "./fixtures";

const meta: Meta<typeof LibraryLoans> = {
  title: "Blocks/Library/Loans",
  component: LibraryLoans,
  args: { loans: LOAN_ROWS, today: TODAY, basePath: BASE },
  decorators: [
    (S) => (
      <>
        {S()}
        <Toaster />
      </>
    ),
  ],
};
export default meta;
type Story = StoryObj<typeof LibraryLoans>;

/** Overdue, due today, due soon, and two that can't be renewed (hover their Renew to see why). */
export const Account: Story = {};

/** Nothing overdue. */
export const AllFine: Story = { args: { loans: LOAN_ROWS.filter((l) => l.due > TODAY) } };

/** On a phone the format and renewals columns fold away. */
export const Phone: Story = { globals: { viewport: { value: "iphoneSE", isRotated: false } } };
