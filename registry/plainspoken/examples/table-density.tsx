import { SimpleTable, type TableColumn, type TableDensity } from "@/registry/plainspoken/ui/table";

type Row = { region: string; requests: number; p95: number; errors: number };

const ROWS: Row[] = [
  { region: "eu-central", requests: 1_284_310, p95: 182, errors: 0.02 },
  { region: "us-east", requests: 2_904_115, p95: 211, errors: 0.05 },
  { region: "ap-southeast", requests: 640_982, p95: 264, errors: 0.11 },
];

const COLUMNS: TableColumn<Row>[] = [
  { key: "region", header: "Region", cell: (r) => r.region },
  { key: "requests", header: "Requests", numeric: true, cell: (r) => r.requests.toLocaleString("en") },
  { key: "p95", header: "p95", numeric: true, cell: (r) => `${r.p95} ms` },
  { key: "errors", header: "Errors", numeric: true, cell: (r) => `${r.errors.toFixed(2)}%` },
];

/** compact (rows about 22px), default (26px) and relaxed (34px). Set on the table; a cell's own padding still wins. */
export default function TableDensityExample() {
  return (
    <div className="flex flex-col gap-4">
      {(["compact", "default", "relaxed"] as TableDensity[]).map((density) => (
        <div key={density}>
          <p className="mb-1 font-mono text-[12px] text-muted-foreground">density=&quot;{density}&quot;</p>
          <SimpleTable density={density} columns={COLUMNS} rows={ROWS} rowKey={(r) => r.region} className="max-w-lg" />
        </div>
      ))}
    </div>
  );
}
