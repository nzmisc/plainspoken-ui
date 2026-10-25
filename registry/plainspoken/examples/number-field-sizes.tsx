import { CONTROL_HEIGHT, CONTROL_SIZES } from "@/registry/plainspoken/lib/controls";
import { Button } from "@/registry/plainspoken/ui/button";
import { NumberField } from "@/registry/plainspoken/ui/number-field";

/** The steppers are square, as wide as the box is tall, so a NumberField lines up with a Button of the same size. */
export default function NumberFieldSizes() {
  return (
    <div className="flex flex-col gap-3">
      {CONTROL_SIZES.map((size) => (
        <div key={size} className="flex flex-wrap items-center gap-2">
          <span className="w-16 font-mono text-[12px] text-muted-foreground">
            {size} {CONTROL_HEIGHT[size]}px
          </span>
          <NumberField size={size} defaultValue={3} min={1} aria-label={`Quantity (${size})`} />
          <Button size={size} variant="primary">
            Add to cart
          </Button>
        </div>
      ))}
    </div>
  );
}
