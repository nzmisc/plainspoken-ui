import { GridApp } from "@/registry/plainspoken/blocks/grid/grid-app";

/**
 * The whole data grid in a 640px box: switch views, filter and sort, resize a column, then Save as
 * view; click a row for its order.
 */
export default function GridAppDemo() {
  return <GridApp className="h-[640px] border border-border" />;
}
