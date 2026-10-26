import type { LinkComponent } from "@/registry/plainspoken/lib/nav";
import { formatDate, weekday, type ISODate } from "@/registry/plainspoken/lib/dates";
import { Panel } from "@/registry/plainspoken/ui/panel";
import { Status } from "@/registry/plainspoken/ui/status";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/registry/plainspoken/ui/table";
import { linkVariants } from "@/registry/plainspoken/ui/text-link";
import { hoursText, type Branch } from "@/registry/plainspoken/blocks/library/lib";

export interface LibraryHoursTodayProps {
  branches: Branch[];
  /** The day to show; pass it from the server so the page can be prerendered */
  date: ISODate;
  /** Branches closed that day outside their weekly hours, with the reason: { "oak-hill": "Floor refinishing" } */
  closed?: Record<string, string>;
  /** Branch names link to `${href}#${id}` */
  href?: string;
  /** Your router's link component (next/link's Link). Default: a plain <a>. */
  linkAs?: LinkComponent;
  className?: string;
}

/**
 * Every branch's hours for one day, in a titled panel: the branch, its hours, and whether it is
 * open, said in words with a symbol ("Open 10:00–17:00", "Closed today: floor refinishing").
 */
export function LibraryHoursToday({ branches, date, closed = {}, href, linkAs, className }: LibraryHoursTodayProps) {
  const L = linkAs ?? "a";
  const wd = weekday(date);
  return (
    <Panel title="Open today" meta={formatDate(date, { weekday: "long", day: "numeric", month: "long" }, "en-US")} flush className={className} data-slot="library-hours-today">
      <Table frameless rules="rows">
        <TableHeader>
          <TableRow>
            <TableHead>Branch</TableHead>
            <TableHead>Hours</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {branches.map((b) => {
            const reason = closed[b.id];
            const open = !reason && b.hours[wd];
            return (
              <TableRow key={b.id}>
                <TableCell>
                  {href ? (
                    <L href={`${href}#${b.id}`} className={linkVariants()}>
                      {b.name}
                    </L>
                  ) : (
                    b.name
                  )}
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  {open ? (
                    <Status variant="success">
                      Open <span className="tabular-nums">{hoursText(b, wd)}</span>
                    </Status>
                  ) : (
                    <Status variant={reason ? "warning" : "default"}>{reason ? `Closed: ${reason.toLowerCase()}` : "Closed today"}</Status>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Panel>
  );
}
