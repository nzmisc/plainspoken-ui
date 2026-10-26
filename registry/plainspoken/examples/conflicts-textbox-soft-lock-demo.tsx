import { TextboxSoftLock } from "@/registry/plainspoken/blocks/conflicts/textbox-soft-lock";

/** Approach A for a text box: press Jonas edits the same sentence and the field locks for you while he types. */
export default function ConflictsTextboxSoftLockDemo() {
  return <TextboxSoftLock />;
}
