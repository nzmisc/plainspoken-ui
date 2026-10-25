import { ErdApp } from "@/registry/plainspoken/blocks/erd/erd-app";

/**
 * The whole editor, as at /demos/erd but not remembered between visits: the table list, the
 * diagram with its toolbar, and the details of the selected table.
 */
export default function ErdAppDemo() {
  return <ErdApp defaultSelected={["sales.orders"]} className="h-[40rem] border border-border" />;
}
