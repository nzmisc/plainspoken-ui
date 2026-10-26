import { MilkdownEditor } from "@/registry/plainspoken/ui/milkdown-editor";

const POLICY = `### Lost parcels

If a parcel is lost, tell dispatch **the same day**. We pay out up to €250 per parcel; above that the [insurer's form](https://fernhill.example/claims) is needed.

- [x] Read by everyone on the rota`;

/** Read only: no toolbar, links open in a new tab, and the modes still switch, to see or copy the source. */
export default function MilkdownEditorReadOnly() {
  return <MilkdownEditor aria-label="Lost parcels policy" defaultValue={POLICY} readOnly className="max-w-2xl" />;
}
