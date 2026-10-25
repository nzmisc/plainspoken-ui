import { INVOICES, type InvoiceStatus } from "@/registry/plainspoken/blocks/app/data";
import { money } from "@/registry/plainspoken/blocks/app/format";
import { DonutChart } from "@/registry/plainspoken/ui/donut-chart";
import { Panel } from "@/registry/plainspoken/ui/panel";

const COLOR: Record<InvoiceStatus, string> = { Paid: "var(--chart-3)", Open: "var(--chart-1)", Overdue: "var(--destructive)", Draft: "var(--accent)" };

export interface AppInvoiceStatusChartProps {
  invoices?: typeof INVOICES;
  className?: string;
}

/** What the year's invoices add up to by state, as a ring with the total outstanding in the hole and a legend giving each part. */
export function AppInvoiceStatusChart({ invoices = INVOICES, className }: AppInvoiceStatusChartProps) {
  const sum = (s: InvoiceStatus) => invoices.filter((i) => i.status === s).reduce((t, i) => t + i.amount, 0);
  const statuses: InvoiceStatus[] = ["Paid", "Open", "Overdue", "Draft"];
  const owed = sum("Open") + sum("Overdue");
  return (
    <Panel title="Invoices by state" meta="since July" className={className}>
      <DonutChart
        label="Invoice amounts by state since July"
        size={132}
        thickness={18}
        format={money}
        segments={statuses.map((s) => ({ key: s, label: s, value: sum(s), color: COLOR[s] }))}
        className="py-1"
      >
        <span className="text-[15px] leading-tight font-bold tabular-nums">{money(owed)}</span>
        <span className="text-[11px] text-muted-foreground">owed</span>
      </DonutChart>
    </Panel>
  );
}
