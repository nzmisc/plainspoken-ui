"use client";

import { useState } from "react";
import { BudgetSheet } from "@/registry/plainspoken/blocks/budget/budget-sheet";
import { BUDGET_LINES } from "@/registry/plainspoken/blocks/budget/data";

/**
 * The sheet on its own, with its save bar. Type "1.2k" into a month, paste a column of amounts
 * from a spreadsheet, or tick Approved with Space; the row's total and the change against last
 * year follow, and Ctrl+Z takes it back.
 */
export default function BudgetSheetDemo() {
  const [saved, setSaved] = useState(BUDGET_LINES);
  return <BudgetSheet defaultValue={BUDGET_LINES} baseline={saved} onSave={(rows) => setSaved(rows)} maxHeight="24rem" />;
}
