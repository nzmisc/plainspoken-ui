"use client";

import { useState, type ReactNode } from "react";
import { BudgetSheet } from "@/registry/plainspoken/blocks/budget/budget-sheet";
import { BudgetStats } from "@/registry/plainspoken/blocks/budget/budget-stats";
import { BudgetCategorySummary } from "@/registry/plainspoken/blocks/budget/category-summary";
import { BUDGET_LINES, BUDGET_YEAR, type BudgetLine } from "@/registry/plainspoken/blocks/budget/data";
import { BudgetMonthChart } from "@/registry/plainspoken/blocks/budget/month-chart";
import { cn } from "@/lib/utils";

export interface BudgetAppProps {
  /** The lines to start with. Default: the design team's 2027 plan. */
  defaultLines?: BudgetLine[];
  /** Controls at the right of the header, e.g. a theme toggle */
  actions?: ReactNode;
  className?: string;
}

const time = new Intl.DateTimeFormat("en-IE", { hour: "2-digit", minute: "2-digit" });

/**
 * The budget page: the headline figures, the sheet with its save bar, and the chart and category
 * summary under it, all drawn from the same lines, so they follow every edit as it is made. Save
 * keeps the version in the page (after a pretend round trip); Discard goes back to it. Nothing
 * leaves the browser.
 */
export function BudgetApp({ defaultLines = BUDGET_LINES, actions, className }: BudgetAppProps) {
  const [lines, setLines] = useState(defaultLines);
  const [saved, setSaved] = useState(defaultLines);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  return (
    <div data-slot="budget-app" className={cn("flex min-w-0 flex-col gap-3 p-3 sm:p-4", className)}>
      <header className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <h1 className="text-[20px] leading-tight font-bold">Design team budget {BUDGET_YEAR}</h1>
        <span className="text-[13px] text-muted-foreground">Kestrel Labs, planned against what was spent in {BUDGET_YEAR - 1}. Whole euros.</span>
        <span className="ml-auto flex items-center gap-2 text-[13px] text-muted-foreground">
          {savedAt ? `Saved at ${savedAt}` : "Showing the saved plan"}
          {actions}
        </span>
      </header>
      <BudgetStats lines={lines} />
      <BudgetSheet
        value={lines}
        onChange={setLines}
        baseline={saved}
        onSave={async (rows) => {
          await new Promise((done) => setTimeout(done, 600));
          setSaved(rows);
          setSavedAt(time.format(new Date()));
        }}
      />
      <div className="grid min-w-0 items-start gap-3 lg:grid-cols-2">
        <BudgetMonthChart lines={lines} />
        <BudgetCategorySummary lines={lines} />
      </div>
    </div>
  );
}
