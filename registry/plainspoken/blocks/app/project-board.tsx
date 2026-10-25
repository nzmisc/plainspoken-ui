"use client";

import { useState } from "react";
import { Columns2, LayoutList } from "@/registry/plainspoken/lib/icons";
import { APP_TODAY, customerById, PROJECTS, STAGES, type Project } from "@/registry/plainspoken/blocks/app/data";
import { day, STAGE_VARIANT } from "@/registry/plainspoken/blocks/app/format";
import { AppProjectCard } from "@/registry/plainspoken/blocks/app/project-card";
import { Badge } from "@/registry/plainspoken/ui/badge";
import { Icon } from "@/registry/plainspoken/ui/icon";
import { Progress } from "@/registry/plainspoken/ui/progress";
import { SegmentedControl } from "@/registry/plainspoken/ui/segmented-control";
import { SimpleTable } from "@/registry/plainspoken/ui/table";
import { cn } from "@/lib/utils";

export interface AppProjectBoardProps {
  projects?: Project[];
  /** Board (a column per stage) or a list */
  defaultView?: "board" | "list";
  today?: string;
  className?: string;
}

/**
 * Projects by stage: Planned, In progress, Review, Done, as columns of cards (they scroll
 * sideways on a phone), or as one table. A segmented control switches between the two.
 */
export function AppProjectBoard({ projects = PROJECTS, defaultView = "board", today = APP_TODAY, className }: AppProjectBoardProps) {
  const [view, setView] = useState(defaultView);
  return (
    <div data-slot="app-project-board" className={cn("flex flex-col gap-3", className)}>
      <div className="flex flex-wrap items-center gap-3">
        <SegmentedControl
          label="View"
          size="sm"
          value={view}
          onChange={setView}
          options={[
            { value: "board", label: <span className="inline-flex items-center gap-1.5"><Icon icon={Columns2} />Board</span> },
            { value: "list", label: <span className="inline-flex items-center gap-1.5"><Icon icon={LayoutList} />List</span> },
          ]}
        />
        <p className="text-[13px] text-muted-foreground">
          {projects.filter((p) => p.stage !== "Done").length} open, {projects.filter((p) => p.stage === "Done").length} done this month
        </p>
      </div>
      {view === "board" ? (
        <div className="-mx-3 overflow-x-auto px-3 pb-2 sm:mx-0 sm:px-0">
          <div className="grid min-w-[56rem] grid-cols-4 gap-3">
            {STAGES.map((s) => {
              const list = projects.filter((p) => p.stage === s);
              return (
                <section key={s} aria-labelledby={`stage-${s}`} className="flex min-w-0 flex-col gap-2 border border-border bg-muted p-2">
                  <h2 id={`stage-${s}`} className="flex items-center justify-between text-[13px] font-bold">
                    {s}
                    <Badge icon={false} className="bg-background tabular-nums">
                      {list.length}
                    </Badge>
                  </h2>
                  {list.map((p) => (
                    <AppProjectCard key={p.id} project={p} today={today} />
                  ))}
                  {list.length === 0 && <p className="border border-dashed border-border p-3 text-center text-[13px] text-muted-foreground">Nothing here</p>}
                </section>
              );
            })}
          </div>
        </div>
      ) : (
        <SimpleTable
          rows={[...projects].sort((a, b) => a.due.localeCompare(b.due))}
          rowKey={(p) => p.id}
          columns={[
            { key: "name", header: "Project", cell: (p) => <span className="font-semibold">{p.name}</span> },
            { key: "customer", header: "Customer", cell: (p) => customerById(p.customer)?.name, className: "max-sm:hidden" },
            { key: "stage", header: "Stage", cell: (p) => <Badge variant={STAGE_VARIANT[p.stage]}>{p.stage}</Badge> },
            { key: "due", header: "Due", cell: (p) => <span className="whitespace-nowrap">{day(p.due)}</span> },
            { key: "tasks", header: "Tasks", cell: (p) => <Progress value={p.tasksDone} max={p.tasks} label={`${p.name}: tasks done`} showValue={`${p.tasksDone}/${p.tasks}`} className="min-w-36" />, className: "max-md:hidden" },
          ]}
        />
      )}
    </div>
  );
}
