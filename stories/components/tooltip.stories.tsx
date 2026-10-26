import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Copy, Download, RefreshCw, Trash } from "@/registry/plainspoken/lib/icons";
import { Button, IconButton } from "@/registry/plainspoken/ui/button";
import { Tooltip } from "@/registry/plainspoken/ui/tooltip";

/**
 * Hover (it opens after 500 ms) or Tab to the button (at once). Escape hides it; moving the pointer
 * onto the tooltip keeps it open. Touch never opens it.
 */
const meta = {
  title: "Components/Overlays/Tooltip",
  component: Tooltip,
  args: { content: "Copy the address to the clipboard", children: <Button icon={Copy}>Copy</Button> },
  argTypes: { side: { control: "select", options: ["top", "right", "bottom", "left"] }, children: { control: false } },
  decorators: [(Story) => <div className="p-10">{Story()}</div>],
} satisfies Meta<typeof Tooltip>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Every simple prop in the Controls panel. */
export const Playground: Story = {};

/** Open on load, to look at. */
export const Open: Story = { tags: ["!autodocs"], args: { defaultOpen: true } };

/**
 * Icon buttons: the tooltip shows the name for eyes; the button's own label is what screen readers
 * hear, and since the tooltip says the same, it isn't read a second time. The button's `title` is
 * dropped so the browser's tooltip doesn't show as well.
 */
export const IconButtons: Story = {
  render: () => (
    <div className="flex gap-1">
      {(
        [
          [RefreshCw, "Refresh"],
          [Copy, "Copy"],
          [Download, "Download CSV"],
          [Trash, "Delete"],
        ] as const
      ).map(([icon, text]) => (
        <Tooltip key={text} content={text}>
          <IconButton icon={icon} label={text} variant="ghost" />
        </Tooltip>
      ))}
    </div>
  ),
};

/** Each side, all open. Near an edge a tooltip flips to the other side instead of being cut off. */
export const Sides: Story = {
  tags: ["!autodocs"],
  render: () => (
    <div className="grid w-fit grid-cols-2 gap-x-24 gap-y-14 py-8 pl-24">
      {(["top", "right", "bottom", "left"] as const).map((s) => (
        <Tooltip key={s} side={s} content={`side="${s}"`} defaultOpen>
          <Button>{s}</Button>
        </Tooltip>
      ))}
    </div>
  ),
};

/** Long text wraps at 16rem. */
export const LongText: Story = {
  tags: ["!autodocs"],
  args: {
    defaultOpen: true,
    content: "Average time from an order being placed to it leaving the warehouse, over the last 30 days, weekends left out.",
    children: <Button>Dispatch time</Button>,
  },
};

/** Inside running text. Plain text needs tabIndex so keyboard users can reach the hint. */
export const InText: Story = {
  render: () => (
    <p className="max-w-prose">
      Invoices are sent as{" "}
      <Tooltip content="PDF/A-3 with the invoice data embedded as XML">
        <abbr tabIndex={0} className="cursor-help underline decoration-dotted underline-offset-2">
          ZUGFeRD
        </abbr>
      </Tooltip>{" "}
      files.
    </p>
  ),
};

/** Disabled buttons get no pointer or focus events, so the tooltip goes on a focusable wrapper. */
export const OnDisabledButton: Story = {
  render: () => (
    <Tooltip content="Add at least one recipient first">
      <span tabIndex={0} className="inline-flex">
        <Button variant="primary" disabled className="pointer-events-none">
          Send
        </Button>
      </span>
    </Tooltip>
  ),
};
