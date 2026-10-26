import type { Metadata } from "next";
import { ThemeToggle } from "@/components/site/theme";
import { KanbanDemo } from "./kanban-demo";

export const metadata: Metadata = {
  title: "Kanban",
  description:
    "A task board built from plainspoken-ui: columns with work-in-progress limits, cards you drag with a pointer, a finger or the keyboard, filters, and a card dialog with a checklist, attachments, comments and activity.",
};

export default function KanbanPage() {
  return <KanbanDemo actions={<ThemeToggle size="sm" />} className="h-[calc(100dvh-var(--demo-bar))]" />;
}
