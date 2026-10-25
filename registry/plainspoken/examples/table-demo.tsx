import { Badge } from "@/registry/plainspoken/ui/badge";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/registry/plainspoken/ui/table";

const INVOICES = [
  { id: "INV-2039", client: "Bäckerei Hoffmann", date: "2026-09-02", status: "paid", amount: 1240 },
  { id: "INV-2040", client: "Studio Kranich", date: "2026-09-15", status: "paid", amount: 3850.5 },
  { id: "INV-2041", client: "Nordlicht Verlag", date: "2026-10-01", status: "overdue", amount: 620 },
  { id: "INV-2042", client: "Café Rösterei", date: "2026-10-12", status: "draft", amount: 95.9 },
] as const;

const eur = (n: number) => n.toLocaleString("en-GB", { style: "currency", currency: "EUR" });

/**
 * Numbers in <TableCell numeric>: right-aligned with tabular figures, under a left-aligned
 * header. On a phone the table scrolls sideways in its own box.
 */
export default function TableDemo() {
  const total = INVOICES.reduce((s, i) => s + i.amount, 0);
  return (
    <Table className="max-w-2xl">
      <TableCaption>Invoices for September and October 2026.</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Invoice</TableHead>
          <TableHead>Client</TableHead>
          <TableHead>Date</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Amount</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {INVOICES.map((inv) => (
          <TableRow key={inv.id}>
            <TableCell className="font-mono text-[13px]">{inv.id}</TableCell>
            <TableCell>{inv.client}</TableCell>
            <TableCell className="whitespace-nowrap tabular-nums">{inv.date}</TableCell>
            <TableCell>
              <Badge variant={inv.status === "paid" ? "success" : inv.status === "overdue" ? "warning" : "default"}>{inv.status}</Badge>
            </TableCell>
            <TableCell numeric>{eur(inv.amount)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell colSpan={4}>Total</TableCell>
          <TableCell numeric>{eur(total)}</TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  );
}
