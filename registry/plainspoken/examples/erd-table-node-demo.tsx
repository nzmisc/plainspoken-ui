import { SHOP_MODEL } from "@/registry/plainspoken/blocks/erd/data";
import { tableById } from "@/registry/plainspoken/blocks/erd/model";
import { ErdTableCard } from "@/registry/plainspoken/blocks/erd/table-node";

/**
 * Two tables of the demo shop: a key icon for the primary key, a link for each foreign key, and
 * marks for unique (UQ), defaults (DEF), identity (ID), indexes (IDX) and nullable columns (NULL).
 * Point at a mark, a column or the header for what it means and the comments.
 */
export default function ErdTableNodeDemo() {
  return (
    <div className="flex flex-wrap items-start gap-4">
      <ErdTableCard model={SHOP_MODEL} table={tableById(SHOP_MODEL, "sales.orders")!} />
      <ErdTableCard model={SHOP_MODEL} table={tableById(SHOP_MODEL, "fulfilment.inventory")!} />
    </div>
  );
}
