"use client";

import { EditableTable, type EditableColumn } from "@/registry/plainspoken/ui/editable-table";
import { CopyButton } from "@/registry/plainspoken/ui/copy-button";

interface Shift {
  id: string;
  date: string | null;
  person: string | null;
  start: string;
  hours: number | null;
  rate: number | null;
  confirmed: boolean;
}

const PEOPLE = ["Amara Nwosu", "Jonas Weber", "Priya Raman", "Tomás Ferreira", "Ilse Brandt"];

const START: Shift[] = [
  { id: "s1", date: "2027-05-03", person: "Amara Nwosu", start: "08:00", hours: 6, rate: 21.5, confirmed: true },
  { id: "s2", date: "2027-05-03", person: "Jonas Weber", start: "14:00", hours: 5.5, rate: 19, confirmed: true },
];

// As Google Sheets puts it on the clipboard: tabs between cells, one line per row. Two cells are wrong on purpose.
const SAMPLE = [
  "4 May 2027\tPriya Raman\t08:00\t6\t€21.50\tTRUE",
  "04/05/2027\tTomás Ferreira\t14:00\tsix\t19,00\tFALSE",
  "2027-05-05\tIlse Brandt\t09:30\t7.5\t22\tyes",
  "5 May 2027\tSam Okoro\t12:00\t4\t19\tno",
].join("\n");

const COLUMNS: EditableColumn<Shift>[] = [
  { key: "date", header: "Date", type: "date", required: true },
  { key: "person", header: "Person", type: "select", options: PEOPLE, required: true, width: 150 },
  { key: "start", header: "Starts", pattern: /\d{1,2}:\d{2}/, patternMessage: "Use 24-hour time, e.g. 08:30", width: 72 },
  { key: "hours", header: "Hours", type: "number", min: 0.5, max: 12, width: 68, total: "sum" },
  { key: "rate", header: "Rate", type: "money", currency: "EUR", width: 88 },
  { key: "pay", header: "Pay", type: "money", currency: "EUR", width: 100, compute: (s) => (s.hours ?? 0) * (s.rate ?? 0), total: "sum" },
  { key: "confirmed", header: "Confirmed", type: "checkbox", width: 88 },
];

let next = 10;

/**
 * Copy the four rows below (they are what Google Sheets or Excel put on the clipboard), click the
 * Date cell of row 3 and press Ctrl+V. Each cell is parsed for its column: "4 May 2027" and
 * "04/05/2027" become dates, "€21.50" and "19,00" amounts, TRUE and "yes" ticks. Rows are added as
 * needed, "six" and an unknown person are kept and flagged, and the toolbar says what happened.
 * Ctrl+Z takes the whole paste back.
 */
export default function EditableTablePaste() {
  return (
    <div className="flex flex-col gap-3">
      <EditableTable
        label="Shifts, week 18"
        columns={COLUMNS}
        defaultValue={START}
        rowKey={(s) => s.id}
        newRow={(copyOf) => ({ ...(copyOf ?? { date: null, person: null, start: "", hours: null, rate: null, confirmed: false }), id: `s${next++}` })}
        totals
        locale="en-GB"
        hint={false}
      />
      <div className="max-w-xl border border-border">
        <div className="flex items-center justify-between border-b border-border bg-muted py-0.5 pr-0.5 pl-2 text-[13px]">
          <span>Four rows from a spreadsheet</span>
          <CopyButton text={SAMPLE} label="Copy" name="the four rows" />
        </div>
        <pre className="overflow-x-auto p-2 font-mono text-[12px] leading-relaxed">{SAMPLE.replace(/\t/g, "  →  ")}</pre>
      </div>
    </div>
  );
}
