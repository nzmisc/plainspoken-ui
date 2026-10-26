import { TextboxAutoMerge } from "@/registry/plainspoken/blocks/conflicts/textbox-auto-merge";

/** Approach D for a text box: changes in different sentences merge as you type; only words you both changed are marked. */
export default function ConflictsTextboxAutoMergeDemo() {
  return <TextboxAutoMerge />;
}
