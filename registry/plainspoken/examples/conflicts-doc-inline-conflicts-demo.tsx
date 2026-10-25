import { DocInlineConflicts } from "@/registry/plainspoken/blocks/conflicts/doc-inline-conflicts";

/** Approach B for a document: a paragraph you both changed shows both versions in place, tagged by author. */
export default function ConflictsDocInlineConflictsDemo() {
  return <DocInlineConflicts />;
}
