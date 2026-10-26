import { Field } from "@/registry/plainspoken/ui/field";
import { Input } from "@/registry/plainspoken/ui/input";
import { Select } from "@/registry/plainspoken/ui/select";

/** Labels on the left on wide screens, above on narrow ones: for settings pages. */
export default function FieldInline() {
  return (
    <div className="flex max-w-lg flex-col gap-3">
      <Field inline label="Display name">
        <Input defaultValue="Ana" />
      </Field>
      <Field inline label="Time zone" hint="Used for dates in emails.">
        <Select options={["Europe/Berlin", "Europe/London", "America/New_York", "Asia/Tokyo"]} />
      </Field>
    </div>
  );
}
