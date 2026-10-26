import type { ISODate } from "@/registry/plainspoken/lib/dates";
import { Status } from "@/registry/plainspoken/ui/status";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/registry/plainspoken/ui/table";
import { COPY_STATUS, FORMAT_LABELS, isDigital, shortDate, type Branch, type FormatAvailability, type LibraryCopy } from "@/registry/plainspoken/blocks/library/lib";

export interface LibraryCopiesTableProps {
  copies: LibraryCopy[];
  branches: Pick<Branch, "id" | "name">[];
  /** E-book and audiobook licences, listed after the shelves as "Online" */
  digital?: FormatAvailability[];
  /** Today, to say "due tomorrow" rather than a date; pass it from the server */
  today?: ISODate;
  className?: string;
}

/**
 * Where every copy of a title is: branch, format, the shelf and call number to find it by, and
 * its status (available, checked out and due back when, in transit, on the hold shelf), each in
 * words with a symbol. Copies are grouped by branch; e-books and audiobooks come last as licences.
 */
export function LibraryCopiesTable({ copies, branches, digital = [], className }: LibraryCopiesTableProps) {
  const name = (id: string) => branches.find((b) => b.id === id)?.name ?? id;
  const online = digital.filter((d) => isDigital(d.format));
  return (
    <Table data-slot="library-copies-table" className={className}>
      <TableCaption>
        {copies.length} {copies.length === 1 ? "copy" : "copies"} on the shelves
        {online.length > 0 && `, and ${online.map((d) => `${d.total} ${FORMAT_LABELS[d.format].toLowerCase()} ${d.total === 1 ? "licence" : "licences"}`).join(" and ")}`}.
      </TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Branch</TableHead>
          <TableHead>Format</TableHead>
          <TableHead className="hidden sm:table-cell">Shelf</TableHead>
          <TableHead>Call number</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {copies.map((c, i) => {
          const s = COPY_STATUS[c.status];
          return (
            <TableRow key={i}>
              <TableCell>{name(c.branch)}</TableCell>
              <TableCell>{FORMAT_LABELS[c.format]}</TableCell>
              <TableCell className="hidden sm:table-cell">{c.location}</TableCell>
              <TableCell className="font-mono text-[13px] whitespace-nowrap">{c.callNumber}</TableCell>
              <TableCell>
                <Status variant={s.variant}>
                  {s.label}
                  {c.due && <span className="text-muted-foreground">, due {shortDate(c.due)}</span>}
                </Status>
              </TableCell>
            </TableRow>
          );
        })}
        {online.map((d) => (
          <TableRow key={d.format}>
            <TableCell>Online</TableCell>
            <TableCell>{FORMAT_LABELS[d.format]}</TableCell>
            <TableCell className="hidden sm:table-cell">Digital collection</TableCell>
            <TableCell className="text-muted-foreground">None</TableCell>
            <TableCell>
              {d.available > 0 ? (
                <Status variant="success">
                  {d.available} of {d.total} {d.total === 1 ? "licence" : "licences"} free
                </Status>
              ) : (
                <Status variant="warning">
                  All {d.total} in use{d.holds > 0 && `, ${d.holds} waiting`}
                </Status>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
