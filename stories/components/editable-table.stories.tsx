import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { EditableTable, type EditableColumn } from "@/registry/plainspoken/ui/editable-table";

// -------------------------------------------------------------------------------------------------
// Data: a studio's purchases, with a column of every type

interface Purchase {
  id: string;
  item: string;
  category: string | null;
  bought: string | null;
  qty: number | null;
  price: number | null;
  approved: boolean;
  notes: string;
}

const PURCHASES: Purchase[] = [
  { id: "p1", item: "14-inch laptop", category: "Computers", bought: "2027-01-12", qty: 2, price: 1849, approved: true, notes: "For the two new designers" },
  { id: "p2", item: "27-inch monitor", category: "Screens", bought: "2027-01-12", qty: 4, price: 389.5, approved: true, notes: "" },
  { id: "p3", item: "Standing desk", category: "Furniture", bought: "2027-02-03", qty: 1, price: 640, approved: false, notes: "Waiting for a second quote" },
  { id: "p4", item: "Desk chair", category: "Furniture", bought: "2027-02-03", qty: 3, price: 412, approved: true, notes: "" },
  { id: "p5", item: "Font licence, Halden Sans", category: "Software", bought: "2027-02-20", qty: 1, price: 780, approved: true, notes: "Desktop and web, up to 10 users" },
  { id: "p6", item: "USB-C dock", category: "Accessories", bought: null, qty: 5, price: 129, approved: false, notes: "" },
];

const COLUMNS: EditableColumn<Purchase>[] = [
  { key: "item", header: "Item (text)", required: true, width: 190 },
  { key: "category", header: "Category (one of)", type: "select", options: ["Computers", "Screens", "Furniture", "Software", "Accessories"], width: 140 },
  { key: "bought", header: "Bought (date)", type: "date", min: "2027-01-01", max: "2027-12-31" },
  { key: "qty", header: "Qty (number)", type: "number", decimals: 0, min: 1, width: 96, total: "sum" },
  { key: "price", header: "Unit price (money)", type: "money", currency: "EUR", min: 0, width: 132 },
  { key: "total", header: "Total (computed)", type: "money", currency: "EUR", width: 128, compute: (p) => (p.qty ?? 0) * (p.price ?? 0), total: "sum" },
  { key: "approved", header: "Approved (yes/no)", type: "checkbox", width: 130, total: "count" },
  { key: "notes", header: "Notes (long text)", type: "longtext", width: 240, placeholder: "Add a note" },
];

let next = 100;
const newPurchase = (copyOf?: Purchase): Purchase => ({
  ...(copyOf ?? { item: "", category: null, bought: null, qty: 1, price: null, approved: false, notes: "" }),
  id: `p${next++}`,
});

// Invoices with broken values, for the validation story
interface Invoice {
  id: string;
  number: string;
  client: string;
  issued: string | null;
  due: string | null;
  amount: number | null;
}

const INVOICES: Invoice[] = [
  { id: "a", number: "INV-0412", client: "Lindqvist Bakery", issued: "2027-03-01", due: "2027-03-31", amount: 1840 },
  { id: "b", number: "INV-413", client: "Moorfield Cycles", issued: "2027-03-04", due: "2027-04-03", amount: 2390.5 },
  { id: "c", number: "INV-0414", client: "", issued: "2027-03-09", due: "2027-04-08", amount: 760 },
  { id: "d", number: "INV-0415", client: "Harbour Lane Dental", issued: "2027-03-12", due: "2027-03-02", amount: 3200 },
  { id: "e", number: "INV-0416", client: "Okafor & Sons", issued: "2027-03-15", due: "2027-04-14", amount: -45 },
];

const INVOICE_COLUMNS: EditableColumn<Invoice>[] = [
  { key: "number", header: "Invoice", required: true, pattern: /INV-\d{4}/, patternMessage: "Use the form INV-0000", width: 104 },
  { key: "client", header: "Client", required: true, width: 180 },
  { key: "issued", header: "Issued", type: "date", required: true },
  {
    key: "due",
    header: "Due",
    type: "date",
    required: true,
    validate: (due, inv) => (typeof due === "string" && inv.issued && due < inv.issued ? `Due before it was issued (${inv.issued})` : null),
  },
  { key: "amount", header: "Amount", type: "money", currency: "EUR", required: true, min: 0.01, max: 50000, width: 112 },
];

