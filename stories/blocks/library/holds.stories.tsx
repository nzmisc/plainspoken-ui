import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Toaster } from "@/registry/plainspoken/ui/toast";
import { LibraryHolds } from "@/registry/plainspoken/blocks/library/holds";
import { BASE, BRANCHES, HOLD_ROWS } from "./fixtures";

const meta: Meta<typeof LibraryHolds> = {
  title: "Blocks/Library/Holds",
  component: LibraryHolds,
  args: { holds: HOLD_ROWS, branches: BRANCHES, basePath: BASE },
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
type Story = StoryObj<typeof LibraryHolds>;

/** Ready, on its way, waiting and paused. Each row's menu pauses, moves or cancels (with a confirmation). */
export const Account: Story = {};

/** No holds. */
export const Empty: Story = { args: { holds: [] } };
