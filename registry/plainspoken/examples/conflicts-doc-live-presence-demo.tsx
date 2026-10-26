import { DocLivePresence } from "@/registry/plainspoken/blocks/conflicts/doc-live-presence";

/** Approach A for a document: everyone's carets and “is editing” marks, changes flowing in as they're typed. */
export default function ConflictsDocLivePresenceDemo() {
  return <DocLivePresence />;
}
