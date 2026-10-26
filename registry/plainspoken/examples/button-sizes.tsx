import { Plus } from "@/registry/plainspoken/lib/icons";
import { Button, IconButton } from "@/registry/plainspoken/ui/button";
import { Input } from "@/registry/plainspoken/ui/input";
import { CONTROL_HEIGHT, CONTROL_SIZES } from "@/registry/plainspoken/lib/controls";

/** Four heights. Every control of one size is exactly as tall as every other, so a row of them lines up. */
export default function ButtonSizes() {
  return (
    <div className="flex flex-col gap-3">
      {CONTROL_SIZES.map((size) => (
        <div key={size} className="flex flex-wrap items-center gap-2">
          <span className="w-16 font-mono text-[12px] text-muted-foreground">
            {size} {CONTROL_HEIGHT[size]}px
          </span>
          <Button size={size} variant="primary" icon={Plus}>
            New
          </Button>
          <Button size={size}>Cancel</Button>
          <IconButton size={size} icon={Plus} label="Add" />
          <Input size={size} placeholder="Name" aria-label="Name" className="w-40" />
        </div>
      ))}
    </div>
  );
}
