import { SHOP_MODEL } from "@/registry/plainspoken/blocks/erd/data";
import { ErdLegend } from "@/registry/plainspoken/blocks/erd/legend";

/** Both notations side by side: crow's foot ends, and the 1 and N labels, with the column marks and the schema colours. */
export default function ErdLegendDemo() {
  return (
    <div className="flex flex-wrap items-start gap-4">
      <ErdLegend schemas={SHOP_MODEL.schemas} />
      <ErdLegend notation="labels" />
    </div>
  );
}
