import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { EditorApp } from "@/registry/plainspoken/blocks/editor/editor-app";

const meta: Meta<typeof EditorApp> = {
  title: "Demos/Editor",
  component: EditorApp,
  parameters: { layout: "fullscreen", docs: { story: { inline: false, height: "760px" } } },
  args: { className: "h-dvh" },
};
export default meta;
type Story = StoryObj<typeof EditorApp>;

/**
 * The demo as it is at /demos/editor: Quire, Ropewalk Studio's handbook, open at the welcome page.
 * Write in the formatted mode, switch to Markdown or Preview, paste or drop a picture.
 */
export const Handbook: Story = { args: { defaultDocId: "welcome" } };

/** The Markdown kitchen sink: every element the editor knows, on one page. */
export const KitchenSink: Story = { args: { defaultDocId: "kitchen-sink" } };

/** A draft, in Markdown mode. */
export const MarkdownMode: Story = { args: { defaultDocId: "style", defaultMode: "markdown" } };

/** On a phone. */
export const Phone: Story = { args: { defaultDocId: "welcome" }, globals: { viewport: { value: "iphoneSE", isRotated: false } } };
