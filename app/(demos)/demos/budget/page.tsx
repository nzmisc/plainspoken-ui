import type { Metadata } from "next";
import { ThemeToggle } from "@/components/site/theme";
import { BudgetApp } from "@/registry/plainspoken/blocks/budget/budget-app";

export const metadata: Metadata = {
  title: "Budget",
  description:
    "A team's yearly budget in an editable table built from plainspoken-ui: type into cells, paste from a spreadsheet, undo, and watch the totals, the chart and the category summary follow.",
};

export default function BudgetPage() {
  return <BudgetApp actions={<ThemeToggle size="sm" />} />;
}
