import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { Brain } from "@/registry/plainspoken/lib/icons";
import { ChatComposer } from "@/registry/plainspoken/blocks/chat/composer";
import { ChatModelPicker } from "@/registry/plainspoken/blocks/chat/model-picker";
import { DEFAULT_CHAT_MODEL } from "@/registry/plainspoken/blocks/chat/models";
import { Button } from "@/registry/plainspoken/ui/button";
import { Toggle } from "@/registry/plainspoken/ui/toggle";

function Tools() {
  const [model, setModel] = useState(DEFAULT_CHAT_MODEL);
  return (
    <>
      <ChatModelPicker value={model} onChange={setModel} />
      <Toggle variant="ghost" icon={Brain} defaultPressed>
        Thinking
      </Toggle>
    </>
  );
}

const meta: Meta<typeof ChatComposer> = {
  title: "Blocks/AI chat/Composer",
  component: ChatComposer,
  args: { onSend: () => {}, onStop: () => {}, placeholder: "Message Claude Haiku 5.5" },
  decorators: [(S) => <div className="max-w-3xl">{S()}</div>],
};
export default meta;
type Story = StoryObj<typeof ChatComposer>;

/** Type: the box grows to ten lines, then scrolls. Enter sends (and empties it), Shift+Enter starts a new line. */
export const Playground: Story = {};

/** With the app's tools under it: the model picker and Thinking. */
export const WithTools: Story = { render: (args) => <ChatComposer {...args} tools={<Tools />} /> };

/** While an answer streams, Send becomes Stop in the same place, so focus stays on it. */
export const Streaming: Story = { args: { streaming: true, defaultValue: "And the second week?" } };

/** Disabled, with nothing to send. */
export const Disabled: Story = { args: { disabled: true } };

/** A long draft: the box stops growing at ten lines and scrolls. */
export const LongDraft: Story = { args: { defaultValue: Array.from({ length: 16 }, (_, i) => `Line ${i + 1}: things to check before launch`).join("\n") } };

/** Editing a sent message: its own button words, a Cancel, a note, and Escape cancels. */
export const Editing: Story = {
  args: { defaultValue: "How many sign-ups should we expect from 4,000 visits?", sendLabel: "Send again", hint: "Sending replaces the answer below.", onCancel: () => {} },
  render: (args) => <ChatComposer {...args} tools={<Button variant="ghost">Cancel</Button>} />,
};
