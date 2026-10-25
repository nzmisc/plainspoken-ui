import { Skeleton } from "@/registry/plainspoken/ui/skeleton";

/** The loading region carries aria-busy and a label; the gray shapes stand in for a message list. */
export default function SkeletonDemo() {
  return (
    <section aria-busy="true" aria-label="Loading messages" className="flex max-w-md flex-col border border-border">
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex gap-3 border-b border-border p-3 last:border-b-0">
          <Skeleton className="size-7 shrink-0" />
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="w-40" />
            <Skeleton lines={2} />
          </div>
        </div>
      ))}
    </section>
  );
}
