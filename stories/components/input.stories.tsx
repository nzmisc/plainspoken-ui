import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { Search, X } from "@/registry/plainspoken/lib/icons";
import { CONTROL_SIZES } from "@/registry/plainspoken/lib/controls";
import { Button, IconButton } from "@/registry/plainspoken/ui/button";
import { Field } from "@/registry/plainspoken/ui/field";
import { Input } from "@/registry/plainspoken/ui/input";
import { Select } from "@/registry/plainspoken/ui/select";
import { Textarea } from "@/registry/plainspoken/ui/textarea";
import { Measure } from "../support/measure";

const meta = {
  title: "Components/Forms/Input",
  component: Input,
  args: { placeholder: "Search the docs", "aria-label": "Search" },
} satisfies Meta<typeof Input>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Affixes: Story = {
  render: () => (
    <div className="flex max-w-md flex-col gap-2">
      <Input prefix={Search} placeholder="Search" aria-label="Search" />
      <Input prefix="https://" suffix=".example.com" defaultValue="shop" aria-label="Subdomain" />
      <Input suffix="GiB" type="number" defaultValue={512} aria-label="Disk size" className="w-40" />
      <Input defaultValue="filter text" aria-label="Filter" suffix={<IconButton size="xs" variant="ghost" icon={X} label="Clear" />} />
    </div>
  ),
};

export const States: Story = {
  render: () => (
    <div className="flex max-w-sm flex-col gap-2">
      <Input placeholder="Empty" aria-label="Empty" />
      <Input defaultValue="Read only" readOnly aria-label="Read only" />
      <Input defaultValue="Disabled" disabled aria-label="Disabled" />
      <Input defaultValue="Invalid" invalid aria-label="Invalid" />
    </div>
  ),
};

/** An input, a select and a button of one size are the same height. */
export const Sizes: Story = {
  render: () => (
    <Measure>
      <div className="flex flex-col gap-2">
        {CONTROL_SIZES.map((s) => (
          <div key={s} className={`ctl-${s} flex items-center gap-2`}>
            <Input prefix={Search} placeholder={s} aria-label={s} className="w-44" />
            <Select options={["All", "Open", "Closed"]} aria-label="Status" />
            <Button>Apply</Button>
          </div>
        ))}
      </div>
    </Measure>
  ),
};

/** Field wires label, hint and error to the control. */
export const InAField: Story = {
  render: function Render() {
    const [email, setEmail] = useState("ana@");
    const ok = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
    return (
      <div className="flex max-w-sm flex-col gap-4">
        <Field label="Email" required hint="We only write about your account." error={ok ? undefined : "Enter an address like name@example.com."}>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <Field label="Bio">
          <Textarea maxLength={160} showCount value="Writes software." onChange={() => {}} />
        </Field>
        <Field inline label="Inline label">
          <Input defaultValue="Label on the left from sm up" />
        </Field>
      </div>
    );
  },
};
