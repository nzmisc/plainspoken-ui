import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { Copy, Download, Link, Pencil, Share2, Trash } from "@/registry/plainspoken/lib/icons";
import { Button } from "@/registry/plainspoken/ui/button";
import { Checkbox } from "@/registry/plainspoken/ui/checkbox";
import { Drawer, type DrawerProps, type DrawerSide } from "@/registry/plainspoken/ui/drawer";
import { Field } from "@/registry/plainspoken/ui/field";
import { Icon } from "@/registry/plainspoken/ui/icon";
import { Select } from "@/registry/plainspoken/ui/select";

/**
 * Most stories open on load; close and reopen with the button. They are left off the docs page,
 * since an open modal makes the rest of the page inert. Keyboard as in Dialog: focus starts on the
 * first control, Tab stays inside, Escape closes, focus goes back to the button.
 */
const meta = {
  title: "Components/Overlays/Drawer",
  component: Drawer,
  args: { open: false, onClose: () => {}, title: "" },
} satisfies Meta<typeof Drawer>;
export default meta;
type Story = StoryObj<typeof meta>;

function useOpen(initial = true) {
  const [open, setOpen] = useState(initial);
  return { open, show: () => setOpen(true), hide: () => setOpen(false) };
}

const FACTS = [
  ["Customer", "Hannah Lindqvist"],
  ["Placed", "23 October 2026, 14:02"],
  ["Payment", "Visa ending 4242"],
  ["Ship to", "Sveavägen 44, 111 34 Stockholm"],
  ["Carrier", "PostNord"],
];

function Details({ initial = true, ...props }: Partial<DrawerProps> & { initial?: boolean }) {
  const d = useOpen(initial);
  return (
    <>
      <Button onClick={d.show}>Order NW-20418</Button>
      <Drawer
        open={d.open}
        onClose={d.hide}
        title="Order NW-20418"
        description="Paid · ready to ship"
        footer={
          <>
            <Button variant="destructive" className="mr-auto">
              Refund
            </Button>
            <Button onClick={d.hide}>Close</Button>
          </>
        }
        {...props}
      >
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
          {FACTS.map(([k, v]) => (
            <div key={k} className="contents">
              <dt className="text-muted-foreground">{k}</dt>
              <dd>{v}</dd>
            </div>
          ))}
        </dl>
        <h3 className="mt-4 mb-1 font-bold">History</h3>
        <ol className="flex flex-col">
          {Array.from({ length: 30 }, (_, i) => (
            <li key={i} className="border-b border-border py-1 tabular-nums">
              {`23 Oct, ${String(14 + Math.floor(i / 6)).padStart(2, "0")}:${String((i * 7) % 60).padStart(2, "0")}`} ·{" "}
              {["Order placed", "Payment authorised", "Picked", "Packed", "Label printed", "Handed to carrier"][i % 6]}
            </li>
          ))}
        </ol>
      </Drawer>
    </>
  );
}

/** Closed: the button opens it. */
export const Closed: Story = { render: () => <Details initial={false} /> };

/** The details of one thing, from the right. The body scrolls; the footer stays. */
export const Right: Story = { tags: ["!autodocs"], render: () => <Details /> };

function FiltersStory() {
  const d = useOpen();
  return (
    <>
      <Button onClick={d.show}>Filters</Button>
      <Drawer
        side="left"
        open={d.open}
        onClose={d.hide}
        title="Filter issues"
        className="w-[22rem]"
        footer={
          <>
            <Button className="mr-auto">Reset</Button>
            <Button variant="primary" onClick={d.hide}>
              Apply
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <fieldset className="border border-border px-3 pb-2">
            <legend className="px-1 font-medium">Status</legend>
            {["Open", "In review", "Blocked", "Done"].map((s, i) => (
              <Checkbox key={s} label={s} defaultChecked={i < 2} className="flex" />
            ))}
          </fieldset>
          <Field label="Assignee">
            <Select options={["Anyone", "Me", "Unassigned", "Priya Raman"]} />
          </Field>
        </div>
      </Drawer>
    </>
  );
}

/** Filters from the left, narrower than the default 26rem, with Reset and Apply in the footer. */
export const LeftFilters: Story = { tags: ["!autodocs"], render: () => <FiltersStory /> };

function SheetStory() {
  const d = useOpen();
  const row = "flex min-h-11 w-full cursor-pointer items-center gap-3 border-b border-border px-3 text-left hover:bg-secondary active:bg-accent";
  return (
    <>
      <Button onClick={d.show}>Q3 budget.xlsx</Button>
      <Drawer side="bottom" open={d.open} onClose={d.hide} title="Q3 budget.xlsx" bodyClassName="p-0">
        {[
          ["Share", Share2],
          ["Copy link", Link],
          ["Make a copy", Copy],
          ["Rename", Pencil],
          ["Download", Download],
        ].map(([label, icon]) => (
          <button key={label as string} type="button" className={row} onClick={d.hide}>
            <Icon icon={icon as typeof Share2} className="text-muted-foreground" />
            {label as string}
          </button>
        ))}
        <button type="button" className={`${row} border-b-0 text-destructive`} onClick={d.hide}>
          <Icon icon={Trash} />
          Move to Trash
        </button>
      </Drawer>
    </>
  );
}

/** A bottom sheet of actions, the phone-friendly menu. Clears the iPhone home bar. */
export const BottomSheet: Story = { tags: ["!autodocs"], render: () => <SheetStory /> };

function SidesStory() {
  const [side, setSide] = useState<DrawerSide | null>(null);
  return (
    <div className="flex gap-2">
      {(["top", "right", "bottom", "left"] as const).map((s) => (
        <Button key={s} onClick={() => setSide(s)}>
          {s}
        </Button>
      ))}
      <Drawer open={side != null} onClose={() => setSide(null)} side={side ?? "right"} title={`side="${side}"`} footer={<Button onClick={() => setSide(null)}>Close</Button>}>
        <p>Slides in from the {side}. On a phone it comes up from the bottom, unless sheetOnPhone is off.</p>
      </Drawer>
    </div>
  );
}

/** Every side. Each slides in from its edge (unless reduced motion is on). */
export const Sides: Story = { render: () => <SidesStory /> };

/** On a phone a side drawer comes up from the bottom as a sheet. */
export const Phone: Story = { tags: ["!autodocs"], globals: { viewport: { value: "iphoneSE" } }, render: () => <Details /> };

/** With sheetOnPhone off, a left drawer stays on the left on a phone too (navigation). */
export const PhoneStaysOnSide: Story = {
  tags: ["!autodocs"],
  globals: { viewport: { value: "iphoneSE" } },
  render: () => <Details side="left" sheetOnPhone={false} className="w-[85vw]" />,
};
