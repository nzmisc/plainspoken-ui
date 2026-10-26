import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import type { DocStatus } from "@/registry/plainspoken/blocks/editor/data";
import { EditorDocumentHeader } from "@/registry/plainspoken/blocks/editor/document-header";

const meta: Meta<typeof EditorDocumentHeader> = {
  title: "Blocks/Editor/Document header",
  component: EditorDocumentHeader,
  args: {
    title: "Autumn offsite: plan",
    status: "draft",
    section: "The studio",
    words: 142,
    save: { at: "2026-10-24T15:31:00Z", by: "Maren Okafor", now: "2026-10-24T15:40:00Z" },
    onTitleChange: () => {},
    onStatusChange: () => {},
    className: "max-w-3xl border border-border",
  },
};
export default meta;
type Story = StoryObj<typeof EditorDocumentHeader>;

/** A draft, with Publish. Edit the title and press Publish to see the published state. */
export const Draft: Story = {
  render: function Render(args) {
    const [title, setTitle] = useState(args.title);
    const [status, setStatus] = useState<DocStatus>(args.status);
    return <EditorDocumentHeader {...args} title={title} onTitleChange={setTitle} status={status} onStatusChange={setStatus} />;
  },
};

/** Published, with Unpublish. */
export const Published: Story = { args: { title: "Getting to the studio", status: "published", section: "The studio", words: 168 } };

/** While a change saves. */
export const Saving: Story = { args: { save: { saving: true } } };

/** A new page: no title yet (the placeholder) and no words. */
export const Untitled: Story = { args: { title: "", words: 0, save: { at: "2026-10-24T15:39:30Z", by: "you", now: "2026-10-24T15:40:00Z" } } };

/** A long title wraps; on a phone the buttons go under it. */
export const LongTitle: Story = {
  args: { title: "What to do when the alarm goes off at night and nobody from the studio picks up the phone", words: 1204 },
  globals: { viewport: { value: "iphoneSE", isRotated: false } },
};
