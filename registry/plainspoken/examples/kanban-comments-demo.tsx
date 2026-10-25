import { CARDS_BY_ID } from "@/registry/plainspoken/blocks/kanban/data";
import { KanbanComments } from "@/registry/plainspoken/blocks/kanban/comments";

/**
 * A thread of four. Mentions are marked, and the one of you (Rosa) is outlined. Your own comment
 * has a ⋯ menu to edit or delete it; write one below and it joins the thread.
 */
export default function KanbanCommentsDemo() {
  return <KanbanComments defaultComments={CARDS_BY_ID["FA-110"].comments} className="max-w-xl" />;
}
