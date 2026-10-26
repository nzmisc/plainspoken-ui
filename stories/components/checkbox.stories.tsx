import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { Button } from "@/registry/plainspoken/ui/button";
import { Checkbox, CheckboxBox } from "@/registry/plainspoken/ui/checkbox";
import { Measure } from "../support/measure";

const meta = {
  title: "Components/Forms/Checkbox",
  component: Checkbox,
  args: { label: "Email me about replies" },
} satisfies Meta<typeof Checkbox>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const States: Story = {
  render: function Render() {
    const [items, setItems] = useState([true, false, true]);
    const all = items.every(Boolean);
    const some = items.some(Boolean) && !all;
    return (
      <div className="flex flex-col">
        <Checkbox label="Select all" checked={all} indeterminate={some} onChange={(e) => setItems(items.map(() => e.target.checked))} />
        {items.map((on, i) => (
          <Checkbox key={i} className="pl-6" label={`Item ${i + 1}`} checked={on} onChange={(e) => setItems(items.map((x, j) => (j === i ? e.target.checked : x)))} />
        ))}
        <Checkbox label="With a description" description="Longer explanation in smaller, muted text under the label." />
        <Checkbox label="Disabled" disabled />
        <Checkbox label="Disabled and checked" disabled defaultChecked />
      </div>
    );
  },
};

/** A checkbox row is a control tall, so it sits level with buttons in a toolbar. */
export const InAToolbar: Story = {
  render: () => (
    <Measure>
      <div className="flex flex-col gap-2">
        {(["xs", "sm", "md", "lg"] as const).map((s) => (
          <div key={s} className={`ctl-${s} flex items-center gap-2 border border-border px-1`}>
            <Button>Refresh</Button>
            <Checkbox label="Auto-refresh" />
          </div>
        ))}
      </div>
    </Measure>
  ),
};

/** CheckboxBox, the box alone (named with aria-label), as in table rows: off, on, some, and disabled, at each size. It is drawn by us, so it is the same square in every browser (iOS would draw a small circle), and never smaller than 14px. */
export const BoxAlone: Story = {
  render: () => (
    <div className="flex flex-col gap-2">
      {(["xs", "sm", "md", "lg"] as const).map((size) => (
        <p key={size} className={`ctl-${size} flex items-center gap-3`}>
          <span className="w-6 text-muted-foreground">{size}</span>
          <CheckboxBox aria-label="Off" />
          <CheckboxBox aria-label="On" defaultChecked />
          <CheckboxBox aria-label="Some" indeterminate />
          <CheckboxBox aria-label="Disabled" disabled />
          <CheckboxBox aria-label="Disabled, on" disabled defaultChecked />
        </p>
      ))}
    </div>
  ),
};
