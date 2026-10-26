import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { CONTROL_HEIGHT, CONTROL_SIZES } from "@/registry/plainspoken/lib/controls";
import { Button } from "@/registry/plainspoken/ui/button";
import { Field } from "@/registry/plainspoken/ui/field";
import { Input } from "@/registry/plainspoken/ui/input";
import { NumberField } from "@/registry/plainspoken/ui/number-field";
import { Measure } from "../support/measure";

const meta = {
  title: "Components/Forms/Number field",
  component: NumberField,
  args: { defaultValue: 5, min: 1, max: 60, step: 1, unit: "min", "aria-label": "Poll every" },
  argTypes: { size: { control: "select", options: [undefined, "xs", "sm", "md", "lg"] } },
} satisfies Meta<typeof NumberField>;
export default meta;
type Story = StoryObj<typeof meta>;

/** ↑/↓ step; typing works as usual; out-of-range values are clamped when the field loses focus. − and + are skipped by Tab. */
export const Playground: Story = {};

export const InFields: Story = {
  render: function Render() {
    const [a, setA] = useState<number | null>(5);
    const [b, setB] = useState<number | null>(0.5);
    return (
      <div className="flex max-w-sm flex-col gap-3">
        <Field label="Poll every" hint={`1 to 60 minutes · value: ${a ?? "null"}`}>
          <NumberField value={a} onChange={setA} min={1} max={60} unit="min" />
        </Field>
        <Field label="Step 0.25">
          <NumberField value={b} onChange={setB} min={0} max={2} step={0.25} />
        </Field>
        <Field label="Out of range" error="Must be 64 or less.">
          <NumberField defaultValue={80} max={64} unit="GiB" />
        </Field>
        <Field label="Disabled">
          <NumberField defaultValue={3} disabled />
        </Field>
        <Field label="At the limit" hint="+ is disabled at max.">
          <NumberField defaultValue={10} max={10} />
        </Field>
      </div>
    );
  },
};

/** Same height as Input and Button at every size; the steppers are square. */
export const Sizes: Story = {
  render: () => (
    <Measure>
      <div className="flex flex-col gap-3">
        {CONTROL_SIZES.map((s) => (
          <div key={s} className="flex items-center gap-2">
            <span className="w-14 font-mono text-[12px] text-muted-foreground">
              {s} {CONTROL_HEIGHT[s]}px
            </span>
            <NumberField size={s} defaultValue={12} unit="GiB" aria-label={`Size (${s})`} />
            <Input size={s} aria-label={`Name (${s})`} placeholder="Name" className="w-28" />
            <Button size={s}>Apply</Button>
          </div>
        ))}
      </div>
    </Measure>
  ),
};
