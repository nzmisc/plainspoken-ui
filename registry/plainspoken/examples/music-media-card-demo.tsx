import { MusicProvider } from "@/registry/plainspoken/blocks/music/player-provider";
import { AlbumCard, ArtistCard, PlaylistCard, Shelf } from "@/registry/plainspoken/blocks/music/media-card";

/** A shelf that scrolls sideways, with album, playlist and artist cards; hover a card for its play button. */
export default function MusicMediaCardDemo() {
  return (
    <MusicProvider>
      <Shelf title="Jump back in" href="#">
        <li>
          <AlbumCard id="tidewater" byArtist />
        </li>
        <li>
          <PlaylistCard id="night-drive" />
        </li>
        <li>
          <ArtistCard id="sol-ramirez" />
        </li>
        <li>
          <AlbumCard id="neon-orchard" byArtist />
        </li>
        <li>
          <PlaylistCard id="dinner-party" />
        </li>
        <li>
          <AlbumCard id="estuary" byArtist />
        </li>
      </Shelf>
    </MusicProvider>
  );
}
