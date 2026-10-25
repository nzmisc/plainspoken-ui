import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { MusicProvider } from "@/registry/plainspoken/blocks/music/player-provider";
import { AlbumCard, ArtistCard, CardGrid, MediaCard, PlaylistCard, RecentGrid, Shelf } from "@/registry/plainspoken/blocks/music/media-card";
import { ALBUMS, RECENTLY_PLAYED } from "@/registry/plainspoken/blocks/music/data";

const meta: Meta<typeof MediaCard> = {
  title: "Blocks/Music/Media cards and shelves",
  component: MediaCard,
  decorators: [(S) => <MusicProvider>{S()}</MusicProvider>],
  args: { href: "#", seed: "tidewater", title: "Tidewater", subtitle: "2026 · Album", className: "w-44" },
};
export default meta;
type Story = StoryObj<typeof MediaCard>;

/** One card; hover it (or Tab to it) for the play button. */
export const Playground: Story = {};

/** Album, playlist and artist cards in a shelf that scrolls sideways. */
export const ShelfOfCards: Story = {
  render: () => (
    <Shelf title="Made for you" description="Mixes of what you play." href="#">
      <li>
        <PlaylistCard id="daily-mix-1" />
      </li>
      <li>
        <PlaylistCard id="weekly-finds" />
      </li>
      <li>
        <AlbumCard id="tidewater" byArtist />
      </li>
      <li>
        <ArtistCard id="halvard" />
      </li>
      <li>
        <AlbumCard id="cumbia-del-satelite" byArtist />
      </li>
      <li>
        <PlaylistCard id="deep-focus" />
      </li>
      <li>
        <AlbumCard id="estuary" byArtist />
      </li>
      <li>
        <AlbumCard id="hedgerow" byArtist />
      </li>
    </Shelf>
  ),
};

/** A grid that fills the width. */
export const Grid: Story = {
  render: () => (
    <CardGrid>
      {ALBUMS.slice(0, 10).map((a) => (
        <li key={a.id}>
          <AlbumCard id={a.id} />
        </li>
      ))}
    </CardGrid>
  ),
};

/** "Jump back in" tiles. */
export const Recent: Story = { render: () => <RecentGrid items={RECENTLY_PLAYED} /> };

/** A long title is cut with an ellipsis; a long subtitle wraps to two lines. */
export const LongText: Story = {
  args: { title: "Tell Me Twice (Oskar Venn Remix) [Extended]", subtitle: "Juniper Vale, Oskar Venn, Sol Ramírez and Nadia Okafor" },
};
