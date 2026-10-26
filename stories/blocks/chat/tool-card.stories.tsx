import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ChatToolCard } from "@/registry/plainspoken/blocks/chat/tool-card";
import { ChatFileList } from "@/registry/plainspoken/blocks/chat/attachment-chips";
import { showcaseToolPart } from "@/registry/plainspoken/blocks/chat/showcase";
import { Image } from "@/registry/plainspoken/lib/icons";

const icons = showcaseToolPart("call-icons-1");

const meta: Meta<typeof ChatToolCard> = {
  title: "Blocks/AI chat/Tool card",
  component: ChatToolCard,
  args: { name: "lookUpTide", title: "Tide times", input: { port: "Newhaven", date: "2026-10-26" }, output: { high: ["05:41", "18:02"], low: ["11:58"] }, state: "output-available" },
  decorators: [(S) => <div className="max-w-xl">{S()}</div>],
};
export default meta;
type Story = StoryObj<typeof ChatToolCard>;

/** Done: what it is, its tool name, and Details with what went in and what came back. */
export const Done: Story = {};

/** The model is still writing what it asks the tool. */
export const Preparing: Story = { args: { state: "input-streaming", output: undefined } };

/** Asked, waiting for the tool. */
export const Running: Story = { args: { state: "input-available", output: undefined } };

/** Failed: the reason, in red. */
export const Failed: Story = { args: { state: "output-error", output: undefined, errorText: "The tide service didn't answer in time." } };

/** With a result drawn properly inside: here the showcase's static "generated" picture. */
export const WithResult: Story = {
  args: { name: "generateImage", title: "Image generation", icon: Image, input: icons.input, output: icons.output },
  render: (args) => (
    <ChatToolCard {...args}>
      <ChatFileList files={[{ type: "file", mediaType: "image/svg+xml", filename: "icon-concepts.svg", url: "/demos/chat/icon-concepts.svg" }]} className="p-2" />
    </ChatToolCard>
  ),
};
