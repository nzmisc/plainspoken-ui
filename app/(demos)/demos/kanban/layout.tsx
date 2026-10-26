import { DemoBar } from "@/components/site/demo-bar";
import { Toaster } from "@/registry/plainspoken/ui/toast";

export default function KanbanLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <DemoBar slug="kanban" />
      {children}
      <Toaster />
    </>
  );
}