// Many rows: a warehouse's stock, made up the same way every time
interface Stock {
  sku: string;
  name: string;
  site: string;
  qty: number;
  cost: number;
  reorder: boolean;
}
const NOUNS = ["hinge", "bracket", "washer", "castor", "handle", "latch", "spring", "bolt", "rivet", "clamp", "pulley", "gasket"];
const ADJ = ["brass", "steel", "nylon", "zinc", "oak", "rubber", "copper", "alloy"];
const SITES = ["Leeds", "Rotterdam", "Gdańsk", "Porto"];
const STOCK: Stock[] = Array.from({ length: 500 }, (_, i) => ({
  sku: `SKU-${String(10000 + i * 7).padStart(5, "0")}`,
  name: `${ADJ[(i * 5) % ADJ.length]} ${NOUNS[(i * 7) % NOUNS.length]}, ${10 + ((i * 13) % 90)} mm`,
  site: SITES[(i * 3) % SITES.length],
  qty: (i * 37) % 900,
  cost: Math.round(((i * 53) % 4000) + 25) / 100,
  reorder: (i * 37) % 900 < 60,
}));
const STOCK_COLUMNS: EditableColumn<Stock>[] = [
  { key: "sku", header: "SKU", readOnly: true, width: 92 },
  { key: "name", header: "Part", required: true, width: 200 },
  { key: "site", header: "Warehouse", type: "select", options: SITES, width: 110 },
  { key: "qty", header: "In stock", type: "number", decimals: 0, min: 0, width: 84, total: "sum" },
  { key: "cost", header: "Unit cost", type: "money", currency: "EUR", min: 0, width: 92 },
  { key: "value", header: "Stock value", type: "money", currency: "EUR", width: 112, compute: (s) => s.qty * s.cost, total: "sum" },
  { key: "reorder", header: "Reorder", type: "checkbox", width: 76, total: "count" },
];

/** Runs `act` on the story's grid once it has drawn: paste, start editing. */
function After({ act, children }: { act: (grid: HTMLElement) => void; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const t = window.setTimeout(() => {
      const grid = ref.current?.querySelector<HTMLElement>("[role=grid]");
      if (grid) act(grid);
    }, 100);
    return () => window.clearTimeout(t);
  }, [act]);
  return <div ref={ref}>{children}</div>;
}

/** Select a cell the way a click does (a page without focus gets no focus events, so focus() alone wouldn't) */
function focusCell(grid: HTMLElement, rc: string) {
  const td = grid.querySelector<HTMLElement>(`[data-cell="${rc}"]`);
  td?.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, cancelable: true, button: 0 }));
  td?.dispatchEvent(new MouseEvent("mouseup", { bubbles: true, cancelable: true, button: 0 }));
  return td;
}

// Positional, as from a spreadsheet: the empty field lands on the computed Total, which is skipped
const SHEET_ROWS = "Webcam\tAccessories\t2027-04-01\t2\t€89\t\tTRUE\nMicrophone\tAudio\t12 Apr 2027\ttwo\t140,50\t\tyes\nHeadphones\tAccessories\t1 May 2027\t3\t99\t\tno";

function pasteRows(grid: HTMLElement) {
  const td = focusCell(grid, "4:0");
  const data = new DataTransfer();
  data.setData("text/plain", SHEET_ROWS);
  td?.dispatchEvent(new ClipboardEvent("paste", { clipboardData: data, bubbles: true, cancelable: true }));
}

function typeIntoPrice(grid: HTMLElement) {
  const td = focusCell(grid, "1:4");
  td?.dispatchEvent(new KeyboardEvent("keydown", { key: "4", bubbles: true, cancelable: true }));
}

// -------------------------------------------------------------------------------------------------

const meta = {
  title: "Components/Data display/Editable table",
  component: EditableTable<Purchase>,
  args: {
    label: "Equipment purchases",
    columns: COLUMNS,
    defaultValue: PURCHASES,
    rowKey: (p: Purchase) => p.id,
    newRow: newPurchase,
    rowHeader: "item",
    totals: true,
    maxHeight: "24rem",
  },
  argTypes: {
    columns: { control: false },
    defaultValue: { control: false },
    value: { control: false },
    baseline: { control: false },
    rowKey: { control: false },
    newRow: { control: false },
    size: { control: "inline-radio", options: ["sm", "md", "lg"] },
  },
  parameters: { layout: "padded" },
} satisfies Meta<typeof EditableTable<Purchase>>;
export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Every kind of column in one table: text, one of a list, a date, a whole number, money, a total
 * worked out from the row, yes/no and long text, with a totals row. Click a cell and type to
 * replace it; Enter, F2 or a double click edits it; Escape cancels. Tab along a row, then Enter
 * goes to the next row under where you started. Shift+arrows select a range, Ctrl+C copies it,
 * Ctrl+V pastes, Ctrl+D fills down, Delete clears, Ctrl+Z undoes. Right-click or Shift+F10 for
 * the row menu.
 */
