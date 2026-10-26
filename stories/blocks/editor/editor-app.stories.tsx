import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { EditorApp } from "@/registry/plainspoken/blocks/editor/editor-app";

const meta: Meta<typeof EditorApp> = {
  title: "Blocks/Editor/Editor app",
  component: EditorApp,
  parameters: { layout: "fullscreen", docs: { story: { inline: false, height: "720px" } } },
  args: { className: "h-dvh", defaultDocId: "welcome" },
};
export default meta;
type Story = StoryObj<typeof EditorApp>;

/** The handbook's welcome page. */
export const Welcome: Story = {};

/** A draft open: the offsite plan. */
export const Draft: Story = { args: { defaultDocId: "offsite" } };

/** The Markdown kitchen sink, in Preview. */
export const KitchenSink: Story = { args: { defaultDocId: "kitchen-sink", defaultMode: "preview" } };

/** On a phone: the sidebar is a drawer behind the menu button. */
export const Phone: Story = { globals: { viewport: { value: "iphoneSE", isRotated: false } } };
