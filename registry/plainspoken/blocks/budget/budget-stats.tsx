import { BUDGET_LINES, BUDGET_YEAR, MONTHS, euro, lineTotal, monthTotals, percentChange, type BudgetLine } from "@/registry/plainspoken/blocks/budget/data";
import { Sparkline } from "@/registry/plainspoken/ui/sparkline";
import { Stat, StatGroup } from "@/registry/plainspoken/ui/stat";

export interface BudgetStatsProps {
  lines?: BudgetLine[];
  className?: string;
}

/**
 * The headline figures of the plan: the year's total against last year, what still waits for
 * approval, the busiest month and the monthly average. Spending more is not good or bad in
 * itself, so the change is said in words and an arrow, without green or red.
 */
export function BudgetStats({ lines = BUDGET_LINES, className }: BudgetStatsProps) {
  const total = lines.reduce((s, l) => s + lineTotal(l), 0);
  const lastYear = lines.reduce((s, l) => s + (l.lastYear ?? 0), 0);
  const waiting = lines.filter((l) => !l.approved);
  const perMonth = monthTotals(lines);
  const peak = perMonth.reduce((best, v, i) => (v > perMonth[best] ? i : best), 0);
  const diff = total - lastYear;
  return (
    <StatGroup columns={4} className={className}>
      <Stat
        label={`Planned for ${BUDGET_YEAR}`}
        value={euro(total)}
        change={{
          direction: diff > 0 ? "up" : diff < 0 ? "down" : "flat",
          value: percentChange(total, lastYear).replace(/^[+−]/, ""),
          sentiment: "neutral",
          period: `on ${BUDGET_YEAR - 1} (${euro(lastYear)})`,
        }}
      />
      <Stat
        label="Waiting for approval"
        value={euro(waiting.reduce((s, l) => s + lineTotal(l), 0))}
        hint={`${waiting.length} of ${lines.length} lines`}
      />
      <Stat
        label="Busiest month"
        value={`${MONTHS[peak]}: ${euro(perMonth[peak])}`}
        chart={<Sparkline type="bar" values={perMonth} label="Planned spend per month" format={euro} width={84} height={28} />}
      />
      <Stat label="Monthly average" value={euro(total / 12)} hint={`${euro(Math.min(...perMonth))} in the quietest month`} />
    </StatGroup>
  );
}
