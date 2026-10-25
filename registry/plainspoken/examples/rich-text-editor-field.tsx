import { Field } from "@/registry/plainspoken/ui/field";
import { RichTextEditor } from "@/registry/plainspoken/ui/rich-text-editor";

/**
 * In a Field like any other input: the label names the text box, the hint and the error are read
 * out with it, and `name` posts the Markdown with the form. A small size, for a form.
 */
export default function RichTextEditorField() {
  return (
    <form className="flex max-w-xl flex-col gap-4">
      <Field label="Description" hint="What the job is and who it's for. Markdown works too." required>
        <RichTextEditor name="description" size="sm" placeholder="Write a few lines about the role…" contentClassName="min-h-28" />
      </Field>
      <Field label="How to apply" error="Say where applications go.">
        <RichTextEditor name="apply" size="sm" defaultValue="Send your CV and two pieces of work to" contentClassName="min-h-20" />
      </Field>
    </form>
  );
}
