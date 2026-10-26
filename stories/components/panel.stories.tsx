import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { RefreshCw } from "@/registry/plainspoken/lib/icons";
import { Button, IconButton } from "@/registry/plainspoken/ui/button";
import { Panel } from "@/registry/plainspoken/ui/panel";
import { Select } from "@/registry/plainspoken/ui/select";
import { SimpleTable } from "@/registry/plainspoken/ui/table";
import { Measure } from "../support/measure";

const meta = {
  title: "Components/Layout/Panel",
  component: Panel,
  args: { title: "Memory", meta: "last 10 min", children: <p>Body. The padding is 8px.</p> },
  argTypes: { actions: { control: false } },
  decorators: [(S) => <div className="max-w-xl"><S /></div>],
} satisfies Meta<typeof Panel>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/** Controls in the title bar default to sm, which fits the 29px bar exactly. */
export const WithActions: Story = {
  args: {
    meta: "updated 3 s ago",
    actions: (
      <>
        <Select aria-label="Range" defaultValue="7d" options={[{ value: "24h", label: "24 hours" }, { value: "7d", label: "7 days" }]} />
        <IconButton variant="ghost" icon={RefreshCw} label="Refresh" />
      </>
    ),
  },
  render: (args) => (
    <Measure>
      <Panel {...args} />
    </Measure>
  ),
};

/** Side by side, with and without controls: the title bars are the same height, so the bodies start level. */
export const SideBySide: Story = {
  decorators: [(S) => <div className="max-w-3xl"><S /></div>],
  render: () => (
    <div className="grid grid-cols-2 gap-3">
      <Panel title="CPU" meta="8 cores" actions={<Button>Details</Button>}>
        <p>12% average</p>
      </Panel>
      <Panel title="Memory" meta="24 GB">
        <p>9.1 GB used</p>
      </Panel>
    </div>
  ),
};

/** flush: no body padding, for a frameless table. */
export const Flush: Story = {
  args: {
    flush: true,
    title: "Disks",
    meta: undefined,
    children: (
      <SimpleTable
        frameless
        rowKey={(r) => r.mount}
        rows={[
          { mount: "/", size: "290 GiB", used: "8%" },
          { mount: "/boot", size: "880 MiB", used: "27%" },
        ]}
        columns={[
          { key: "mount", header: "Mount", cell: (r) => <code>{r.mount}</code> },
          { key: "size", header: "Size", numeric: true, cell: (r) => r.size },
          { key: "used", header: "Used", numeric: true, cell: (r) => r.used },
        ]}
      />
    ),
  },
};

/** Narrow: meta and actions wrap under the title. */
export const Narrow: Story = {
  args: { meta: "meta text that wraps on narrow screens", actions: <Button>Action</Button> },
  decorators: [(S) => <div className="w-64"><S /></div>],
};
