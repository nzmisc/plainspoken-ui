import { MusicProvider } from "@/registry/plainspoken/blocks/music/player-provider";
import { PopularTracks } from "@/registry/plainspoken/blocks/music/artist";

/** An artist's popular tracks with play counts; "See more" shows ten. */
export default function MusicArtistDemo() {
  return (
    <MusicProvider>
      <PopularTracks artistId="juniper-vale" />
    </MusicProvider>
  );
}
