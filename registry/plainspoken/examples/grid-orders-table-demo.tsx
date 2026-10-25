import { GridOrdersTable } from "@/registry/plainspoken/blocks/grid/orders-table";

/**
 * All three thousand orders, newest first. Click a funnel for a column's filter, shift-click a
 * second header to sort by it too, drag a header's right edge to resize, and use Export to copy or
 * download what you see.
 */
export default function GridOrdersTableDemo() {
  return <GridOrdersTable maxHeight="32rem" />;
}
