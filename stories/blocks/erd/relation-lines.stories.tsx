import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { SHOP_MODEL } from "@/registry/plainspoken/blocks/erd/data";
import { estimateSize, routeAll, type Box } from "@/registry/plainspoken/blocks/erd/geometry";
import { tableById } from "@/registry/plainspoken/blocks/erd/model";
import { ErdRelationLines } from "@/registry/plainspoken/blocks/erd/relation-lines";
import { ErdTableCard } from "@/registry/plainspoken/blocks/erd/table-node";
import Demo from "@/registry/plainspoken/examples/erd-relation-lines-demo";
import Labels from "@/registry/plainspoken/examples/erd-relation-lines-labels";

/** Lines under fixed tables, as in the docs. In the diagram they follow the tables as they're dragged. */
const meta: Meta<typeof ErdRelationLines> = {
  title: "Blocks/ERD/Relationship lines",
  component: ErdRelationLines,
};
export default meta;
type Story = StoryObj<typeof ErdRelationLines>;

/** Crow's foot marks, right angles. */
export const CrowsFoot: Story = { render: () => <Demo /> };

/** 1 and N labels, curves, highlighted. */
export const LabelsAndCurves: Story = { render: () => <Labels /> };

/** Tables facing each other, one above another (the line goes round the outside), and one that references itself */
const PLACES: Record<string, { x: number; y: number }> = {
  "catalog.categories": { x: 0, y: 0 },
  "catalog.products": { x: 340, y: 60 },
  "catalog.brands": { x: 380, y: 380 },
  "catalog.product_variants": { x: 0, y: 320 },
};

function Board({ lines }: { lines: "orthogonal" | "curved" }) {
  const model = {
    ...SHOP_MODEL,
    tables: SHOP_MODEL.tables.filter((t) => t.id in PLACES),
    relations: SHOP_MODEL.relations.filter((r) => r.from.table in PLACES && r.to.table in PLACES),
  };
  const boxes: Record<string, Box> = Object.fromEntries(Object.entries(PLACES).map(([id, p]) => [id, { ...p, width: 260, height: estimateSize(model, tableById(model, id)!).height }]));
  return (
    <div className="relative h-[560px] w-[720px]">
      <ErdRelationLines routes={routeAll(model, boxes, new Set(), lines)} />
      {Object.entries(PLACES).map(([id, p]) => (
        <div key={id} className="absolute w-[260px]" style={{ left: p.x, top: p.y }}>
          <ErdTableCard model={model} table={tableById(model, id)!} className="w-full" />
        </div>
      ))}
    </div>
  );
}

/** Crow's foot marks on curves: each line runs straight out of its table, through its mark, and bends only past the mark's tip. */
export const CurvedCrowsFoot: Story = { render: () => <Board lines="curved" /> };

/** The same tables with right angles. */
export const OrthogonalCrowsFoot: Story = { render: () => <Board lines="orthogonal" /> };
