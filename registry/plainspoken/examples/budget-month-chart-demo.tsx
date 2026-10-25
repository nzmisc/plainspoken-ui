import { BudgetMonthChart } from "@/registry/plainspoken/blocks/budget/month-chart";

/** Planned spend per month, approved beside waiting. Arrow keys step through the months once the chart has focus. */
export default function BudgetMonthChartDemo() {
  return <BudgetMonthChart className="max-w-2xl" />;
}
