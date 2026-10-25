"use client";

import {
  BUDGET_YEAR,
  CATEGORIES,
  MONTH_KEYS,
  MONTHS,
  OWNERS,
  lineTotal,
  newBudgetLine,
  type BudgetLine,
} from "@/registry/plainspoken/blocks/budget/data";
import { EditableTable, type EditableColumn, type EditableTableProps } from "@/registry/plainspoken/ui/editable-table";

const PLAIN = new Intl.NumberFormat("en-IE", { maximumFractionDigits: 0 });
const signed = (v: unknown) => (typeof v !== "number" ? "" : Math.round(v) === 0 ? "0" : `${v > 0 ? "+" : "−"}${PLAIN.format(Math.abs(v))}`);

/** The sheet's columns: what the line is, a money column per month, then the sums and notes */
export const BUDGET_COLUMNS: EditableColumn<BudgetLine>[] = [
  { key: "item", header: "Line item", required: true, maxLength: 60, width: 184 },
  { key: "category", header: "Category", type: "select", options: [...CATEGORIES], required: true, width: 100 },
  { key: "owner", header: "Owner", type: "select", options: [...OWNERS], width: 128 },
  ...MONTH_KEYS.map(
    (m, i): EditableColumn<BudgetLine> => ({ key: m, header: MONTHS[i], type: "money", decimals: 0, min: 0, max: 50000, width: 70, total: "sum" }),
  ),
  { key: "total", header: `Total ${BUDGET_YEAR}`, type: "money", decimals: 0, width: 92, compute: lineTotal, total: "sum" },
  { key: "lastYear", header: String(BUDGET_YEAR - 1), type: "money", decimals: 0, readOnly: true, width: 76, total: "sum" },
  { key: "change", header: "Change", type: "money", decimals: 0, width: 80, compute: (l) => lineTotal(l) - (l.lastYear ?? 0), format: signed, total: "sum" },
  { key: "approved", header: "Approved", type: "checkbox", width: 76, total: "count" },
  { key: "notes", header: "Notes", type: "longtext", width: 260, placeholder: "Add a note" },
];

export interface BudgetSheetProps extends Pick<EditableTableProps<BudgetLine>, "value" | "defaultValue" | "onChange" | "baseline" | "onSave" | "maxHeight" | "actions" | "className"> {
  /** Draw it for reading only, as a finance view might */
  readOnly?: boolean;
}

/**
 * The year's budget as an editable table: one row per line item, with category and owner, an
 * amount per month, the line's total worked out, last year's figure and the change against it,
 * whether it is approved, and notes. The line item stays in view while the months scroll by; the
 * totals row sums every month. Amounts are whole euros, typed as people do ("1.2k", "€1,200").
 */
export function BudgetSheet({ readOnly, maxHeight = "min(32rem, 70dvh)", ...rest }: BudgetSheetProps) {
  return (
    <EditableTable
      label={`Budget ${BUDGET_YEAR}, by line item and month`}
      columns={BUDGET_COLUMNS}
      rowKey={(l) => l.id}
      newRow={newBudgetLine}
      rowHeader="item"
      stickyColumns={1}
      totals
      locale="en-IE"
      readOnly={readOnly}
      maxHeight={maxHeight}
      {...rest}
    />
  );
}
