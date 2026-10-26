import { TextboxAutoMerge } from "@/registry/plainspoken/blocks/conflicts/textbox-auto-merge";

/** Both screens side by side: type in Jonas's box as well as yours and watch the two copies merge. */
export default function ConflictsTextboxAutoMergeSplit() {
  return <TextboxAutoMerge defaultSplit />;
}
