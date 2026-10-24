import { CONTROL_SIZES } from "@/registry/plainspoken/lib/controls";
import { Button } from "@/registry/plainspoken/ui/button";
import { Input } from "@/registry/plainspoken/ui/input";
import { Select } from "@/registry/plainspoken/ui/select";

/** A text field, a select and a button of one size are the same height, so a filter row lines up. */
export default function InputSizes() {
  return (
    <div className="flex flex-col gap-2">
      {CONTROL_SIZES.map((size) => (
        <div key={size} className={`ctl-${size} flex items-center gap-2`}>
          <Input placeholder={`Input ${size}`} aria-label={`Input ${size}`} className="w-44" />
          <Select options={["All statuses", "Open", "Closed"]} aria-label="Status" />
          <Button>Apply</Button>
        </div>
      ))}
    </div>
  );
}
