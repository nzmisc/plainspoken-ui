import { DocHistory } from "@/registry/plainspoken/blocks/conflicts/doc-history";

/** Approach E for a document: live editing with the history beside it; compare any version with now and restore it. */
export default function ConflictsDocHistoryDemo() {
  return <DocHistory />;
}
