import type { Metadata } from "next";
import { AlbumCard, ArtistCard, PlaylistCard, RecentGrid, Shelf } from "@/registry/plainspoken/blocks/music/media-card";
import { ALBUMS, ARTISTS, RECENTLY_PLAYED, greeting } from "@/registry/plainspoken/blocks/music/data";

export const metadata: Metadata = {
  title: "Home",
  description: "The music demo's home: recently played, mixes made for you, new releases and artists.",
};

const MADE_FOR_YOU = ["daily-mix-1", "daily-mix-2", "weekly-finds", "on-repeat", "deep-focus", "rainy-day-indie"];
const NEW_RELEASES = [...ALBUMS].sort((a, b) => b.released.localeCompare(a.released)).slice(0, 10);
const POPULAR_ARTISTS = [...ARTISTS].sort((a, b) => b.monthlyListeners - a.monthlyListeners);

export default function MusicHome() {
  return (
    <div className="flex flex-col gap-6 px-1.5 py-4 md:px-3.5">
      <div className="flex flex-col gap-3 px-1.5">
        <h1 className="text-[24px] font-bold">{greeting()}</h1>
        <RecentGrid items={RECENTLY_PLAYED} />
      </div>
      <Shelf title="Made for Robin" description="Mixes of what you play, and some you haven't heard yet." href="/demos/music/library">
        {MADE_FOR_YOU.map((id) => (
          <li key={id}>
            <PlaylistCard id={id} />
          </li>
        ))}
      </Shelf>
      <Shelf title="New releases" href="/demos/music/search">
        {NEW_RELEASES.map((a) => (
          <li key={a.id}>
            <AlbumCard id={a.id} byArtist />
          </li>
        ))}
      </Shelf>
      <Shelf title="Popular artists" href="/demos/music/search">
        {POPULAR_ARTISTS.map((a) => (
          <li key={a.id}>
            <ArtistCard id={a.id} />
          </li>
        ))}
      </Shelf>
      <Shelf title="Playlists from friends">
        {["dinner-party", "kitchen-disco"].map((id) => (
          <li key={id}>
            <PlaylistCard id={id} />
          </li>
        ))}
      </Shelf>
    </div>
  );
}
