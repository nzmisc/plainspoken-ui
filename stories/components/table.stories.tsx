import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Button } from "@/registry/plainspoken/ui/button";
import {
  SimpleTable,
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
  type TableColumn,
} from "@/registry/plainspoken/ui/table";
import { Measure } from "../support/measure";

type Row = { name: string; size: number; note: string };
const ROWS: Row[] = [
  { name: "alpha", size: 12.5, note: "short" },
  { name: "beta", size: 1024, note: "a longer note that shows how text wraps inside a cell" },
  { name: "gamma", size: 3, note: "" },
];
const COLUMNS: TableColumn<Row>[] = [
  { key: "name", header: "Name", cell: (r) => <code className="font-mono text-[13px]">{r.name}</code> },
  { key: "size", header: "Size (MiB)", numeric: true, cell: (r) => r.size.toFixed(1) },
  { key: "note", header: "Note", cell: (r) => r.note },
  { key: "wide", header: "Wide only", className: "hidden sm:table-cell", cell: () => "sm and up" },
];

const meta = {
  title: "Components/Data display/Table",
  component: Table,
  args: { density: "default", rules: "grid", frameless: false, stickyHeader: false },
  argTypes: {
    density: { control: "inline-radio", options: ["compact", "default", "relaxed"] },
    rules: { control: "inline-radio", options: ["grid", "rows"] },
  },
  decorators: [(S) => <div className="max-w-2xl"><S /></div>],
} satisfies Meta<typeof Table>;
export default meta;
type Story = StoryObj<typeof meta>;

/** The primitives, with a caption, a footer and numbers. Try density and rules in the controls. */
export const Playground: Story = {
  render: (args) => (
    <Table {...args}>
      <TableCaption>Disks on the server, 25 October 2026.</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Mount</TableHead>
          <TableHead>FS</TableHead>
          <TableHead>Size</TableHead>
          <TableHead>Used</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell className="font-mono text-[13px]">/</TableCell>
          <TableCell>ext4</TableCell>
          <TableCell numeric>290 GiB</TableCell>
          <TableCell numeric>8%</TableCell>
        </TableRow>
        <TableRow data-state="selected">
          <TableCell className="font-mono text-[13px]">/boot</TableCell>
          <TableCell>ext4</TableCell>
          <TableCell numeric>880 MiB</TableCell>
          <TableCell numeric>27%</TableCell>
        </TableRow>
        <TableRow>
          <TableCell className="font-mono text-[13px]">/boot/efi</TableCell>
          <TableCell>vfat</TableCell>
          <TableCell numeric>104 MiB</TableCell>
          <TableCell numeric>6%</TableCell>
        </TableRow>
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell colSpan={2}>Total</TableCell>
          <TableCell numeric>291 GiB</TableCell>
          <TableCell />
        </TableRow>
      </TableFooter>
    </Table>
  ),
};

/** SimpleTable: columns and rows in. The last column only shows from sm up. */
export const Simple: Story = { render: () => <SimpleTable columns={COLUMNS} rows={ROWS} rowKey={(r) => r.name} /> };

export const Empty: Story = { render: () => <SimpleTable columns={COLUMNS} rows={[]} rowKey={(r) => r.name} empty="Nothing here yet." /> };

/** Wider than its box: the table scrolls sideways on its own, the page doesn't. */
export const Overflowing: Story = {
  decorators: [(S) => <div className="w-56 border border-dashed border-border"><S /></div>],
  render: () => <SimpleTable columns={COLUMNS} rows={ROWS} rowKey={(r) => r.name} />,
};

/** Row height per density, with row actions at the size that fits: xs in compact, sm otherwise. */
export const DensityWithControls: Story = {
  render: () => (
    <Measure guides={false}>
      <div className="flex flex-col gap-4">
        {(["compact", "default", "relaxed"] as const).map((d) => (
          <Table key={d} density={d}>
            <TableBody>
              {ROWS.slice(0, 2).map((r) => (
                <TableRow key={r.name}>
                  <TableCell>
                    {d} · {r.name}
                  </TableCell>
                  <TableCell numeric>{r.size}</TableCell>
                  <TableCell className={d === "compact" ? "ctl-xs py-0" : "ctl-sm py-0 align-middle"}>
                    <Button variant="ghost">Open</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ))}
      </div>
    </Measure>
  ),
};

/** stickyHeader with a height on the wrapper: the header stays while the rows scroll. */
export const StickyHeader: Story = {
  render: () => (
    <SimpleTable
      stickyHeader
      wrapperClassName="max-h-48 overflow-y-auto"
      columns={COLUMNS.slice(0, 3)}
      rows={Array.from({ length: 20 }, (_, i) => ({ name: `row-${i + 1}`, size: i * 3.5, note: i % 3 ? "" : "every third" }))}
      rowKey={(r) => r.name}
    />
  ),
};
