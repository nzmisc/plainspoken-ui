import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { Columns2, Funnel } from "@/registry/plainspoken/lib/icons";
import { CONTROL_HEIGHT, CONTROL_SIZES } from "@/registry/plainspoken/lib/controls";
import { Button } from "@/registry/plainspoken/ui/button";
import { Checkbox } from "@/registry/plainspoken/ui/checkbox";
import { Input } from "@/registry/plainspoken/ui/input";
import { MenuButton } from "@/registry/plainspoken/ui/menu-button";
import { Measure } from "../support/measure";

const meta = {
  title: "Components/Controls/Menu button",
  component: MenuButton,
  args: { label: "Columns", children: null, active: false, align: "start" },
  argTypes: {
    variant: { control: "select", options: ["default", "primary", "secondary", "outline", "destructive", "ghost", "link"] },
    size: { control: "select", options: [undefined, "xs", "sm", "md", "lg"] },
    align: { control: "inline-radio", options: ["start", "end"] },
    children: { control: false },
    label: { control: "text" },
  },
} satisfies Meta<typeof MenuButton>;
export default meta;
type Story = StoryObj<typeof meta>;

const COLUMNS = ["Order", "Customer", "Placed", "Items", "Total", "Status"];

function ColumnList() {
  const [shown, setShown] = useState(COLUMNS.slice(0, 4));
  return (
    <fieldset className="flex flex-col">
      <legend className="sr-only">Columns to show</legend>
      {COLUMNS.map((c) => (
        <Checkbox key={c} label={c} className="pr-4" checked={shown.includes(c)} onChange={(e) => setShown(e.target.checked ? [...shown, c] : shown.filter((x) => x !== c))} />
      ))}
    </fieldset>
  );
}

/**
 * Click or press Enter/Space: the panel opens and focus moves to its first control. Tab moves
 * through the panel; Escape closes it and puts focus back on the button; a click outside closes it too.
 */
export const Playground: Story = { render: (args) => <MenuButton {...args}>{<ColumnList />}</MenuButton> };

/** `active` marks a button whose panel holds a filter that is on: a dark border and bold text, not colour alone. */
export const Active: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-2">
      <MenuButton label="Status: all" icon={Funnel}>
        <ColumnList />
      </MenuButton>
      <MenuButton label="Status: Paid" icon={Funnel} active>
        <ColumnList />
      </MenuButton>
    </div>
  ),
};

/** The same height as a button, an input and a select of each size. */
export const Sizes: Story = {
  render: () => (
    <Measure>
      <div className="flex flex-col gap-3">
        {CONTROL_SIZES.map((s) => (
          <div key={s} className={`ctl-${s} flex flex-wrap items-center gap-2`}>
            <span className="w-14 font-mono text-[12px] text-muted-foreground">
              {s} {CONTROL_HEIGHT[s]}px
            </span>
            <Input placeholder="Search orders" aria-label="Search orders" className="w-40" />
            <MenuButton label="Columns" icon={Columns2}>
              <ColumnList />
            </MenuButton>
            <MenuButton label="Status: Paid" active>
              <ColumnList />
            </MenuButton>
            <Button>Export</Button>
          </div>
        ))}
      </div>
    </Measure>
  ),
};

/** align="end" lines the panel up with the button's right edge; near the window's edge it stays inside either way. */
export const AlignEnd: Story = {
  render: () => (
    <div className="flex justify-end">
      <MenuButton label="View" align="end" panelClassName="w-56">
        <ColumnList />
      </MenuButton>
    </div>
  ),
};

/**
 * Inside a scroll box: the panel is in the top layer, so the box doesn't clip it. Near the bottom
 * of the window it opens upwards.
 */
export const InScrollBox: Story = {
  render: () => (
    <div className="h-40 w-72 overflow-auto border border-border p-2">
      <p className="mb-2 text-muted-foreground">This box scrolls.</p>
      <MenuButton label="Columns">
        <ColumnList />
      </MenuButton>
      <div className="h-64" />
    </div>
  ),
};

export const Disabled: Story = {
  render: () => (
    <MenuButton label="Columns" disabled>
      <ColumnList />
    </MenuButton>
  ),
};
