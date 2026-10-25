import { CARDS_BY_ID } from "@/registry/plainspoken/blocks/kanban/data";
import { KanbanChecklist } from "@/registry/plainspoken/blocks/kanban/checklist";

/** A card's checklist, two of six done. Tick items, remove one with its ×, add more at the foot. */
export default function KanbanChecklistDemo() {
  return <KanbanChecklist defaultItems={CARDS_BY_ID["FA-124"].checklist} className="max-w-lg" />;
}
