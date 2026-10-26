import { Search } from "@/registry/plainspoken/lib/icons";
import { Button } from "@/registry/plainspoken/ui/button";
import { EmptyState } from "@/registry/plainspoken/ui/empty-state";
import { Panel } from "@/registry/plainspoken/ui/panel";

/** compact, inside a panel: no results for a search, and the way out. */
export default function EmptyStateSearch() {
  return (
    <Panel title="Customers" meta="search: “hofman”" className="max-w-md">
      <EmptyState
        compact
        icon={Search}
        title="Nothing matches “hofman”"
        description="Check the spelling, or search by email address."
        actions={<Button size="sm">Clear search</Button>}
      />
    </Panel>
  );
}
