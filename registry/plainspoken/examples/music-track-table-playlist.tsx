import { MusicProvider } from "@/registry/plainspoken/blocks/music/player-provider";
import { PlaylistTracks } from "@/registry/plainspoken/blocks/music/track-table";
import { demoPlayback } from "@/registry/plainspoken/blocks/music/data";

/** A playlist: covers, albums and dates added, with a box to find a song and a sort order. The playing track is bold, with a sound-wave mark. */
export default function MusicTrackTablePlaylist() {
  return (
    <MusicProvider initial={demoPlayback("run-club-170", { track: 2, playing: true })}>
      <div className="max-h-[420px] overflow-y-auto border border-border py-2">
        <PlaylistTracks playlistId="run-club-170" title="Run Club 170" />
      </div>
    </MusicProvider>
  );
}
