import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useEffect, useRef, useState } from "react";
import { KITCHEN_SINK, fakeImageUpload } from "@/registry/plainspoken/blocks/editor/data";
import type { ControlSize } from "@/registry/plainspoken/lib/controls";
import { Button } from "@/registry/plainspoken/ui/button";
import { Field } from "@/registry/plainspoken/ui/field";
import { RichTextEditor, type ImageUploadFunction, type RichTextEditorHandle } from "@/registry/plainspoken/ui/rich-text-editor";
import { Measure } from "../support/measure";

const NOTES = `## Launch, Friday

We ship the **new booking flow** on Friday at 10:00. The checklist lives in [the launch doc](https://quire.example/launch).

- [x] Freeze the copy
- [ ] Draft the announcement
- [ ] Book the room for the retro

Run \`npm run release\` from \`main\`, then:

\`\`\`sh
npm run smoke -- --env=production
\`\`\`

> If anything looks off, roll back first and ask questions after.`;

const PICTURES = `The offsite cabin:

![A wooden cabin by a lake, with pine trees and hills behind](/demos/editor/cabin.svg)

Paste, drop, or use the picture button. A file with "fail" in its name fails, to show the error.`;

const meta = {
  title: "Components/Forms/Rich text editor",
  component: RichTextEditor,
  args: { "aria-label": "Launch notes", defaultValue: NOTES, className: "max-w-2xl" },
  argTypes: {
    onUploadImage: { control: false },
    editorRef: { control: false },
    size: { control: "inline-radio", options: ["xs", "sm", "md", "lg"] },
    defaultMode: { control: "inline-radio", options: ["write", "markdown", "preview"] },
  },
} satisfies Meta<typeof RichTextEditor>;
export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Write mode: select text and use the toolbar, or ⌘B / Ctrl+B, ⌘I, ⇧⌘X, ⌘E, ⌘K. Type "## ", "- ",
 * "1. ", "[ ] " or "> " at the start of a line, or ``` then Enter. Tab into the toolbar: one stop,
 * then ←/→. Tab in a list indents (Esc, then Tab, leaves the editor).
 */
export const Playground: Story = {};

/** Formatted, as it will look. */
export const Write: Story = { args: { defaultMode: "write" } };

/** The source, in a monospace box that grows with it. ⌘B, ⌘I, ⌘E and ⌘K wrap the selection in Markdown. */
export const Markdown: Story = { args: { defaultMode: "markdown" } };

/** Read only, rendered with Prose; links open in a new tab. */
export const Preview: Story = { args: { defaultMode: "preview" } };

/** The four control sizes: the toolbar's controls line up with the mode switch at each. The text is 14px, 16px at lg. */
export const Sizes: Story = {
  render: () => (
    <Measure>
      <div className="flex max-w-2xl flex-col gap-4">
        {(["xs", "sm", "md", "lg"] as ControlSize[]).map((size) => (
          <RichTextEditor key={size} size={size} aria-label={`Size ${size}`} defaultValue={`**${size}**: a short note at this size.`} contentClassName="min-h-14" />
        ))}
      </div>
    </Measure>
  ),
};

/** Nothing written yet: the placeholder. */
export const Empty: Story = { args: { defaultValue: "", placeholder: "Write the launch notes…" } };

/** Disabled: nothing can be changed or switched, and nothing is focusable. */
export const Disabled: Story = { args: { disabled: true } };

/** Read only: no toolbar, but the modes switch, the text can be selected and copied, and links open with a click. */
export const ReadOnly: Story = { args: { readOnly: true } };

/** Every element the Markdown knows, in a box that scrolls on its own, with the line length capped. */
export const LongContent: Story = { args: { "aria-label": "Markdown kitchen sink", defaultValue: KITCHEN_SINK, measure: true, contentClassName: "max-h-[560px]" } };

/** Pictures with a pretend upload of about two seconds. Click one to write its alt text or remove it. */
export const Pictures: Story = { args: { "aria-label": "Offsite notes", defaultValue: PICTURES, onUploadImage: fakeImageUpload } };

/** An upload that stops at 60% (it never finishes): the faded picture, its progress, and Cancel. */
export const UploadInProgress: Story = {
  render: function Render(args) {
    const ref = useRef<RichTextEditorHandle>(null);
    const stuck: ImageUploadFunction = (_file, { onProgress }) =>
      new Promise(() => {
        onProgress(0.6);
      });
    useEffect(() => {
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="160"><rect width="320" height="160" fill="#9fbfcc"/><path d="M0 120 L80 70 L160 110 L240 60 L320 100 V160 H0Z" fill="#4f7350"/></svg>`;
      const t = setTimeout(() => ref.current?.insertImageUrl("/demos/editor/process.svg", "Our process: listen, sketch, build, review"), 0);
      const u = setTimeout(() => ref.current?.insertImage(new File([svg], "lake-at-dawn.svg", { type: "image/svg+xml" })), 50);
      return () => {
        clearTimeout(t);
        clearTimeout(u);
      };
    }, []);
    return <RichTextEditor {...args} aria-label="Offsite notes" defaultValue="Pictures from the walk round the lake:" editorRef={ref} onUploadImage={stuck} />;
  },
};

/** In a Field: the label names the text box, and the hint and error are read out with it. */
export const InAField: Story = {
  render: () => (
    <div className="flex max-w-xl flex-col gap-4">
      <Field label="Job description" hint="What the job is and who it's for." required>
        <RichTextEditor size="sm" placeholder="Write a few lines about the role…" name="description" contentClassName="min-h-28" />
      </Field>
      <Field label="How to apply" error="Say where applications go.">
        <RichTextEditor size="sm" defaultValue="Send your CV and two pieces of work to" contentClassName="min-h-20" />
      </Field>
    </div>
  ),
};

const EDITS: ((md: string) => string)[] = [
  (md) => md.replace("## Launch, Friday", "## Launch, Thursday").replace("on Friday at 10:00", "on Thursday at 10:00"),
  (md) => md.replace("- [ ] Draft the announcement", "- [x] Draft the announcement"),
  (md) => `${md}\n\nJonas: the room is booked, the Loft at 16:00.`,
];

/**
 * Changes from someone else, through `editorRef.current.applyRemote(markdown)`: put the caret in
 * the text (or select some), then press the button. Only the blocks that changed are redrawn,
 * the caret stays, and ⌘Z undoes your own typing but never Jonas's change.
 */
export const RemoteChanges: Story = {
  render: function Render(args) {
    const ref = useRef<RichTextEditorHandle>(null);
    const text = useRef(NOTES);
    const [n, setN] = useState(0);
    return (
      <div className="flex max-w-2xl flex-col gap-2">
        <RichTextEditor {...args} editorRef={ref} onChange={(md) => (text.current = md)} />
        <div>
          <Button
            disabled={n >= EDITS.length}
            onClick={() => {
              text.current = EDITS[n](text.current);
              ref.current?.applyRemote(text.current);
              setN(n + 1);
            }}
          >
            {n < EDITS.length ? `Jonas makes change ${n + 1} of ${EDITS.length}` : "Jonas is done"}
          </Button>
        </div>
      </div>
    );
  },
};

/** On a phone: the toolbar wraps. */
export const Phone: Story = { globals: { viewport: { value: "iphoneSE", isRotated: false } } };
