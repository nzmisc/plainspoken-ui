import type { Metadata } from "next";
import { Suspense } from "react";
import { MusicSearch } from "@/registry/plainspoken/blocks/music/search";

export const metadata: Metadata = {
  title: "Search",
  description: "Search the music demo's catalogue, or browse it by genre and mood.",
};

// The search reads ?q= and ?genre= from the URL, so it renders in the browser, inside Suspense
export default function MusicSearchPage() {
  return (
    <Suspense fallback={<p className="p-4 text-muted-foreground">Loading search…</p>}>
      <MusicSearch />
    </Suspense>
  );
}
