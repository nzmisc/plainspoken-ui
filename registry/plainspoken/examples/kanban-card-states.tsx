import type { ReactNode } from "react";
import { CARDS_BY_ID, KANBAN_TODAY } from "@/registry/plainspoken/blocks/kanban/data";
import { KanbanCard } from "@/registry/plainspoken/blocks/kanban/card";

const State = ({ name, children }: { name: string; children: ReactNode }) => (
  <li className="flex flex-col gap-1">
    <span className="text-[12px] font-semibold text-muted-foreground">{name}</span>
    {children}
  </li>
);

/**
 * How a card looks while it moves: picked up from the keyboard, the place it left while the
 * pointer carries it, the copy under the pointer, and just dropped. A finished card no longer
 * marks its date; a card with nothing on it is just its title.
 */
export default function KanbanCardStates() {
  const c = CARDS_BY_ID["FA-121"];
  return (
    <ul className="grid max-w-3xl gap-3 sm:grid-cols-3">
      <State name="Picked up (keyboard)">
        <KanbanCard card={c} today={KANBAN_TODAY} dragState="lifted" />
      </State>
      <State name="Left behind (pointer)">
        <KanbanCard card={c} today={KANBAN_TODAY} dragState="ghost" />
      </State>
      <State name="Under the pointer">
        <KanbanCard card={c} today={KANBAN_TODAY} dragState="overlay" />
      </State>
      <State name="Just dropped">
        <KanbanCard card={c} today={KANBAN_TODAY} landed />
      </State>
      <State name="Done, past its date">
        <KanbanCard card={CARDS_BY_ID["FA-097"]} today={KANBAN_TODAY} done />
      </State>
      <State name="Nothing on it yet">
        <KanbanCard card={CARDS_BY_ID["FA-137"]} today={KANBAN_TODAY} />
      </State>
    </ul>
  );
}
