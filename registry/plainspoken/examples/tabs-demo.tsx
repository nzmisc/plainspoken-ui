import { Tabs } from "@/registry/plainspoken/ui/tabs";

/** Focus the strip and use ←/→, Home and End; Tab then goes into the panel. The disabled tab is skipped. */
export default function TabsDemo() {
  return (
    <Tabs
      label="Project"
      className="max-w-xl"
      tabs={[
        { id: "overview", label: "Overview", content: <p>plainspoken-ui: a React component library for pages that read like documents.</p> },
        { id: "issues", label: "Issues", count: 12, content: <p>12 open, 3 of them labelled “good first issue”.</p> },
        { id: "pulls", label: "Pull requests", count: 2, content: <p>2 open: “Add a slider” and “Fix the toast timer”.</p> },
        { id: "insights", label: "Insights", disabled: true, content: null },
        { id: "settings", label: "Settings", content: <p>Visibility: public. Default branch: main.</p> },
      ]}
    />
  );
}
