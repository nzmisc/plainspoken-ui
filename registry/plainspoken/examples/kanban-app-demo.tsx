import { KanbanApp } from "@/registry/plainspoken/blocks/kanban/kanban-app";

/**
 * The whole board in a 640px box: drag cards between columns, filter them, open one to tick its
 * checklist, add a file or a comment. Narrow the window to see one column to a screen.
 */
export default function KanbanAppDemo() {
  return <KanbanApp className="h-[640px] border border-border" />;
}
