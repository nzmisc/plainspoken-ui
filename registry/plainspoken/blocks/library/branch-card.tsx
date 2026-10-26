import { MapPin, Phone } from "@/registry/plainspoken/lib/icons";
import { weekday, type ISODate } from "@/registry/plainspoken/lib/dates";
import { Badge } from "@/registry/plainspoken/ui/badge";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/registry/plainspoken/ui/card";
import { Icon } from "@/registry/plainspoken/ui/icon";
import { Status } from "@/registry/plainspoken/ui/status";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/registry/plainspoken/ui/table";
import { linkVariants } from "@/registry/plainspoken/ui/text-link";
import { WEEKDAYS, hoursText, type Branch } from "@/registry/plainspoken/blocks/library/lib";
import { cn } from "@/lib/utils";

export interface LibraryBranchCardProps {
  branch: Branch;
  /** Today, to mark its row and say whether the branch is open; pass it from the server */
  today: ISODate;
  /** Why it is closed today outside its weekly hours ("Floor refinishing") */
  closedToday?: string;
  className?: string;
}

/**
 * One branch: its name, address and phone (a tel: link), whether it is open today, the week's
 * opening hours with today's row marked, and its services. The card's id is the branch's id, so
 * `#riverside` links straight to it.
 */
export function LibraryBranchCard({ branch: b, today, closedToday, className }: LibraryBranchCardProps) {
  const wd = weekday(today);
  const open = !closedToday && b.hours[wd];
  // Monday first, as a printed timetable would
  const order = [1, 2, 3, 4, 5, 6, 0];
  return (
    <Card id={b.id} data-slot="library-branch-card" className={cn("scroll-mt-4", className)}>
      <CardHeader>
        <CardTitle as="h2">{b.name}</CardTitle>
        <CardDescription className="flex flex-col gap-0.5">
          <span>
            <Icon icon={MapPin} className="mr-1" />
            {b.address}
          </span>
          <span>
            <Icon icon={Phone} className="mr-1" />
            <a href={`tel:${b.phone.replace(/[^\d+]/g, "")}`} className={linkVariants({ variant: "muted" })}>
              {b.phone}
            </a>
          </span>
        </CardDescription>
        <CardAction>
          {open ? (
            <Status variant="success">Open today</Status>
          ) : (
            <Status variant={closedToday ? "warning" : "default"}>Closed today</Status>
          )}
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {closedToday && <p className="text-[13px] text-warning">Closed today: {closedToday.toLowerCase()}.</p>}
        <Table density="compact" aria-label={`${b.name} opening hours`}>
          <TableHeader>
            <TableRow>
              <TableHead>Day</TableHead>
              <TableHead>Hours</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {order.map((d) => (
              <TableRow key={d} data-state={d === wd ? "selected" : undefined} aria-current={d === wd ? "date" : undefined}>
                <TableCell className={cn(d === wd && "font-semibold")}>
                  {WEEKDAYS[d]}
                  {d === wd && <span className="font-normal text-muted-foreground"> (today)</span>}
                </TableCell>
                <TableCell className={cn("tabular-nums", !b.hours[d] && "text-muted-foreground", d === wd && "font-semibold")}>{hoursText(b, d)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {b.services && b.services.length > 0 && (
          <ul aria-label="Services" className="flex flex-wrap gap-1">
            {b.services.map((s) => (
              <li key={s}>
                <Badge>{s}</Badge>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
