import { Button } from "@/registry/plainspoken/ui/button";
import { Spinner } from "@/registry/plainspoken/ui/spinner";

/** Alone (announced as "Loading"), with visible words, and inside text. A loading Button draws the same mark. */
export default function SpinnerDemo() {
  return (
    <div className="flex flex-col items-start gap-3">
      <Spinner />
      <Spinner>Checking for updates…</Spinner>
      <p className="text-muted-foreground">
        Syncing 1,204 messages <Spinner label="Syncing" />
      </p>
      <Button loading>Saving</Button>
    </div>
  );
}
