import { GridOrdersTable } from "@/registry/plainspoken/blocks/grid/orders-table";

/**
 * Started with filters and a two-level sort: orders shipped by Northpost that arrived late, worst
 * first, then the biggest. The chips above the table edit or remove each filter.
 */
export default function GridOrdersTableFiltered() {
  return (
    <GridOrdersTable
      maxHeight="24rem"
      initialFilters={{
        carrier: { kind: "values", values: ["Northpost"] },
        late: { kind: "conditions", conditions: [{ op: "gte", value: "1" }] },
      }}
      initialSort={[
        { key: "late", dir: "desc" },
        { key: "total", dir: "desc" },
      ]}
      initialHiddenColumns={["channel", "payment", "email", "city", "coupon", "shipping", "tracking", "rating"]}
    />
  );
}
