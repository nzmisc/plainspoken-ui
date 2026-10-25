import type { Metadata } from "next";
import { MusicLibrary } from "@/registry/plainspoken/blocks/music/library";

export const metadata: Metadata = {
  title: "Your Library",
  description: "Saved playlists, albums and artists in the music demo, with filters, sort orders and a list or grid view.",
};

export default function MusicLibraryPage() {
  return <MusicLibrary />;
}
