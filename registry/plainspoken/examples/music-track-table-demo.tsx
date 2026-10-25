import { MusicProvider } from "@/registry/plainspoken/blocks/music/player-provider";
import { TrackTable } from "@/registry/plainspoken/blocks/music/track-table";
import { albumById, hrefFor } from "@/registry/plainspoken/blocks/music/data";

/**
 * An album's tracks. Hover a row for its play button, double-click it or press Enter to play from
 * there; ↑/↓ move between rows. Right-click a row, or use its ⋯, for the track menu.
 */
export default function MusicTrackTableDemo() {
  const a = albumById("we-were-the-weather")!;
  return (
    <MusicProvider>
      <TrackTable
        entries={a.trackIds.map((trackId) => ({ trackId }))}
        context={{ kind: "album", id: a.id, title: a.title, href: hrefFor.album(a.id) }}
        columns={{ artists: false }}
        label={`${a.title}, ${a.trackIds.length} songs`}
      />
    </MusicProvider>
  );
}
