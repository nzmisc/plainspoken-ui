import { BudgetCategorySummary } from "@/registry/plainspoken/blocks/budget/category-summary";

/** The budget per category against last year, with each category's months as a sparkline. */
export default function BudgetCategorySummaryDemo() {
  return <BudgetCategorySummary className="max-w-2xl" />;
}
