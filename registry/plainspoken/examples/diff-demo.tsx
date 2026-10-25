import { Diff, DiffLegend } from "@/registry/plainspoken/ui/diff";

/** A sentence reworded, as one text with what was taken out and what was put in. */
export default function DiffDemo() {
  return (
    <div className="flex max-w-xl flex-col gap-2">
      <Diff
        before="Returns are free within 14 days of delivery, as long as the parcel is unopened."
        after="Returns are free within 30 days of delivery, as long as the item is unused and in its box."
      />
      <DiffLegend />
    </div>
  );
}
