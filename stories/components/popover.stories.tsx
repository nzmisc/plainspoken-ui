import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { Copy, Info, Settings2 } from "@/registry/plainspoken/lib/icons";
import { Button } from "@/registry/plainspoken/ui/button";
import { Checkbox } from "@/registry/plainspoken/ui/checkbox";
import { Input } from "@/registry/plainspoken/ui/input";
import { Popover } from "@/registry/plainspoken/ui/popover";
import { Select } from "@/registry/plainspoken/ui/select";

/**
 * Keyboard: Tab to the button and press Enter or Space; focus moves to the first control inside.
 * Escape closes it and puts focus back on the button; so does a click outside (focus stays where
 * you clicked). Stories that start open are left off the docs page, where only one popover can be
 * open at a time.
 */
const meta = {
  title: "Components/Overlays/Popover",
  component: Popover,
  args: { trigger: "Details", title: "Delivery", children: "Ships from Gothenburg within 2 working days." },
  argTypes: {
    side: { control: "select", options: ["top", "right", "bottom", "left"] },
    align: { control: "select", options: ["start", "center", "end"] },
    size: { control: "select", options: [undefined, "xs", "sm", "md", "lg"] },
    triggerVariant: { control: "select", options: ["default", "primary", "secondary", "outline", "ghost"] },
    trigger: { control: "text" },
    children: { control: "text" },
  },
  decorators: [(Story) => <div className="min-h-64">{Story()}</div>],
} satisfies Meta<typeof Popover>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Every simple prop in the Controls panel. */
export const Playground: Story = {};

function FilterFormDemo({ defaultOpen }: { defaultOpen?: boolean }) {
  const none = { status: "Any", unpaid: false, min: "" };
  const [applied, setApplied] = useState(none);
  const [draft, setDraft] = useState(none);
  const n = (applied.status !== "Any" ? 1 : 0) + (applied.unpaid ? 1 : 0) + (applied.min ? 1 : 0);
  return (
    <div className="flex items-center gap-3">
      <Popover trigger={n ? `Filter (${n})` : "Filter"} chevron title="Filter orders" defaultOpen={defaultOpen} onOpenChange={(o) => o && setDraft(applied)}>
        {(close) => (
          <form
            className="flex flex-col gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              setApplied(draft);
              close();
            }}
          >
            <label className="flex items-center justify-between gap-4">
              Status
              <Select value={draft.status} onChange={(e) => setDraft({ ...draft, status: e.target.value })} options={["Any", "Paid", "Shipped", "Refunded"]} />
            </label>
            <label className="flex items-center justify-between gap-4">
              Total at least
              <Input prefix="€" inputMode="decimal" value={draft.min} onChange={(e) => setDraft({ ...draft, min: e.target.value })} className="w-24" inputClassName="text-right" />
            </label>
            <Checkbox label="Unpaid only" checked={draft.unpaid} onChange={(e) => setDraft({ ...draft, unpaid: e.target.checked })} />
            <span className="flex justify-end gap-2 border-t border-border pt-2">
              <Button onClick={() => setDraft(none)}>Reset</Button>
              <Button type="submit" variant="primary">
                Apply
              </Button>
            </span>
          </form>
        )}
      </Popover>
      <code className="font-mono text-[12px] text-muted-foreground">{JSON.stringify(applied)}</code>
    </div>
  );
}

/** A small form. Apply closes it (children as a function get `close`); Escape or a click outside closes it without applying. */
export const FilterForm: Story = { render: () => <FilterFormDemo /> };

/** The same, open on load. */
export const FilterFormOpen: Story = { tags: ["!autodocs"], render: () => <FilterFormDemo defaultOpen /> };

/** Plain information with an arrow and no title bar, from a ghost icon button. */
export const InfoWithArrow: Story = {
  tags: ["!autodocs"],
  args: {
    trigger: Info,
    triggerVariant: "ghost",
    size: "sm",
    label: "About the balance",
    title: undefined,
    arrow: true,
    defaultOpen: true,
    className: "w-72",
    children: (
      <p>
        What you can pay out today: sales minus refunds, fees and payouts on their way.{" "}
        <a href="#payouts" className="text-link underline visited:text-link-visited">
          Payout schedule
        </a>
      </p>
    ),
  },
  decorators: [(Story) => <div className="pl-24">{Story()}</div>],
};

/** Above its button, aligned to the button's end, as from a bottom-right toolbar. */
export const AboveEndAligned: Story = {
  tags: ["!autodocs"],
  args: {
    trigger: "Share",
    side: "top",
    align: "end",
    arrow: true,
    defaultOpen: true,
    title: "Share link",
    children: (
      <span className="flex gap-2">
        <Input readOnly aria-label="Link" value="https://northwind.example/p/q3-plan" className="w-64" inputClassName="font-mono text-[12px]" />
        <Button icon={Copy}>Copy</Button>
      </span>
    ),
  },
  decorators: [(Story) => <div className="flex min-h-48 items-end justify-end">{Story()}</div>],
};

/** The panel takes the trigger's size: from an sm toolbar button, the controls inside are sm too. */
export const SmallFromToolbar: Story = {
  tags: ["!autodocs"],
  render: () => (
    <div className="flex items-center gap-1 border border-border bg-muted p-1 ctl-sm">
      <Button>Refresh</Button>
      <Popover trigger={Settings2} label="Chart settings" defaultOpen title="Chart">
        <div className="flex flex-col gap-2">
          <label className="flex items-center justify-between gap-4">
            Range
            <Select options={["24 hours", "7 days", "30 days"]} />
          </label>
          <Checkbox label="Show average" defaultChecked />
        </div>
      </Popover>
    </div>
  ),
};

/** Near the right edge of a phone it shifts left to stay on screen. */
export const NearEdge: Story = {
  tags: ["!autodocs"],
  globals: { viewport: { value: "iphoneSE" } },
  args: { trigger: "Details", defaultOpen: true, className: "w-80" },
  decorators: [(Story) => <div className="flex justify-end">{Story()}</div>],
};
