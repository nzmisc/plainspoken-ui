import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { CONTROL_SIZES } from "@/registry/plainspoken/lib/controls";
import { Button } from "@/registry/plainspoken/ui/button";
import { Combobox, type ComboboxOption } from "@/registry/plainspoken/ui/combobox";
import { Field } from "@/registry/plainspoken/ui/field";
import { Input } from "@/registry/plainspoken/ui/input";
import { Measure } from "../support/measure";

const ZONES: ComboboxOption[] = [
  "Africa/Cairo", "America/Chicago", "America/Los_Angeles", "America/New_York", "America/Sao_Paulo", "Asia/Kolkata",
  "Asia/Shanghai", "Asia/Singapore", "Asia/Tokyo", "Australia/Sydney", "Europe/Berlin", "Europe/Istanbul", "Europe/London",
  "Europe/Moscow", "Europe/Paris", "Pacific/Auckland", "UTC",
].map((z) => ({ value: z, label: z.replace("_", " ") }));

const SERVICES: ComboboxOption[] = [
  { value: "web", label: "Web front end", hint: ":443" },
  { value: "rdp", label: "Remote desktop", hint: ":3389" },
  { value: "editor", label: "Code editor", hint: ":8443" },
  { value: "dash", label: "Dashboard", hint: ":8444" },
  { value: "smb", label: "File shares", hint: ":445" },
  { value: "ssh", label: "SSH", hint: ":22" },
];

const meta = {
  title: "Components/Forms/Combobox",
  component: Combobox,
  args: { options: ZONES, defaultValue: "Europe/London", placeholder: "Search time zones", "aria-label": "Time zone" },
  argTypes: { size: { control: "select", options: [undefined, "xs", "sm", "md", "lg"] } },
  decorators: [(S) => <div className="max-w-sm pb-64"><S /></div>],
} satisfies Meta<typeof Combobox>;
export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Type to filter. ↓ opens the list at the chosen option, ↑/↓ move, Home/End jump, Enter picks,
 * Escape closes (and, when closed, clears). Tab leaves; leaving puts the chosen label back.
 */
export const Playground: Story = {};

/** In a Field: the label, hint and error are wired to it. The hint shows the value. */
export const InField: Story = {
  render: function Render() {
    const [v, setV] = useState<string | null>("Europe/London");
    return (
      <Field label="Time zone" hint={`value: ${v ?? "null"}`}>
        <Combobox options={ZONES} value={v} onChange={setV} placeholder="Search time zones" />
      </Field>
    );
  },
};

/** Options can carry a muted hint on the right. */
export const WithHints: Story = {
  render: () => (
    <Field label="Service">
      <Combobox options={SERVICES} placeholder="Pick a service" />
    </Field>
  ),
};

export const States: Story = {
  render: () => (
    <div className="flex flex-col gap-3">
      <Field label="Service" required error="Choose a service.">
        <Combobox options={SERVICES} />
      </Field>
      <Field label="Disabled">
        <Combobox options={SERVICES} defaultValue="ssh" disabled />
      </Field>
      <Field label="Nothing matches">
        <Combobox options={[]} placeholder="An empty list" emptyText="No services yet" />
      </Field>
    </div>
  ),
};

/** Same height as an Input and a Button of each size. */
export const Sizes: Story = {
  decorators: [(S) => <div className="pb-0"><S /></div>],
  render: () => (
    <Measure>
      <div className="flex flex-col gap-3">
        {CONTROL_SIZES.map((s) => (
          <div key={s} className="flex items-center gap-2">
            <Combobox size={s} options={SERVICES} defaultValue="web" aria-label={`Service (${s})`} className="w-56" />
            <Input size={s} aria-label={`Note (${s})`} placeholder="Note" className="w-32" />
            <Button size={s}>Add</Button>
          </div>
        ))}
      </div>
    </Measure>
  ),
};
