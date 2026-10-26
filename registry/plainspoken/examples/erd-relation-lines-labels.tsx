import { ORDERS_MODEL } from "@/registry/plainspoken/blocks/erd/data";
import { estimateSize, routeAll, type Box } from "@/registry/plainspoken/blocks/erd/geometry";
import { tableById } from "@/registry/plainspoken/blocks/erd/model";
import { ErdRelationLines } from "@/registry/plainspoken/blocks/erd/relation-lines";
import { ErdTableCard } from "@/registry/plainspoken/blocks/erd/table-node";

const PLACES: Record<string, { x: number; y: number }> = {
  "sales.customers": { x: 0, y: 30 },
  "sales.addresses": { x: 360, y: 0 },
};

/** The simpler notation, 1 and N at the ends, with curved lines; and the line of the highlighted table drawn strong. */
export default function ErdRelationLinesLabels() {
  const model = { ...ORDERS_MODEL, relations: ORDERS_MODEL.relations.filter((r) => r.from.table in PLACES && r.to.table in PLACES) };
  const boxes: Record<string, Box> = Object.fromEntries(
    Object.entries(PLACES).map(([id, p]) => [id, { ...p, width: 260, height: estimateSize(model, tableById(model, id)!).height }]),
  );
  return (
    <div className="overflow-x-auto">
      <div className="relative h-[230px] w-[620px]">
        <ErdRelationLines routes={routeAll(model, boxes, new Set(), "curved", "labels")} notation="labels" highlighted={new Set(model.relations.map((r) => r.id))} />
        {Object.entries(PLACES).map(([id, p]) => (
          <div key={id} className="absolute w-[260px]" style={{ left: p.x, top: p.y }}>
            <ErdTableCard model={model} table={tableById(model, id)!} className="w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
