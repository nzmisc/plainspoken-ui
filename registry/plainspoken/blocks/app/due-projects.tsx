import Link from "next/link";
import { daysBetween } from "@/registry/plainspoken/lib/dates";
import { APP_TODAY, customerById, PROJECTS, type Project } from "@/registry/plainspoken/blocks/app/data";
import { dayShort, dueIn } from "@/registry/plainspoken/blocks/app/format";
import { Panel } from "@/registry/plainspoken/ui/panel";
import { Progress } from "@/registry/plainspoken/ui/progress";
import { linkVariants } from "@/registry/plainspoken/ui/text-link";
import { cn } from "@/lib/utils";

export interface AppDueProjectsProps {
  projects?: Project[];
  today?: string;
  /** How many to list. Default 5. */
  limit?: number;
  className?: string;
}

/** The open projects due next, soonest first: name, customer, when, and how many tasks are done as a progress bar. */
export function AppDueProjects({ projects = PROJECTS, today = APP_TODAY, limit = 5, className }: AppDueProjectsProps) {
  const next = projects
    .filter((p) => p.stage !== "Done")
    .sort((a, b) => a.due.localeCompare(b.due))
    .slice(0, limit);
  return (
    <Panel title="Due next" meta="open projects" flush actions={<Link href="/demos/app/projects" className={linkVariants({ className: "text-[13px]" })}>Board</Link>} className={className}>
      <ul className="divide-y divide-border">
        {next.map((p) => {
          const late = p.due < today;
          return (
            <li key={p.id} className="flex flex-col gap-1 px-2 py-1.5">
              <div className="flex items-baseline justify-between gap-2">
                <span className="min-w-0 truncate font-semibold">{p.name}</span>
                <span className={cn("shrink-0 text-[12px] tabular-nums", late || daysBetween(today, p.due) <= 14 ? "text-warning" : "text-muted-foreground")}>
                  {dayShort(p.due)}, {dueIn(p.due, today).replace("due ", "")}
                </span>
              </div>
              <span className="text-[13px] text-muted-foreground">{customerById(p.customer)?.name}</span>
              <Progress value={p.tasksDone} max={p.tasks} label={`${p.name}: tasks done`} showValue={`${p.tasksDone}/${p.tasks} tasks`} />
            </li>
          );
        })}
      </ul>
    </Panel>
  );
}
