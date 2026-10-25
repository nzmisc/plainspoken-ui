"use client";

import { useState } from "react";
import { RefreshCw } from "@/registry/plainspoken/lib/icons";
import type { LinkComponent } from "@/registry/plainspoken/lib/nav";
import { daysBetween, type ISODate } from "@/registry/plainspoken/lib/dates";
import { Button } from "@/registry/plainspoken/ui/button";
import { Checkbox } from "@/registry/plainspoken/ui/checkbox";
import { Status } from "@/registry/plainspoken/ui/status";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/registry/plainspoken/ui/table";
import { linkVariants } from "@/registry/plainspoken/ui/text-link";
import { toast } from "@/registry/plainspoken/ui/toast";
import { Tooltip } from "@/registry/plainspoken/ui/tooltip";
import { BookCover } from "@/registry/plainspoken/blocks/library/book-cover";
import { FORMAT_LABELS, shortDate, type Format, type LibraryBook } from "@/registry/plainspoken/blocks/library/lib";
import { addDays } from "@/registry/plainspoken/lib/dates";
import { cn } from "@/lib/utils";

export interface LibraryLoan {
  book: Pick<LibraryBook, "id" | "title" | "author" | "formats">;
  format: Format;
  due: ISODate;
  renewals: number;
  maxRenewals: number;
  /** Someone has a hold on it, so it can't be renewed */
  holdsWaiting?: boolean;
}

export interface LibraryLoansProps {
  loans: LibraryLoan[];
  /** To say "overdue by 3 days" and "due today"; pass it from the server */
  today: ISODate;
  /** How many days a renewal adds. Default 21. */
  renewDays?: number;
  basePath?: string;
  /** Your router's link component (next/link's Link). Default: a plain <a>. */
  linkAs?: LinkComponent;
  className?: string;
}

function dueStatus(due: ISODate, today: ISODate) {
  const d = daysBetween(today, due);
  if (d < 0) return <Status variant="destructive">Overdue by {-d === 1 ? "1 day" : `${-d} days`}</Status>;
  if (d === 0) return <Status variant="warning">Due today</Status>;
  if (d <= 3) return <Status variant="warning">Due in {d === 1 ? "1 day" : `${d} days`}</Status>;
  return <Status>Due {shortDate(due)}</Status>;
}

/**
 * What a patron has checked out: cover, title, format, when it is due (overdue rows are marked in
 * red, in words as well as colour), renewals used, and Renew, per row or for the ticked ones. A
 * loan with a hold on it or no renewals left can't be renewed, and its disabled button says why
 * on hover and focus. Renewing moves the due date here and says so in a toast; nothing is saved.
 */
export function LibraryLoans({ loans, today, renewDays = 21, basePath = "/library", linkAs, className }: LibraryLoansProps) {
  const L = linkAs ?? "a";
  const [rows, setRows] = useState(loans);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const key = (l: LibraryLoan) => `${l.book.id}/${l.format}`;
  const blocked = (l: LibraryLoan) => (l.holdsWaiting ? "Someone has a hold on it" : l.renewals >= l.maxRenewals ? "No renewals left" : null);
  const renew = (keys: string[]) => {
    const ok = rows.filter((l) => keys.includes(key(l)) && !blocked(l));
    if (!ok.length) return;
    setRows((rs) => rs.map((l) => (ok.includes(l) ? { ...l, due: addDays(l.due < today ? today : l.due, renewDays), renewals: l.renewals + 1 } : l)));
    setPicked(new Set());
    toast({
      variant: "success",
      title: ok.length === 1 ? `Renewed ${ok[0].book.title}` : `Renewed ${ok.length} items`,
      description: `Now due ${shortDate(addDays(ok[0].due < today ? today : ok[0].due, renewDays))}.`,
    });
  };
  const all = rows.length > 0 && picked.size === rows.length;
  return (
    <div data-slot="library-loans" className={cn("flex flex-col gap-2", className)}>
      <div className="ctl-sm flex flex-wrap items-center gap-2">
        <Button icon={RefreshCw} disabled={picked.size === 0} onClick={() => renew([...picked])}>
          Renew selected{picked.size > 0 && ` (${picked.size})`}
        </Button>
        <Button variant="ghost" onClick={() => renew(rows.map(key))}>
          Renew all
        </Button>
        <span className="ml-auto text-[13px] text-muted-foreground">
          {rows.length} {rows.length === 1 ? "item" : "items"} checked out
        </span>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-8">
              <Checkbox
                label={<span className="sr-only">Select all</span>}
                checked={all}
                indeterminate={picked.size > 0 && !all}
                onChange={() => setPicked(all ? new Set() : new Set(rows.map(key)))}
                size="xs"
              />
            </TableHead>
            <TableHead>Title</TableHead>
            <TableHead className="hidden sm:table-cell">Format</TableHead>
            <TableHead>Due</TableHead>
            <TableHead className="hidden md:table-cell">Renewals</TableHead>
            <TableHead>
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((l) => {
            const k = key(l);
            const why = blocked(l);
            const overdue = l.due < today;
            return (
              <TableRow key={k} data-state={picked.has(k) ? "selected" : undefined} className={cn(overdue && "bg-destructive/8")}>
                <TableCell>
                  <Checkbox
                    label={<span className="sr-only">Select {l.book.title}</span>}
                    checked={picked.has(k)}
                    onChange={() =>
                      setPicked((p) => {
                        const n = new Set(p);
                        if (n.has(k)) n.delete(k);
                        else n.add(k);
                        return n;
                      })
                    }
                    size="xs"
                  />
                </TableCell>
                <TableCell>
                  <div className="flex items-start gap-2">
                    <BookCover book={l.book} size="xs" />
                    <div className="min-w-0">
                      <L href={`${basePath}/book/${l.book.id}`} className={cn(linkVariants(), "font-medium")}>
                        {l.book.title}
                      </L>
                      <div className="text-[13px] text-muted-foreground">
                        {l.book.author}
                        <span className="sm:hidden"> · {FORMAT_LABELS[l.format]}</span>
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="hidden sm:table-cell">{FORMAT_LABELS[l.format]}</TableCell>
                <TableCell className="whitespace-nowrap">
                  {dueStatus(l.due, today)}
                  {overdue && <div className="text-[12px] text-muted-foreground">was due {shortDate(l.due)}</div>}
                </TableCell>
                <TableCell numeric className="hidden md:table-cell">
                  {l.renewals} of {l.maxRenewals}
                </TableCell>
                <TableCell className="ctl-xs text-right whitespace-nowrap">
                  {why ? (
                    <Tooltip content={why}>
                      <span tabIndex={0} className="inline-block">
                        <Button disabled size="xs">
                          Renew
                        </Button>
                      </span>
                    </Tooltip>
                  ) : (
                    <Button size="xs" onClick={() => renew([k])}>
                      Renew
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
