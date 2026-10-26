import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { DOCS } from "@/registry/plainspoken/blocks/editor/data";
import { EditorDocument } from "@/registry/plainspoken/blocks/editor/document";

const doc = (id: string) => DOCS.find((d) => d.id === id)!;

const meta: Meta<typeof EditorDocument> = {
  title: "Blocks/Editor/Document",
  component: EditorDocument,
  parameters: { layout: "fullscreen" },
  args: { doc: doc("offsite"), className: "h-[640px] border-b border-border" },
};
export default meta;
type Story = StoryObj<typeof EditorDocument>;

/** A draft with a picture, a table and tasks. Type, and it "saves" a moment after you stop. */
export const Draft: Story = {};

/** A published page with code blocks. */
export const Published: Story = { args: { doc: doc("laptop") } };

/** The Markdown kitchen sink, opened in Markdown mode. */
export const KitchenSinkSource: Story = { args: { doc: doc("kitchen-sink"), defaultMode: "markdown" } };

/** A new page: no title, no text, the placeholder. */
export const NewPage: Story = { args: { doc: { ...doc("offsite"), id: "new", title: "", body: "", savedBy: "maren" } } };

/** On a phone. */
export const Phone: Story = { globals: { viewport: { value: "iphoneSE", isRotated: false } } };
