import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { CharacterCount, ComposeDialog, Composer } from "@/registry/plainspoken/blocks/social/composer";
import { postById } from "@/registry/plainspoken/blocks/social/data";

const meta: Meta<typeof Composer> = {
  title: "Blocks/Social/Composer",
  component: Composer,
  decorators: [(S) => <div className="max-w-[600px] border border-border">{S()}</div>],
};
export default meta;
type Story = StoryObj<typeof Composer>;

/** Empty: Post is off until you type. Ctrl+Enter posts. */
export const Empty: Story = {};

/** Replying to a post. */
export const Reply: Story = { args: { replyTo: postById("nora-1") } };

/** Quoting a post. */
export const Quote: Story = { args: { quote: postById("ada-2") } };

/** With a poll being written. */
export const WithPoll: Story = {
  play: async ({ canvasElement }) => {
    canvasElement.querySelector<HTMLButtonElement>('button[aria-label="Add a poll"]')?.click();
  },
};

/** The count: plenty left, near the limit, over it. */
export const Counts: Story = {
  render: () => (
    <div className="flex gap-6 p-3">
      <CharacterCount length={42} />
      <CharacterCount length={268} />
      <CharacterCount length={291} />
    </div>
  ),
};

/** In its dialog. */
export const Dialog: Story = { render: () => <ComposeDialog open onClose={() => {}} /> };
