import { Diff } from "@/registry/plainspoken/ui/diff";

/** Side by side: the old text with its deletions, the new one with its insertions. Stacked on phones. */
export default function DiffSplit() {
  return (
    <Diff
      layout="split"
      beforeLabel="Version 3, saved by Jonas"
      afterLabel="Your version"
      before="Amara watches the order dashboard from 08:30. If checkout errors rise above 2%, we pause the sale banner."
      after="Amara watches the order dashboard from 08:00. If checkout errors rise above 1%, we pause the sale banner and say so in the launch channel."
      className="max-w-3xl"
    />
  );
}
