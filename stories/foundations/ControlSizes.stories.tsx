import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { Plus, Search } from "@/registry/plainspoken/lib/icons";
import { CONTROL_HEIGHT, CONTROL_SIZES } from "@/registry/plainspoken/lib/controls";
import { Button, IconButton } from "@/registry/plainspoken/ui/button";
import { Checkbox } from "@/registry/plainspoken/ui/checkbox";
import { Chip } from "@/registry/plainspoken/ui/chip";
import { Input } from "@/registry/plainspoken/ui/input";
import { SegmentedControl } from "@/registry/plainspoken/ui/segmented-control";
import { Select } from "@/registry/plainspoken/ui/select";
import { Measure } from "../support/measure";

/**
 * The one height scale: xs 20, sm 24, md 28, lg 36px. Every control of one size is exactly that
 * tall, border included. The guides measure each row as rendered: a gray number means every
 * control in the row is one height; red means they differ.
 */
const meta: Meta<{ guides: boolean }> = {
  title: "Foundations/Control sizes",
  args: { guides: true },
  argTypes: { guides: { control: "boolean", description: "Height guides and per-row heights" } },
};
export default meta;
type Story = StoryObj<{ guides: boolean }>;

function Row({ size }: { size: (typeof CONTROL_SIZES)[number] }) {
  const [seg, setSeg] = useState("a");
  return (
    <div className={`ctl-${size} flex flex-wrap items-center gap-1.5`}>
      <span className="w-14 font-mono text-[12px] text-muted-foreground">
        {size} {CONTROL_HEIGHT[size]}
      </span>
      <Button variant="primary" icon={Plus}>
        New
      </Button>
      <Button>Cancel</Button>
      <Button variant="ghost">Ghost</Button>
      <IconButton icon={Plus} label="Add" />
      <Input prefix={Search} placeholder="Search" aria-label="Search" className="w-32" />
      <Select options={["Open", "Closed"]} aria-label="Status" />
      <SegmentedControl label="View" value={seg} onChange={setSeg} options={[{ value: "a", label: "List" }, { value: "b", label: "Grid" }]} />
      <Chip pressed={false} onPressedChange={() => {}}>
        Mine
      </Chip>
      <Checkbox label="Live" />
    </div>
  );
}

/** Every kind of control at every size, set by a ctl-* class on the row. */
export const AllControls: Story = {
  render: ({ guides }) => (
    <Measure guides={guides}>
      <div className="flex flex-col gap-3">
        {CONTROL_SIZES.map((s) => (
          <Row key={s} size={s} />
        ))}
      </div>
    </Measure>
  ),
};

/** A size class on a container sets everything inside; a control's own size prop wins. */
export const Inheritance: Story = {
  render: ({ guides }) => (
    <Measure guides={guides}>
      <div className="ctl-sm flex items-center gap-1.5 border border-border p-1">
        <span className="text-[12px] text-muted-foreground">ctl-sm toolbar:</span>
        <Button>Inherits sm</Button>
        <Input aria-label="Filter" placeholder="Inherits sm" className="w-28" />
      </div>
      <div className="ctl-sm mt-3 flex items-center gap-1.5 border border-border p-1">
        <span className="text-[12px] text-muted-foreground">same toolbar, one lg:</span>
        <Button size="lg" variant="primary">
          Own size lg
        </Button>
      </div>
    </Measure>
  ),
};
