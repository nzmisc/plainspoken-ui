import { Fragment } from "react";
import { Check, Minus } from "@/registry/plainspoken/lib/icons";
import { Icon } from "@/registry/plainspoken/ui/icon";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/registry/plainspoken/ui/table";
import { cn } from "@/lib/utils";

export interface LandingComparisonGroup {
  group: string;
  /** One value per plan, in the plans' order: true included, false not, or words ("10", "5 min") */
  rows: { feature: string; values: (string | boolean)[] }[];
}

export interface LandingPlanComparisonProps {
  /** Plan names, the column headings */
  plans: string[];
  groups: LandingComparisonGroup[];
  /** The table's caption, its accessible name. Shown under it. */
  caption?: string;
  /** The plan to tint, so the recommended column stands out */
  highlight?: string;
  className?: string;
}

function Value({ v }: { v: string | boolean }) {
  if (v === true)
    return (
      <>
        <Icon icon={Check} className="text-success" />
        <span className="sr-only">Included</span>
      </>
    );
  if (v === false)
    return (
      <>
        <Icon icon={Minus} className="text-muted-foreground" />
        <span className="sr-only">Not included</span>
      </>
    );
  return <>{v}</>;
}

/**
 * Every plan's features side by side in one bordered table: a row per feature, grouped under
 * full-width group rows, with a check or a dash (and the words for screen readers) where there
 * is no number. Feature names are row headers, so a screen reader says "SMS alerts, Team, 200 a
 * month". Scrolls sideways on phones rather than squeezing the columns.
 */
export function LandingPlanComparison({ plans, groups, caption, highlight, className }: LandingPlanComparisonProps) {
  const hi = plans.indexOf(highlight ?? "");
  return (
    <Table data-slot="landing-plan-comparison" className={cn("min-w-[36rem]", className)}>
      {caption && <TableCaption>{caption}</TableCaption>}
      <TableHeader>
        <TableRow>
          <TableHead className="w-[34%]">
            <span className="sr-only">Feature</span>
          </TableHead>
          {plans.map((p, i) => (
            <TableHead key={p} className={cn("w-[22%] text-[15px]", i === hi && "bg-accent")}>
              {p}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {groups.map((g) => (
          <Fragment key={g.group}>
            <TableRow>
              <TableHead scope="colgroup" colSpan={plans.length + 1} className="pt-3 text-[13px] tracking-wide text-muted-foreground uppercase">
                {g.group}
              </TableHead>
            </TableRow>
            {g.rows.map((r) => (
              <TableRow key={r.feature}>
                <TableHead scope="row" className="bg-background font-normal">
                  {r.feature}
                </TableHead>
                {r.values.map((v, i) => (
                  <TableCell key={i} className={cn(i === hi && "bg-accent/40")}>
                    <Value v={v} />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </Fragment>
        ))}
      </TableBody>
    </Table>
  );
}
