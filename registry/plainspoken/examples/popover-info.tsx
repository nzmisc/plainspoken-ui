import { Info } from "@/registry/plainspoken/lib/icons";
import { Popover } from "@/registry/plainspoken/ui/popover";

/** Plain information behind an icon, with an arrow and no title bar. A popover, not a tooltip, because it holds a link. */
export default function PopoverInfo() {
  return (
    <div className="flex items-center gap-1">
      Available balance: <b className="tabular-nums">€1,204.50</b>
      <Popover trigger={Info} triggerVariant="ghost" size="sm" label="About the balance" arrow className="w-72">
        <p>
          What you can pay out today: sales minus refunds, fees and payouts already on their way. Sales from the last 2 days are
          still pending.{" "}
          <a href="#payouts" className="text-link underline visited:text-link-visited">
            Payout schedule
          </a>
        </p>
      </Popover>
    </div>
  );
}
