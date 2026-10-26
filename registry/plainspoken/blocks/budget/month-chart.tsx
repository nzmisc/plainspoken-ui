"use client";

import { BUDGET_LINES, BUDGET_YEAR, MONTHS, euro, monthTotals, type BudgetLine } from "@/registry/plainspoken/blocks/budget/data";
import { BarChart } from "@/registry/plainspoken/ui/bar-chart";
import { Panel } from "@/registry/plainspoken/ui/panel";

export interface BudgetMonthChartProps {
  lines?: BudgetLine[];
  className?: string;
}

const compact = new Intl.NumberFormat("en-IE", { notation: "compact", maximumFractionDigits: 1 });

/**
 * Planned spend per month, approved lines beside those still waiting, as grouped columns in a
 * panel. It is drawn from the lines it is given, so it follows every edit in the sheet.
 */
export function BudgetMonthChart({ lines = BUDGET_LINES, className }: BudgetMonthChartProps) {
  const approved = monthTotals(lines.filter((l) => l.approved));
  const waiting = monthTotals(lines.filter((l) => !l.approved));
  const peak = monthTotals(lines).reduce((best, v, i, all) => (v > all[best] ? i : best), 0);
  return (
    <Panel title="Spend per month" meta={`${BUDGET_YEAR}, busiest: ${MONTHS[peak]}`} className={className}>
      <BarChart
        label={`Planned spend per month in ${BUDGET_YEAR}, approved and waiting for approval`}
        categories={[...MONTHS]}
        series={[
          { key: "approved", label: "Approved", values: approved },
          { key: "waiting", label: "Waiting for approval", values: waiting },
        ]}
        valueLabel="Euros"
        tickFormat={(v) => `€${compact.format(v)}`}
        valueFormat={euro}
        textured
        height={220}
      />
    </Panel>
  );
}
