import type { Metadata } from "next";
import { Suspense } from "react";
import { Explore } from "@/registry/plainspoken/blocks/social/explore";

export const metadata: Metadata = {
  title: "Explore",
  description: "Search posts and people, see what's trending and find people to follow.",
};

// Explore reads ?q= from the address, so it renders in the browser, inside Suspense
export default function ExplorePage() {
  return (
    <Suspense fallback={<p className="p-4 text-muted-foreground">Loading…</p>}>
      <Explore />
    </Suspense>
  );
}
