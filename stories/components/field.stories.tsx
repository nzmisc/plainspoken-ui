import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Field } from "@/registry/plainspoken/ui/field";
import { Input } from "@/registry/plainspoken/ui/input";
import { Select } from "@/registry/plainspoken/ui/select";
import { Textarea } from "@/registry/plainspoken/ui/textarea";

const meta: Meta = { title: "Components/Forms/Field" };
export default meta;

/** Label, hint and error wired to the control: click a label to focus its control; a screen reader reads the hint and error with it. */
export const Stacked: StoryObj = {
  render: () => (
    <form className="flex max-w-sm flex-col gap-4" onSubmit={(e) => e.preventDefault()}>
      <Field label="Name" required>
        <Input autoComplete="name" />
      </Field>
      <Field label="Email" hint="We only write about your account." error="Enter an address like name@example.com.">
        <Input type="email" defaultValue="ana@" />
      </Field>
      <Field label="Plan">
        <Select options={["Free", "Team", "Enterprise"]} />
      </Field>
      <Field label="Notes" hint="Optional.">
        <Textarea />
      </Field>
    </form>
  ),
};

/** Labels on the left from sm up, for settings pages. */
export const Inline: StoryObj = {
  render: () => (
    <div className="flex max-w-lg flex-col gap-3">
      <Field inline label="Display name">
        <Input defaultValue="Ana" />
      </Field>
      <Field inline label="Time zone" hint="Used for dates in emails.">
        <Select options={["Europe/Berlin", "Europe/London", "America/New_York"]} />
      </Field>
    </div>
  ),
};
