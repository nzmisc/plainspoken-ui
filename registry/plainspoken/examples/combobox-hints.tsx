"use client";

import { Combobox } from "@/registry/plainspoken/ui/combobox";
import { Field } from "@/registry/plainspoken/ui/field";

const PEOPLE = [
  { value: "amara", label: "Amara Okafor", hint: "Design" },
  { value: "jonas", label: "Jonas Weber", hint: "Engineering" },
  { value: "li", label: "Li Wei", hint: "Engineering" },
  { value: "maria", label: "María González", hint: "Support" },
  { value: "noah", label: "Noah Fischer", hint: "Sales" },
  { value: "sofia", label: "Sofia Rossi", hint: "Finance" },
];

/** Options can carry a muted hint on the right. Uncontrolled here (defaultValue), with a name so a form submits the value. */
export default function ComboboxHints() {
  return (
    <form className="max-w-sm pb-48" onSubmit={(e) => e.preventDefault()}>
      <Field label="Assign to" required>
        <Combobox name="assignee" options={PEOPLE} placeholder="Pick a teammate" />
      </Field>
    </form>
  );
}
