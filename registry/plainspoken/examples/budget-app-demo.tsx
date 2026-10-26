import { BudgetApp } from "@/registry/plainspoken/blocks/budget/budget-app";

/**
 * The whole page in a box: edit a month in the sheet and the figures, the chart and the category
 * summary follow. Save keeps the version; Discard goes back to it.
 */
export default function BudgetAppDemo() {
  return <BudgetApp className="border border-border" />;
}
