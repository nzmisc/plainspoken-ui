import { KanbanToolbar } from "@/registry/plainspoken/blocks/kanban/toolbar";

/**
 * The filters on their own, keeping their own state. Open Assignee or Label for the checkbox
 * panels; set one and its button turns bold and says how many are chosen.
 */
export default function KanbanToolbarDemo() {
  return <KanbanToolbar defaultFilter={{ query: "", people: ["hana"], labels: [], mine: false }} shown={6} total={27} />;
}
