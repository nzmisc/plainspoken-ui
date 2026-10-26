import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ChatReasoning } from "@/registry/plainspoken/blocks/chat/reasoning";
import { CHAT_SHOWCASE } from "@/registry/plainspoken/blocks/chat/showcase";
import { messageReasoning } from "@/registry/plainspoken/blocks/chat/format";

const meta: Meta<typeof ChatReasoning> = {
  title: "Blocks/AI chat/Reasoning",
  component: ChatReasoning,
  args: { text: messageReasoning(CHAT_SHOWCASE.messages[7]), durationMs: 11400 },
  decorators: [(S) => <div className="max-w-2xl">{S()}</div>],
};
export default meta;
type Story = StoryObj<typeof ChatReasoning>;

/** Folded, with how long it took. Click (or Enter on) the summary to open it. */
export const Done: Story = {};

/** Open: the reasoning as a muted aside with a rule on its left. */
export const Open: Story = { args: { defaultOpen: true } };

/** Still thinking: a spinner (standing still with reduced motion) and "Thinking…". */
export const Thinking: Story = { args: { streaming: true, text: "Two people, six weeks, almost no budget. A phased plan, then", durationMs: undefined } };

/** No time known (an older answer): just "Reasoning". */
export const NoTime: Story = { args: { durationMs: undefined } };
