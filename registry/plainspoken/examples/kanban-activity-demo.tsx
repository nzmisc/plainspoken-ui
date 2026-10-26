import { CARDS_BY_ID } from "@/registry/plainspoken/blocks/kanban/data";
import { KanbanActivity } from "@/registry/plainspoken/blocks/kanban/activity";

/** Everything that happened to the seat map card, newest first. */
export default function KanbanActivityDemo() {
  return <KanbanActivity entries={CARDS_BY_ID["FA-110"].activity} className="max-w-xl" />;
}
