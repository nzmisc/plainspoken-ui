"use client";

import { DataTable, type DataColumn } from "@/registry/plainspoken/ui/data-table";

interface Reading {
  id: string;
  meter: string;
  site: string;
  at: number;
  kwh: number;
  quality: "Measured" | "Estimated" | "Missing";
}

/** A seeded random number generator, so the rows are the same on the server and in the browser */
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), s | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const SITES = ["Depot North", "Depot South", "Harbour office", "Warehouse 3", "Workshop", "Cold store"];

const READINGS: Reading[] = (() => {
  const r = rng(11);
  return Array.from({ length: 10_000 }, (_, i) => {
    const site = SITES[i % SITES.length];
    const q = r();
    return {
      id: String(i),
      meter: `M-${String(1001 + (i % 240)).padStart(4, "0")}`,
      site,
      at: new Date(2026, 9, 1 + Math.floor(i / 400), (i * 7) % 24, (i * 13) % 60).getTime(),
      kwh: Math.round((site === "Cold store" ? 40 : 8) * (0.5 + r()) * 100) / 100,
      quality: q < 0.9 ? "Measured" : q < 0.98 ? "Estimated" : "Missing",
    };
  });
})();

const pad = (n: number) => String(n).padStart(2, "0");
const when = (t: number) => {
  const x = new Date(t);
  return `${x.getFullYear()}-${pad(x.getMonth() + 1)}-${pad(x.getDate())} ${pad(x.getHours())}:${pad(x.getMinutes())}`;
};

const COLUMNS: DataColumn<Reading>[] = [
  { key: "meter", header: "Meter", type: "text", value: (r) => r.meter, className: "font-mono text-[13px]", width: 104 },
  { key: "site", header: "Site", type: "enum", value: (r) => r.site, width: 150 },
  { key: "at", header: "Read at", type: "date", value: (r) => r.at, format: (v) => when(v as number), className: "tabular-nums", width: 150 },
  { key: "kwh", header: "kWh", type: "number", value: (r) => r.kwh, format: (v) => (v as number).toFixed(2), summary: "sum", width: 104 },
  { key: "quality", header: "Quality", type: "enum", value: (r) => r.quality, options: ["Measured", "Estimated", "Missing"], width: 120 },
];

/**
 * Ten thousand rows on one page with `windowed`: only the rows in view are drawn (and a few either
 * side), so scrolling, sorting and filtering stay as quick as with fifty. Each row is one line and
 * the columns have fixed widths; find-in-page only sees the rows drawn.
 */
export default function DataTableWindowed() {
  return (
    <DataTable
      label="Meter readings"
      columns={COLUMNS}
      rows={READINGS}
      rowKey={(r) => r.id}
      windowed
      selectable
      pageSizes={[0]}
      initialSort={[{ key: "at", dir: "desc" }]}
      maxHeight="24rem"
    />
  );
}
