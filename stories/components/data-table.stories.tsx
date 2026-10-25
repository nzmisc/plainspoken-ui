import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { Trash } from "@/registry/plainspoken/lib/icons";
import { Button } from "@/registry/plainspoken/ui/button";
import { DataTable, type DataColumn } from "@/registry/plainspoken/ui/data-table";
import { Measure } from "../support/measure";
import { bytes, dateTime, makeProcRows, type ProcRow } from "./data-table.fixtures";

const rows = makeProcRows();

const columns: DataColumn<ProcRow>[] = [
  { key: "pid", header: "PID", type: "number", value: (r) => r.pid },
  { key: "command", header: "Command", type: "text", value: (r) => r.command, render: (r) => <code className="text-[13px]">{r.command}</code>, className: "whitespace-nowrap" },
  {
    key: "args",
    header: "Arguments",
    type: "text",
    value: (r) => r.args,
    render: (r) => (
      <code className="block max-w-[28ch] truncate text-[13px] text-muted-foreground" title={r.args}>
        {r.args}
      </code>
    ),
  },
  { key: "user", header: "User", type: "enum", value: (r) => r.user },
  { key: "unit", header: "Unit", type: "text", value: (r) => r.unit, defaultHidden: true, className: "whitespace-nowrap" },
  { key: "state", header: "State", type: "enum", value: (r) => r.state, options: ["running", "sleeping", "idle", "stopped", "zombie"] },
  { key: "cpu", header: "CPU %", type: "number", value: (r) => r.cpu, format: (v) => (v as number).toFixed(1) },
  { key: "mem", header: "Memory", type: "number", value: (r) => r.mem, format: (v) => (v ? bytes(v as number) : "0") },
  { key: "threads", header: "Threads", type: "number", value: (r) => r.threads, defaultHidden: true },
  { key: "port", header: "Port", type: "number", value: (r) => r.port, format: (v) => (v == null ? "" : String(v)) },
  { key: "proto", header: "Proto", type: "enum", value: (r) => r.proto, defaultHidden: true },
  { key: "bind", header: "Bind", type: "text", value: (r) => r.bind, render: (r) => (r.bind ? <code className="text-[13px]">{r.bind}</code> : null) },
  { key: "exposure", header: "Reachable from", type: "enum", value: (r) => r.exposure, options: ["public", "tailnet", "local", "none"] },
  { key: "started", header: "Started", type: "date", value: (r) => r.started, format: (v) => dateTime(v as number), className: "whitespace-nowrap" },
];

const meta = {
  title: "Components/Data display/Data table",
  component: DataTable<ProcRow>,
  args: { columns, rows, rowKey: (r: ProcRow) => String(r.pid), label: "Processes", selectable: true },
  argTypes: { columns: { control: false }, rows: { control: false }, rowKey: { control: false } },
  parameters: { layout: "padded" },
} satisfies Meta<typeof DataTable<ProcRow>>;
export default meta;
type Story = StoryObj<typeof meta>;

/**
 * 200 processes. Try: click "CPU %", then shift-click "User" to add a second level; open State's
 * funnel and untick "idle"; drag the edge of Command to widen it; shift-click two checkboxes to
 * select the range, then Export. Without a mouse: Tab to a header and press Enter to sort, Alt+↓
 * for its filter, Tab once more to its edge and ← → to resize; the "Sorted by" line adds, flips,
 * moves and removes levels.
 */
export const Processes: Story = {};

/** Sorted by two keys from the start, so the key numbers in the headers and the sort bar show. */
export const MultiSort: Story = {
  args: {
    initialSort: [
      { key: "user", dir: "asc" },
      { key: "mem", dir: "desc" },
    ],
  },
};

/**
 * Filters in the table's earlier shapes (an enum list, a number minimum, a regular expression),
 * which still work: they show as chips in the toolbar, and open in the Excel-style filter.
 */
export const Filtered: Story = {
  args: {
    initialFilters: {
      state: { kind: "enum", values: ["running", "sleeping"] },
      mem: { kind: "number", min: String(100 * 1024 * 1024), max: "" },
      command: { kind: "text", q: "^(node|claude|chrome)", regex: true },
    },
    initialSort: [{ key: "mem", dir: "desc" }],
  },
};

/** A regular expression that doesn't compile filters nothing; opening Command's filter shows the error under the condition. */
export const BadRegex: Story = {
  args: { initialFilters: { command: { kind: "text", q: "node(", regex: true } } },
};

/** Nothing matches: the body offers to clear the filters. */
export const NoMatches: Story = { args: { initialQuick: "mysqld" } };

/** No rows at all, with the empty-state slot. */
export const Empty: Story = { args: { rows: [], empty: "No processes yet. Start a service to see it here." } };

export const Comfortable: Story = { args: { initialDensity: "comfortable" } };

/**
 * Excel-style filters, as plain data: a list of values (State), two conditions joined by "or"
 * (CPU % under 1 or over 30: the idle and the busy), a rank (Memory in the top 50) and a date
 * period (Started this week). Each shows as a chip; click it to edit, × to remove, "Clear all
 * filters" for all of them.
 */
export const ExcelFilters: Story = {
  args: {
    now: Date.UTC(2026, 9, 19, 12, 0),
    initialFilters: {
      state: { kind: "values", values: ["running", "sleeping", "idle"] },
      cpu: {
        kind: "conditions",
        conditions: [
          { op: "lt", value: "1" },
          { op: "gt", value: "30" },
        ],
        join: "or",
      },
      mem: { kind: "conditions", conditions: [{ op: "top", count: 50 }] },
      started: { kind: "conditions", conditions: [{ op: "period", period: "thisWeek" }] },
    },
    initialSort: [{ key: "cpu", dir: "desc" }],
  },
};

