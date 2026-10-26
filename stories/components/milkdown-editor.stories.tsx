import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import type { ControlSize } from "@/registry/plainspoken/lib/controls";
import Compared from "@/registry/plainspoken/examples/milkdown-editor-compared";
import Controlled from "@/registry/plainspoken/examples/milkdown-editor-controlled";
import InField from "@/registry/plainspoken/examples/milkdown-editor-field";
import Images from "@/registry/plainspoken/examples/milkdown-editor-images";
import KitchenSink from "@/registry/plainspoken/examples/milkdown-editor-kitchen-sink";
import MathExample from "@/registry/plainspoken/examples/milkdown-editor-math";
import Modes from "@/registry/plainspoken/examples/milkdown-editor-modes";
import Tables from "@/registry/plainspoken/examples/milkdown-editor-tables";
import { Field } from "@/registry/plainspoken/ui/field";
import { MilkdownEditor } from "@/registry/plainspoken/ui/milkdown-editor";
import { Measure } from "../support/measure";

const NOTES = `## Release 3.8

The **fare cache** now warms itself after a deploy, so the first minutes are as fast as the rest. Details are in [the RFC](https://notebook.pennant.example/rfc/0042).

- [x] Roll out to the test operators
- [ ] Roll out everywhere on Monday

\`\`\`bash
pennant deploy fares --region eu-west
\`\`\`

> Watch the p95 latency for an hour after each step.`;

const meta = {
  title: "Components/Forms/Milkdown editor",
  component: MilkdownEditor,
  args: { "aria-label": "Release notes", defaultValue: NOTES, className: "max-w-2xl" },
  argTypes: {
    onUploadImage: { control: false },
    editorRef: { control: false },
    size: { control: "inline-radio", options: ["xs", "sm", "md", "lg"] },
    defaultMode: { control: "inline-radio", options: ["write", "markdown", "preview"] },
  },
} satisfies Meta<typeof MilkdownEditor>;
export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Write mode: select words for the bubble, or use the toolbar and its keys (⌘B, ⌘I, ⇧⌘X, ⌘E, ⌘K).
 * Type "/" at the start of a line for the block menu, or Markdown ("## ", "- ", "[ ] ", ``` and
 * Enter). Hover a block for its handle: drag it, or click it for Turn into, Move, Duplicate and
 * Delete. Tab into the toolbar: one stop, then ←/→. Tab in a list indents (Esc, then Tab, leaves).
 */
export const Playground: Story = {};

/** The source, in a monospace box that grows with it. ⌘B, ⌘I, ⌘E and ⌘K wrap the selection in Markdown. */
export const Markdown: Story = { args: { defaultMode: "markdown" } };

/** The same Milkdown view, read only and without the chrome; links open in a new tab. */
export const Preview: Story = { args: { defaultMode: "preview" } };

/** Mode controlled from outside. */
export const ControlledMode: Story = { render: () => <Modes /> };

/** No text yet: the placeholder, and "Type / for blocks" on the empty line being written. */
export const Empty: Story = { args: { defaultValue: "", placeholder: "Write the summary of the incident…" } };

/** Every element Markdown has: switch to Markdown and back, and nothing is lost. */
export const Everything: Story = { render: () => <KitchenSink /> };

/** Pictures uploaded through onUploadImage, with progress and Cancel; a file with "fail" in its name fails. */
export const Pictures: Story = { render: () => <Images /> };

/** Tables: the grid picker, the table toolbar, Tab between cells. */
export const TablesStory: Story = { name: "Tables", render: () => <Tables /> };

/** Math with KaTeX, inline and as blocks. */
export const MathStory: Story = { name: "Math", render: () => <MathExample /> };

/** Controlled value, changed from outside: the caret stays and undo sees only your typing. */
export const ControlledValue: Story = { render: () => <Controlled /> };

/** Read only: no toolbar, the modes still switch. */
export const ReadOnly: Story = { args: { readOnly: true } };

/** Disabled: greyed, nothing can be changed or switched. */
export const Disabled: Story = { args: { disabled: true } };

/** In a Field, with a hint and an error. */
export const InAField: Story = { render: () => <InField /> };

/** Invalid, from a Field's error. */
export const Invalid: Story = {
  render: (args) => (
    <Field label="Summary" error="Say what happened first." className="max-w-2xl">
      <MilkdownEditor {...args} aria-label={undefined} defaultValue="" />
    </Field>
  ),
};

/** The toolbar's controls on each size of the scale; the text is 14px, 16px at lg. */
export const Sizes: Story = {
  render: () => (
    <Measure>
      <div className="flex max-w-2xl flex-col gap-4">
        {(["xs", "sm", "md", "lg"] as ControlSize[]).map((size) => (
          <MilkdownEditor key={size} size={size} aria-label={`Size ${size}`} defaultValue={`**${size}**: a short note at this size.`} contentClassName="min-h-14" />
        ))}
      </div>
    </Measure>
  ),
};

/** A page-filling document: the line length capped and centred. */
export const Document: Story = { args: { measure: true, className: "h-[600px]", contentClassName: "min-h-0" } };

/** How it differs from RichTextEditor. */
export const ComparedWithRichTextEditor: Story = { render: () => <Compared /> };

/** On a phone: the toolbar wraps, block handles give way to the slash menu and the ⋯ menu. */
export const Phone: Story = { globals: { viewport: { value: "iphoneSE", isRotated: false } } };
