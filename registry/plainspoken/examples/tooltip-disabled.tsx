import { Button } from "@/registry/plainspoken/ui/button";
import { Tooltip } from "@/registry/plainspoken/ui/tooltip";

/** A disabled button gets no pointer or focus events, so the tooltip goes on a focusable wrapper that says why. */
export default function TooltipDisabled() {
  return (
    <div className="flex items-center gap-2">
      <Button>Save draft</Button>
      <Tooltip content="Add at least one recipient first">
        <span tabIndex={0} className="inline-flex">
          <Button variant="primary" disabled className="pointer-events-none">
            Send
          </Button>
        </span>
      </Tooltip>
    </div>
  );
}
