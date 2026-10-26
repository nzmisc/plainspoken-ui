import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { ChatBranchPicker, type ChatBranchPickerProps } from "@/registry/plainspoken/blocks/chat/branch-picker";

function Picker({ index: start = 1, count = 3, ...rest }: Partial<ChatBranchPickerProps>) {
  const [index, setIndex] = useState(start);
  return <ChatBranchPicker {...rest} index={index} count={count} onChange={(step) => setIndex((i) => i + step)} />;
}

const meta: Meta<typeof Picker> = {
  title: "Blocks/AI chat/Branch picker",
  component: Picker,
  args: { of: "answer" },
};
export default meta;
type Story = StoryObj<typeof Picker>;

/** The second of three answers: the arrows step through them, and screen readers hear "Version 2 of 3". */
export const Middle: Story = {};

/** The first: the left arrow is off. */
export const First: Story = { args: { index: 0 } };

/** While an answer streams, the versions can't change. */
export const Disabled: Story = { args: { disabled: true } };

/** Only one version: nothing is drawn. */
export const One: Story = { args: { index: 0, count: 1 } };
