import type { Metadata } from "next";
import { DemoBar } from "@/components/site/demo-bar";
import { MusicApp } from "@/registry/plainspoken/blocks/music/app-shell";
import { demoPlayback } from "@/registry/plainspoken/blocks/music/data";

export const metadata: Metadata = {
  title: { default: "Music", template: "%s · Music demo" },
  description: "A music player built from plainspoken-ui: library, playlists, albums, artists, search and a player bar.",
};

// Something is loaded in the player from the start, paused part-way in, so the bar shows a track
const initial = demoPlayback("night-drive");

export default function MusicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <DemoBar slug="music" />
      <MusicApp initial={initial}>{children}</MusicApp>
    </>
  );
}
