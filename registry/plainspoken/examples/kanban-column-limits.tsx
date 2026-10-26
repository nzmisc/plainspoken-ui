import { CARDS_BY_ID, COLUMNS, KANBAN_TODAY } from "@/registry/plainspoken/blocks/kanban/data";
import { KanbanCard } from "@/registry/plainspoken/blocks/kanban/card";
import { KanbanColumn } from "@/registry/plainspoken/blocks/kanban/column";

/**
 * Over its work-in-progress limit (four cards where three are allowed): an amber edge, a badge
 * with a symbol and a line that says so. Next to it, an empty column with its dashed box.
 */
export default function KanbanColumnLimits() {
  const doing = COLUMNS.find((c) => c.id === "doing")!;
  return (
    <div className="flex h-[480px] items-start gap-3 overflow-x-auto">
      <KanbanColumn column={doing}>
        {doing.cardIds.map((id) => (
          <li key={id}>
            <KanbanCard card={{ ...CARDS_BY_ID[id], cover: null }} today={KANBAN_TODAY} />
          </li>
        ))}
      </KanbanColumn>
      <KanbanColumn column={{ id: "blocked", title: "Blocked", limit: 2, cardIds: [] }} emptyDescription="Nothing is stuck. Drag a card here when it is." />
    </div>
  );
}
