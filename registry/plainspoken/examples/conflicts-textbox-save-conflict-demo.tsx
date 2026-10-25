import { TextboxSaveConflict } from "@/registry/plainspoken/blocks/conflicts/textbox-save-conflict";

/** Approach C for a text box: press Save with an old version and the server refuses; the dialog shows both versions. */
export default function ConflictsTextboxSaveConflictDemo() {
  return <TextboxSaveConflict />;
}
