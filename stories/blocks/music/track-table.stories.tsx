import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { MusicProvider } from "@/registry/plainspoken/blocks/music/player-provider";
import { PlaylistTracks, TrackTable } from "@/registry/plainspoken/blocks/music/track-table";
import { albumById, demoPlayback, hrefFor, popularTracks } from "@/registry/plainspoken/blocks/music/data";

const album = albumById("neon-orchard")!;

/**
 * Keyboard: Tab into the list (one stop), ↑/↓/Home/End between rows, Enter plays the row, Tab on
 * to the row's play, like and ⋯ buttons. Double-click a row to play it; right-click for its menu.
 */
const meta: Meta<typeof TrackTable> = {
  title: "Blocks/Music/Track table",
  component: TrackTable,
  decorators: [(S) => <MusicProvider initial={demoPlayback("night-drive", { playing: true })}>{S()}</MusicProvider>],
  args: {
    entries: album.trackIds.map((trackId) => ({ trackId })),
    context: { kind: "album", id: album.id, title: album.title, href: hrefFor.album(album.id) },
    label: album.title,
    columns: { artists: true },
  },
};
export default meta;
type Story = StoryObj<typeof TrackTable>;

/** An album: no covers or album column. */
export const Album: Story = {};

/** A playlist, with the playing track marked, a find box and a sort order. */
export const Playlist: Story = { render: () => <PlaylistTracks playlistId="night-drive" title="Night Drive" /> };

/** An artist's popular tracks with play counts. */
export const Popular: Story = {
  args: {
    entries: popularTracks("nadia-okafor", 5).map((t) => ({ trackId: t.id })),
    context: { kind: "artist", id: "nadia-okafor", title: "Nadia Okafor" },
    columns: { artwork: true, plays: true, artists: false },
    label: "Popular",
  },
};

/** An empty playlist (Liked Songs with nothing liked looks like this too). */
export const NoMatches: Story = {
  render: () => <PlaylistTracks playlistId="night-drive" title="Night Drive" />,
  play: async ({ canvasElement }) => {
    const input = canvasElement.querySelector<HTMLInputElement>("input[type=search]");
    if (input) {
      const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!;
      set.call(input, "zzz");
      input.dispatchEvent(new Event("input", { bubbles: true }));
    }
  },
};

/** On a phone: title and length only. */
export const Phone: Story = { globals: { viewport: { value: "iphoneSE", isRotated: false } } };
