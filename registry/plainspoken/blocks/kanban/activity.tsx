import type { ReactNode } from "react";
import { KANBAN_NOW, LABELS, PEOPLE, type ActivityEntry, type ActivityEvent, type BoardLabel, type Person } from "@/registry/plainspoken/blocks/kanban/data";
import { dayShort, labelById, ms, personById, PRIORITIES } from "@/registry/plainspoken/blocks/kanban/format";
import { Avatar } from "@/registry/plainspoken/ui/avatar";
import { RelativeTime } from "@/registry/plainspoken/ui/relative-time";
import { cn } from "@/lib/utils";

/** What happened, as the end of a sentence that starts with who did it */
export function activityText(e: ActivityEvent, people: Person[] = PEOPLE, labels: BoardLabel[] = LABELS): ReactNode {
  const b = (s: string) => <b className="font-semibold">{s}</b>;
  switch (e.type) {
    case "created":
      return "created this card";
    case "moved":
      return (
        <>
          moved this card from {b(e.from)} to {b(e.to)}
        </>
      );
    case "assigned":
      return <>assigned {b(personById(e.person, people).name)}</>;
    case "unassigned":
      return <>took {b(personById(e.person, people).name)} off this card</>;
    case "attached":
      return <>attached {b(e.name)}</>;
    case "detached":
      return <>removed the file {b(e.name)}</>;
    case "checked":
      return <>ticked off {b(e.item)}</>;
    case "unchecked":
      return <>unticked {b(e.item)}</>;
    case "labelled":
      return <>added the label {b(labelById(e.label, labels)?.label ?? e.label)}</>;
    case "unlabelled":
      return <>removed the label {b(labelById(e.label, labels)?.label ?? e.label)}</>;
    case "due":
      return e.date ? <>set the due date to {b(dayShort(e.date))}</> : "removed the due date";
    case "priority":
      return <>set the priority to {b(PRIORITIES[e.priority].label)}</>;
    case "cover":
      return e.name ? <>made {b(e.name)} the cover</> : "removed the cover";
    case "described":
      return "changed the description";
  }
}

export interface KanbanActivityProps {
  /** Oldest first, as kept on the card; shown newest first */
  entries: ActivityEntry[];
  people?: Person[];
  labels?: BoardLabel[];
  /** The demo's clock, for "3 days ago" */
  now?: string;
  className?: string;
}

/**
 * What has happened to a card, newest first: "Priya Natarajan moved this card from To do to In
 * progress, 4 days ago", with a small round avatar. Columns, people, files and labels are in bold.
 */
export function KanbanActivity({ entries, people = PEOPLE, labels = LABELS, now = KANBAN_NOW, className }: KanbanActivityProps) {
  if (!entries.length) return <p className={cn("text-[13px] text-muted-foreground", className)}>Nothing has happened yet.</p>;
  return (
    <ol data-slot="kanban-activity" aria-label="Activity" className={cn("flex flex-col", className)}>
      {[...entries].reverse().map((a) => {
        const who = personById(a.by, people);
        return (
          <li key={a.id} className="flex items-start gap-2 py-1 text-[13px] leading-snug">
            <Avatar name={who.name} src={who.picture} shape="circle" size={20} className="mt-px" />
            <p className="min-w-0 flex-1">
              {who.name} {activityText(a.event, people, labels)}
              <span className="text-muted-foreground">
                {", "}
                <RelativeTime date={ms(a.at)} now={ms(now)} format="long" locale="en-GB" />
              </span>
            </p>
          </li>
        );
      })}
    </ol>
  );
}
