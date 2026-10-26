import { CreditCard } from "@/registry/plainspoken/lib/icons";
import type { ISODate } from "@/registry/plainspoken/lib/dates";
import { Alert } from "@/registry/plainspoken/ui/alert";
import { Button } from "@/registry/plainspoken/ui/button";
import { Status } from "@/registry/plainspoken/ui/status";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/registry/plainspoken/ui/table";
import { shortDate } from "@/registry/plainspoken/blocks/library/lib";
import { cn } from "@/lib/utils";

export interface LibraryFine {
  id: string;
  date: ISODate;
  /** What it is for: "Overdue: 3 days", "Damaged dust jacket" */
  description: string;
  /** The item it is about, if any */
  title?: string;
  amount: number;
  paid: boolean;
}

export interface LibraryFinesProps {
  fines: LibraryFine[];
  /** Borrowing stops once this much is owed. Default 10. */
  limit?: number;
  currency?: string;
  className?: string;
}

/**
 * Fines and fees: a note of what is owed against the limit at which borrowing stops, and a table
 * of charges (date, item, what for, amount, paid or owed) with the total owed in the footer and a
 * Pay button. Amounts are right-aligned tabular figures. Renders on the server.
 */
export function LibraryFines({ fines, limit = 10, currency = "USD", className }: LibraryFinesProps) {
  const money = new Intl.NumberFormat("en-US", { style: "currency", currency });
  const owed = fines.filter((f) => !f.paid).reduce((n, f) => n + f.amount, 0);
  return (
    <div data-slot="library-fines" className={cn("flex flex-col gap-3", className)}>
      {owed > 0 ? (
        <Alert
          variant={owed >= limit ? "destructive" : "warning"}
          title={`You owe ${money.format(owed)}`}
          actions={
            <Button variant="primary" icon={CreditCard}>
              Pay {money.format(owed)}
            </Button>
          }
        >
          {owed >= limit ? `Borrowing is paused until the balance is below ${money.format(limit)}.` : `You can keep borrowing until you owe ${money.format(limit)}.`}
        </Alert>
      ) : (
        <Alert variant="success" title="Nothing owed" />
      )}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Charge</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {fines.map((f) => (
            <TableRow key={f.id}>
              <TableCell className="whitespace-nowrap">{shortDate(f.date, true)}</TableCell>
              <TableCell>
                {f.title && <span className="font-medium">{f.title}: </span>}
                {f.description}
              </TableCell>
              <TableCell numeric>{money.format(f.amount)}</TableCell>
              <TableCell className="whitespace-nowrap">{f.paid ? <Status variant="success">Paid</Status> : <Status variant="warning">Owed</Status>}</TableCell>
            </TableRow>
          ))}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell colSpan={2}>Total owed</TableCell>
            <TableCell numeric>{money.format(owed)}</TableCell>
            <TableCell />
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  );
}
