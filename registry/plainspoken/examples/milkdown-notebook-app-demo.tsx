import { NotebookApp } from "@/registry/plainspoken/blocks/milkdown/notebook-app";

/**
 * The whole notebook in a 720px box, on RFC-0042: search the tree, open a runbook, type / for a
 * block, drag one by its handle, and jump around with the outline (a menu below xl widths). Edits
 * last until you reload; on the demo page they're kept in the browser.
 */
export default function MilkdownNotebookAppDemo() {
  return <NotebookApp hashRouting={false} className="h-[720px] border border-border" />;
}
