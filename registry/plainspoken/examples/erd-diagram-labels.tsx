import { SHOP_MODEL } from "@/registry/plainspoken/blocks/erd/data";
import { ErdDiagram } from "@/registry/plainspoken/blocks/erd/diagram";

/** The whole shop with 1 and N labels, curved lines, every table folded to its keys and no frames: the shape of the schema at a glance. */
export default function ErdDiagramLabels() {
  return (
    <ErdDiagram
      model={SHOP_MODEL}
      collapsed={SHOP_MODEL.tables.map((t) => t.id)}
      display={{ notation: "labels", lines: "curved", frames: false, types: false }}
      className="h-[28rem] border border-border"
    />
  );
}
