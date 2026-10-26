"use client";

import { useState } from "react";
import { Field } from "@/registry/plainspoken/ui/field";
import { MilkdownEditor } from "@/registry/plainspoken/ui/milkdown-editor";

/**
 * In a Field, like Input: the label names it (and clicking it focuses the text), the hint is read
 * out with it, and an error marks it invalid. The hidden input `name="report"` posts the Markdown.
 */
export default function MilkdownEditorField() {
  const [value, setValue] = useState("");
  const short = value.trim().length < 20;
  return (
    <form className="max-w-2xl">
      <Field label="What happened" required hint="Say where and when, and who was there." error={short && value ? "A little more, please: at least 20 characters." : undefined}>
        <MilkdownEditor name="report" value={value} onChange={setValue} placeholder="On Tuesday at about 14:00, on Mill Street…" contentClassName="min-h-28" />
      </Field>
    </form>
  );
}
