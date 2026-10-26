import type { Metadata } from "next";
import { Plus } from "@/registry/plainspoken/lib/icons";
import { AppPage, AppPageHeader } from "@/registry/plainspoken/blocks/app/page-header";
import { AppProjectBoard } from "@/registry/plainspoken/blocks/app/project-board";
import { Button } from "@/registry/plainspoken/ui/button";

export const metadata: Metadata = {
  title: "Projects · App skeleton",
  description: "The project board of Tally, a demo invoicing app built from plainspoken-ui: cards by stage with progress, budget meters and teams.",
};

export default function ProjectsPage() {
  return (
    <AppPage className="max-w-7xl">
      <AppPageHeader
        crumbs={[{ label: "Brightwater Studio", href: "/demos/app" }, { label: "Projects" }]}
        title="Projects"
        description="Every job by stage. Budgets turn amber at 90% used and red when they're over."
        actions={
          <Button variant="primary" icon={Plus}>
            New project
          </Button>
        }
      />
      <AppProjectBoard />
    </AppPage>
  );
}
