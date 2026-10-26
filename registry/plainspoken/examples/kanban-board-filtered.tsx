"use client";

import { useState } from "react";
import { CARDS_BY_ID, COLUMNS, KANBAN_TODAY, ME } from "@/registry/plainspoken/blocks/kanban/data";
import { matchesFilter, moveCard, type BoardFilter } from "@/registry/plainspoken/blocks/kanban/format";
import { KanbanBoard } from "@/registry/plainspoken/blocks/kanban/board";
import { KanbanToolbar } from "@/registry/plainspoken/blocks/kanban/toolbar";

/**
 * The toolbar driving the board's filter, starting on the Accessibility label. Columns say "1 of
 * 4"; dragging and the keyboard move cards among the ones shown, and the hidden ones keep their
 * places.
 */
export default function KanbanBoardFiltered() {
  const [filter, setFilter] = useState<BoardFilter>({ query: "", people: [], labels: ["a11y"], mine: false });
  const [columns, setColumns] = useState(COLUMNS);
  const total = columns.reduce((n, c) => n + c.cardIds.length, 0);
  const shown = columns.reduce((n, c) => n + c.cardIds.filter((id) => matchesFilter(CARDS_BY_ID[id], filter, ME)).length, 0);
  return (
    <div className="flex h-[600px] flex-col border border-border">
      <KanbanToolbar filter={filter} onFilterChange={setFilter} shown={shown} total={total} className="border-b border-border px-3 py-1.5" />
      <KanbanBoard
        columns={columns}
        onMove={(m) => setColumns((cs) => moveCard(cs, m.cardId, m.to, m.index))}
        cards={CARDS_BY_ID}
        today={KANBAN_TODAY}
        filter={(card) => matchesFilter(card, filter, ME)}
        onOpen={() => {}}
        className="flex-1"
      />
    </div>
  );
}
