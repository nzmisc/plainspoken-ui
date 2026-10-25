import { Suspense } from "react";
import { Explore } from "@/registry/plainspoken/blocks/social/explore";

/** Explore without a search: trending topics, popular posts, and people to follow. Searching goes to the Explore page with ?q=. */
export default function SocialExploreDemo() {
  return (
    <div className="max-h-[600px] max-w-[600px] overflow-y-auto border border-border">
      <Suspense>
        <Explore />
      </Suspense>
    </div>
  );
}
