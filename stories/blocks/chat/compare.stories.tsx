import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import type { ChatTransport } from "ai";
import type { ChatMessage } from "@/registry/plainspoken/blocks/chat/data";
import { ChatCompareView } from "@/registry/plainspoken/blocks/chat/compare-view";
import { chatModelName } from "@/registry/plainspoken/blocks/chat/models";
import type { ChatUIMessage } from "@/registry/plainspoken/blocks/chat/transport";
import { fakeTransport } from "./fixtures";

const QUESTION: ChatMessage[] = [{ id: "q1", role: "user", parts: [{ type: "text", text: "In two sentences: why do tides come twice a day?" }] }];

const ANSWERS: Record<string, string> = {
  "anthropic/claude-haiku-5.5":
    "The Moon's pull makes the ocean bulge on the side facing it, and the Earth is pulled away from the water on the far side, so there are two bulges. As the Earth turns through both in about 24 hours and 50 minutes, most coasts get two high tides.",
  "openai/gpt-6-luna": "Two bulges of water, one under the Moon and one opposite it, stay roughly in place while the Earth spins. Each spot on the coast passes through both a day, so it sees two highs and two lows.",
};

const answers = fakeTransport({ reply: (m) => ANSWERS[m] ?? `An answer from ${chatModelName(m)}.`, delay: 70 });
const busy = fakeTransport({ fail: "rate-limit" });
/** GPT-6 Luna is busy; the others answer */
const oneFails: ChatTransport<ChatUIMessage> = {
  sendMessages: (o) => ((o.body as { model?: string } | undefined)?.model === "openai/gpt-6-luna" ? busy : answers).sendMessages(o),
  reconnectToStream: async () => null,
};

const meta: Meta<typeof ChatCompareView> = {
  title: "Blocks/AI chat/Compare view",
  component: ChatCompareView,
  args: {
    messages: QUESTION,
    models: ["anthropic/claude-haiku-5.5", "openai/gpt-6-luna"],
    transport: answers,
    body: { think: false },
    onPick: (kept, all) => console.log("pick", kept.id, all.length),
    onCancel: () => console.log("cancel"),
  },
  decorators: [(S) => <div className="max-w-5xl">{S()}</div>],
};
export default meta;
type Story = StoryObj<typeof ChatCompareView>;

/**
 * Two models answer the same question side by side, each streaming on its own (a stand-in here).
 * Stop one, or pick the answer to go on with.
 */
export const TwoModels: Story = {};

/** Three, in three columns on a wide screen. */
export const ThreeModels: Story = { args: { models: ["anthropic/claude-haiku-5.5", "openai/gpt-6-luna", "google/gemini-3.8-flash"] } };

/** One fails: its reason and Retry, while the other answers. */
export const OneFails: Story = { args: { transport: oneFails } };