/**
 * Columns with widths from the start (`width`, with `minWidth` and `maxWidth`), and the widths
 * the table reports through `onWidthsChange` shown under it. Drag an edge, double-click it to fit,
 * or use the keys; "Reset widths" is in the Columns menu.
 */
export const Resizing: Story = {
  args: {
    columns: columns.map((c) => ({ ...c, width: c.type === "number" ? 96 : c.key === "args" ? 220 : 140, minWidth: 64, maxWidth: 480 })),
    pageSizes: [10],
  },
  render: function Render(args) {
    const [widths, setWidths] = useState<Record<string, number> | null>(null);
    return (
      <div className="flex flex-col gap-2">
        <DataTable {...args} onWidthsChange={setWidths} />
        <p className="font-mono text-[12px] text-muted-foreground">{widths ? JSON.stringify(widths) : "Resize a column to see its widths here."}</p>
      </div>
    );
  },
};

/** A totals row under the table, over every row the filters leave: `summary: "sum"` or `"average"`, or a function. */
export const Totals: Story = {
  args: {
    columns: columns.map((c) =>
      c.key === "cpu" ? { ...c, summary: "average" as const } : c.key === "mem" || c.key === "threads" ? { ...c, summary: "sum" as const } : c.key === "port" ? { ...c, summary: (r: ProcRow[]) => `${r.filter((x) => x.port != null).length} listening` } : c,
    ),
    initialFilters: { user: { kind: "values", values: ["ana"] } },
  },
};

/**
 * 5,000 rows on one page with `windowed`: only the rows in view are drawn. Measured in a
 * production build, a sort takes about as long as with 50 rows on a page (70–120 ms) instead of
 * two seconds with every row drawn.
 */
export const Windowed: Story = { args: { rows: makeProcRows(5000, 3), windowed: true, pageSizes: [0], maxHeight: "30rem" } };

/** Only some exports: `exportFormats={["xlsx", "copy"]}`. With rows ticked, the menu offers "only the selected" or the whole view. */
export const ExportFormats: Story = { args: { exportFormats: ["xlsx", "copy"] } };

/** Just the listeners, in a short scroll box, without selection or paging. */
export const Listeners: Story = {
  args: {
    rows: rows.filter((r) => r.port != null),
    selectable: false,
    initialSort: [{ key: "port", dir: "asc" }],
    pageSizes: [0],
    maxHeight: "16rem",
  },
};

/** Every part of the chrome off: a plain table whose headers sort. */
export const Plain: Story = {
  args: {
    rows: rows.filter((r) => r.port != null),
    selectable: false,
    quickFilter: false,
    columnFilters: false,
    columnPicker: false,
    densityToggle: false,
    exportable: false,
    sortBar: false,
    resizableColumns: false,
    pageSizes: [0],
    maxHeight: "none",
  },
};

/** Selection held outside (`selected`, `onSelectionChange`), with bulk actions in the selection bar and a toolbar action. */
export const BulkActions: Story = {
  render: function Render(args) {
    const [list, setList] = useState(rows.slice(0, 40));
    const [selected, setSelected] = useState<Set<string>>(() => new Set());
    return (
      <DataTable
        {...args}
        rows={list}
        selected={selected}
        onSelectionChange={setSelected}
        columnFilters={false}
        exportable={false}
        selectionActions={(chosen) => (
          <Button
            variant="destructive"
            icon={Trash}
            onClick={() => {
              const gone = new Set(chosen.map((r) => r.pid));
              setList((l) => l.filter((r) => !gone.has(r.pid)));
              setSelected(new Set());
            }}
          >
            Kill {chosen.length}
          </Button>
        )}
        actions={<Button onClick={() => setList(rows.slice(0, 40))}>Restore</Button>}
      />
    );
  },
};

/** The toolbar, sort bar and paging are sm (24px), the filter buttons in the headers 20px. */
export const ControlHeights: Story = {
  args: {
    rows: rows.slice(0, 8),
    initialSort: [
      { key: "user", dir: "asc" },
      { key: "cpu", dir: "desc" },
    ],
    pageSizes: [5, 0],
    initialFilters: { state: { kind: "enum", values: ["sleeping"] } },
  },
  render: (args) => (
    <Measure>
      <DataTable {...args} />
    </Measure>
  ),
};

/** At phone width the table scrolls sideways inside its box, and the toolbar wraps. */
export const PhoneWidth: Story = {
  decorators: [
    (S) => (
      <div className="w-[343px]">
        <S />
      </div>
    ),
  ],
};

/**
 * `onRowClick`: the first cell (PID) becomes a button, the keyboard way in (Tab to it, Enter), and
 * a click anywhere else on the row does the same; the checkbox and other controls keep their own
 * clicks. The last row opened shows under the table.
 */
export const ClickableRows: Story = {
  args: { pageSizes: [10] },
  render: function Render(args) {
    const [opened, setOpened] = useState<ProcRow | null>(null);
    return (
      <div className="flex flex-col gap-2">
        <DataTable {...args} onRowClick={setOpened} />
        <p role="status" className="text-[14px]">
          {opened ? (
            <>
              Opened <code>{opened.command}</code> (PID {opened.pid})
            </>
          ) : (
            "Click a row."
          )}
        </p>
      </div>
    );
  },
};

/** `rowHref`: the first cell is a real link to the row's page (Ctrl/Cmd-click a row for a new tab). With Next.js add `linkAs={NextLink}`. */
export const RowLinks: Story = {
  args: { pageSizes: [10], selectable: false, rowHref: (r: ProcRow) => `#process-${r.pid}` },
};
