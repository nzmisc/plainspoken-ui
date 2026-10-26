import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { NotebookApp } from "@/registry/plainspoken/blocks/milkdown/notebook-app";

const meta: Meta<typeof NotebookApp> = {
  title: "Demos/Editor (Milkdown)",
  component: NotebookApp,
  parameters: { layout: "fullscreen", docs: { story: { inline: false, height: "760px" } } },
  args: { className: "h-dvh" },
};
export default meta;
type Story = StoryObj<typeof NotebookApp>;

/**
 * The demo as it is at /demos/milkdown: Pennant's engineering notebook, open at RFC-0042. Type / for
 * a block, drag one by its handle, follow a link to another page, and use the outline on the right.
 */
export const Notebook: Story = {};

/** The capacity plan: block and inline math, a table with right-aligned numbers. */
export const CapacityPlan: Story = { args: { defaultPageId: "capacity-2027" } };

/** The on-call handover in Markdown mode: what the editor stores. */
export const MarkdownMode: Story = { args: { defaultPageId: "oncall-handover-43", defaultMode: "markdown" } };

/** On a phone: the page tree is a drawer behind the menu button, the outline a menu in the header. */
export const Phone: Story = { globals: { viewport: { value: "iphoneSE", isRotated: false } } };
