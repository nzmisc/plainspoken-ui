import { DocCompareDialog } from "@/registry/plainspoken/blocks/conflicts/doc-compare-dialog";

/** Approach C for a document: a refused save opens a three-way compare, block by block, with the result underneath. */
export default function ConflictsDocCompareDialogDemo() {
  return <DocCompareDialog />;
}
