import { MusicProvider } from "@/registry/plainspoken/blocks/music/player-provider";
import { ArtistAbout, Discography } from "@/registry/plainspoken/blocks/music/artist";

/** The discography with its chips (one choice at a time), and the About box. */
export default function MusicArtistDiscography() {
  return (
    <MusicProvider>
      <div className="flex flex-col gap-6">
        <Discography artistId="marigold-static" />
        <ArtistAbout artistId="marigold-static" />
      </div>
    </MusicProvider>
  );
}
