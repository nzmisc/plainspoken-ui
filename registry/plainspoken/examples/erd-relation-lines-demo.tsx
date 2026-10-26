import { ORDERS_MODEL } from "@/registry/plainspoken/blocks/erd/data";
import { estimateSize, routeAll, type Box } from "@/registry/plainspoken/blocks/erd/geometry";
import { tableById } from "@/registry/plainspoken/blocks/erd/model";
import { ErdRelationLines } from "@/registry/plainspoken/blocks/erd/relation-lines";
import { ErdTableCard } from "@/registry/plainspoken/blocks/erd/table-node";

const PLACES: Record<string, { x: number; y: number }> = {
  "sales.customers": { x: 0, y: 0 },
  "sales.orders": { x: 340, y: 40 },
  "sales.payments": { x: 740, y: 0 },
};
const WIDTH = 290;

/**
 * Lines from foreign key rows to the keys they reference, routed with right angles: one bar and a
 * second bar for "exactly one" at the referenced end, a circle and the crow's foot for "zero or
 * many" at the other. Each line leaves its table straight, through its mark, and turns only past
 * the mark's tip. The tables here are fixed in place and fixed in width, so no canvas is needed.
 */
export default function ErdRelationLinesDemo() {
  const model = { ...ORDERS_MODEL, relations: ORDERS_MODEL.relations.filter((r) => r.from.table in PLACES && r.to.table in PLACES) };
  const boxes: Record<string, Box> = Object.fromEntries(
    Object.entries(PLACES).map(([id, p]) => [id, { ...p, width: WIDTH, height: estimateSize(model, tableById(model, id)!).height }]),
  );
  return (
    <div className="overflow-x-auto">
      <div className="relative h-[372px] w-[1030px]">
        <ErdRelationLines routes={routeAll(model, boxes, new Set(), "orthogonal")} />
        {Object.entries(PLACES).map(([id, p]) => (
          <div key={id} className="absolute" style={{ left: p.x, top: p.y, width: WIDTH }}>
            <ErdTableCard model={model} table={tableById(model, id)!} className="w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
