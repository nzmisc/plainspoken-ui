import { BUDGET_LINES, BUDGET_YEAR, categoryTotals, euro, percentChange, signedEuro, type BudgetLine } from "@/registry/plainspoken/blocks/budget/data";
import { Panel } from "@/registry/plainspoken/ui/panel";
import { Sparkline } from "@/registry/plainspoken/ui/sparkline";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/registry/plainspoken/ui/table";

export interface BudgetCategorySummaryProps {
  lines?: BudgetLine[];
  className?: string;
}

/**
 * The budget per category: this year's plan, last year's spend and the change, with the months'
 * shape as a sparkline, and the grand total underneath. Worked out from the lines it is given, so
 * it follows the sheet.
 */
export function BudgetCategorySummary({ lines = BUDGET_LINES, className }: BudgetCategorySummaryProps) {
  const cats = categoryTotals(lines);
  const planned = cats.reduce((s, c) => s + c.planned, 0);
  const lastYear = cats.reduce((s, c) => s + c.lastYear, 0);
  return (
    <Panel title="By category" meta={`${BUDGET_YEAR} against ${BUDGET_YEAR - 1}`} flush className={className}>
      <Table frameless density="compact">
        <TableHeader>
          <TableRow>
            <TableHead>Category</TableHead>
            <TableHead>{BUDGET_YEAR}</TableHead>
            <TableHead>{BUDGET_YEAR - 1}</TableHead>
            <TableHead>Change</TableHead>
            <TableHead className="hidden sm:table-cell">Months</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {cats.map((c) => (
            <TableRow key={c.category}>
              <TableCell>
                {c.category} <span className="text-muted-foreground">({c.lines})</span>
              </TableCell>
              <TableCell numeric>{euro(c.planned)}</TableCell>
              <TableCell numeric>{euro(c.lastYear)}</TableCell>
              <TableCell numeric>
                {signedEuro(c.planned - c.lastYear)} <span className="text-muted-foreground">{percentChange(c.planned, c.lastYear)}</span>
              </TableCell>
              <TableCell className="hidden w-0 py-0 align-middle sm:table-cell">
                <Sparkline type="bar" values={c.months} label={`${c.category} per month`} format={euro} width={96} height={16} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell>All categories</TableCell>
            <TableCell numeric>{euro(planned)}</TableCell>
            <TableCell numeric>{euro(lastYear)}</TableCell>
            <TableCell numeric>
              {signedEuro(planned - lastYear)} <span className="font-normal text-muted-foreground">{percentChange(planned, lastYear)}</span>
            </TableCell>
            <TableCell className="hidden sm:table-cell" />
          </TableRow>
        </TableFooter>
      </Table>
    </Panel>
  );
}
