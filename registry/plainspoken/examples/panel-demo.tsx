import { RefreshCw } from "@/registry/plainspoken/lib/icons";
import { IconButton } from "@/registry/plainspoken/ui/button";
import { Meter } from "@/registry/plainspoken/ui/progress";
import { Panel } from "@/registry/plainspoken/ui/panel";

/** A title bar with meta text and sm controls, over a padded body. Two panels side by side: their bars line up. */
export default function PanelDemo() {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Panel title="Storage" meta="updated 2 min ago" actions={<IconButton variant="ghost" icon={RefreshCw} label="Refresh" />}>
        <Meter label="Storage used" value={41} warn={80} crit={95} valueText="41% · 29.5 GB free" />
      </Panel>
      <Panel title="Plan" meta="Team, yearly">
        <p>
          10 seats, renews on <b>1 March 2027</b>.
        </p>
      </Panel>
    </div>
  );
}