export const Playground: Story = { args: { size: "sm", readOnly: false, stickyColumns: 1, toolbar: true, hint: true } };

/** With a save bar: edited cells get a corner mark, the bar counts the changes, Discard and Save. */
export const WithSaveBar: Story = { args: { onSave: () => new Promise((done) => setTimeout(done, 600)) } };

/**
 * Rules per column (required, a pattern, a minimum, a check that compares two dates) broken in
 * the data: each bad cell has a red edge and an icon, and its message on hover or focus. Text that
 * isn't a number or a date is kept as typed, with its message, not thrown away.
 */
export const ValidationErrors: StoryObj<typeof EditableTable<Invoice>> = {
  render: () => <EditableTable label="Invoices" columns={INVOICE_COLUMNS} defaultValue={INVOICES} rowKey={(i) => i.id} rowHeader="number" />,
};

/**
 * Three rows pasted from a spreadsheet into row 5: dates and amounts in several spellings are
 * read for their column, two rows are added, and "Audio" (not a category) and "two" (not a
 * number) are kept and flagged. The toolbar says what happened; Ctrl+Z takes the paste back.
 */
export const PastedRange: Story = {
  parameters: { docs: { story: { inline: false, height: "420px" } } },
  render: (args) => (
    <After act={pasteRows}>
      <EditableTable {...args} onSave={() => {}} />
    </After>
  ),
};

/**
 * Editing: the editor lies exactly over the cell, so nothing moves when it opens. (Typing "4"
 * into Unit price started this one.)
 */
export const Editing: Story = {
  parameters: { docs: { story: { inline: false, height: "380px" } } },
  render: (args) => (
    <After act={typeIntoPrice}>
      <EditableTable {...args} />
    </After>
  ),
};

/** Nothing editable: cells can still be selected and copied, and every cell says it is read-only. */
export const ReadOnly: Story = { args: { readOnly: true } };

/** No rows yet: the body says so and offers the first one. */
export const Empty: Story = { args: { defaultValue: [], totals: false } };

/** Without a way to make rows (no newRow): no Add row, and the row menu's row commands are off. */
export const FixedRows: Story = { args: { newRow: undefined } };

/**
 * 500 rows and a computed column, in a 30rem box. The header and totals stick; PageUp and
 * PageDown move a screenful; Ctrl+Home and Ctrl+End jump to the ends. It isn't virtualised, which
 * is fine at this size.
 */
export const ManyRows: StoryObj<typeof EditableTable<Stock>> = {
  render: () => (
    <EditableTable label="Stock" columns={STOCK_COLUMNS} defaultValue={STOCK} rowKey={(s) => s.sku} rowHeader="name" totals maxHeight="30rem" />
  ),
};

/** Row heights from the control scale: sm 24px (the default), md 28px, and lg 36px for touch screens. The toolbar follows. */
export const Sizes: Story = {
  render: (args) => (
    <div className="flex flex-col gap-6">
      {(["sm", "md", "lg"] as const).map((size) => (
        <section key={size} className="flex flex-col gap-1">
          <h3 className="text-[13px] font-bold">{size}</h3>
          <EditableTable {...args} label={`Purchases, ${size}`} size={size} defaultValue={PURCHASES.slice(0, 3)} hint={false} />
        </section>
      ))}
    </div>
  ),
};

/** Controlled: the page holds the rows and shows the latest change that onChange reported. */
export const Controlled: Story = {
  render: function Render(args) {
    const [rows, setRows] = useState(PURCHASES);
    const [last, setLast] = useState("Nothing yet");
    return (
      <div className="flex flex-col gap-2">
        <EditableTable
          {...args}
          defaultValue={undefined}
          value={rows}
          onChange={(next, change) => {
            setRows(next);
            setLast(`${change.kind}: ${change.label}`);
          }}
        />
        <p className="text-[13px]">
          <b>onChange:</b> {last} ({rows.length} rows)
        </p>
      </div>
    );
  },
};
