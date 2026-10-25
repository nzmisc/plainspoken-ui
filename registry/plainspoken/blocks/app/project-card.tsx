import Link from "next/link";
import { daysBetween } from "@/registry/plainspoken/lib/dates";
import { Archive, Calendar, Ellipsis, FolderInput, Users } from "@/registry/plainspoken/lib/icons";
import { APP_TODAY, customerById, STAGES, type Project } from "@/registry/plainspoken/blocks/app/data";
import { dayShort, dueIn, money } from "@/registry/plainspoken/blocks/app/format";
import { Avatar, AvatarGroup } from "@/registry/plainspoken/ui/avatar";
import { Badge } from "@/registry/plainspoken/ui/badge";
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/registry/plainspoken/ui/card";
import { DropdownMenu } from "@/registry/plainspoken/ui/dropdown-menu";
import { Icon } from "@/registry/plainspoken/ui/icon";
import { Meter, Progress } from "@/registry/plainspoken/ui/progress";
import { linkVariants } from "@/registry/plainspoken/ui/text-link";
import { cn } from "@/lib/utils";

export interface AppProjectCardProps {
  project: Project;
  today?: string;
  className?: string;
}

/**
 * One project as a card: name and customer, a menu (move to another stage, open the customer,
 * archive), tasks done as a progress bar, the budget used as a meter that turns amber at 90%
 * and red past 100%, the due date, who's on it and its priority.
 */
export function AppProjectCard({ project: p, today = APP_TODAY, className }: AppProjectCardProps) {
  const customer = customerById(p.customer);
  const used = p.budget ? Math.round((p.spent / p.budget) * 100) : 0;
  // Due within two weeks: say how soon, in amber
  const soon = p.stage !== "Done" && daysBetween(today, p.due) <= 14;
  return (
    <Card data-slot="app-project-card" className={cn("text-[14px]", className)}>
      <CardHeader className="px-3 pt-2">
        <CardTitle className="text-[15px]">{p.name}</CardTitle>
        <CardDescription>
          <Link href={`/demos/app/customers/${p.customer}`} className={linkVariants({ variant: "muted" })}>
            {customer?.name}
          </Link>
        </CardDescription>
        <CardAction>
          <DropdownMenu
            trigger={Ellipsis}
            label={`Actions for ${p.name}`}
            triggerVariant="ghost"
            align="end"
            items={[
              { type: "submenu", label: "Move to", icon: FolderInput, items: STAGES.filter((s) => s !== p.stage).map((s) => ({ label: s })) },
              { label: "Open customer", icon: Users, href: `/demos/app/customers/${p.customer}` },
              { type: "separator" },
              { label: "Archive project", icon: Archive },
            ]}
          />
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-1.5 px-3 py-2">
        <div className="grid grid-cols-[3.5rem_1fr] items-center gap-x-2 gap-y-1 text-[12px] text-muted-foreground">
          <span>Tasks</span>
          <Progress value={p.tasksDone} max={p.tasks} label={`${p.name}: tasks done`} showValue={`${p.tasksDone}/${p.tasks}`} />
          <span>Budget</span>
          <Meter value={used} max={100} warn={90} crit={101} label={`${p.name}: budget used`} valueText={`${used}%`} />
        </div>
        <p className="text-[12px] text-muted-foreground">
          {money(p.spent)} of {money(p.budget)} spent
        </p>
      </CardContent>
      <CardFooter className="justify-between bg-background px-3 py-1.5">
        <span className={cn("inline-flex items-center gap-1 text-[13px] whitespace-nowrap", soon ? "text-warning" : "text-muted-foreground")}>
          <Icon icon={Calendar} />
          <span>
            {dayShort(p.due)}
            {soon && `, ${dueIn(p.due, today).replace("due ", "")}`}
          </span>
        </span>
        <span className="flex items-center gap-2">
          {p.priority !== "Normal" && <Badge variant={p.priority === "High" ? "warning" : "default"}>{p.priority}</Badge>}
          <AvatarGroup size={22} label="Team">
            {p.team.map((n) => (
              <Avatar key={n} name={n} />
            ))}
          </AvatarGroup>
        </span>
      </CardFooter>
    </Card>
  );
}
