import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { MusicProvider } from "@/registry/plainspoken/blocks/music/player-provider";
import { CollectionActions, CollectionHeader, PlaylistMeta } from "@/registry/plainspoken/blocks/music/collection-header";
import { artistById, hrefFor, initialsOf, monthlyListeners, playlistById } from "@/registry/plainspoken/blocks/music/data";

const meta: Meta<typeof CollectionHeader> = {
  title: "Blocks/Music/Collection header",
  component: CollectionHeader,
  parameters: { layout: "fullscreen" },
  decorators: [(S) => <MusicProvider>{S()}</MusicProvider>],
  args: { kind: "Album", title: "Glasshouse Summer", seed: "glasshouse-summer", meta: "Marigold Static · 2025 · 11 songs, 43 min 48 sec" },
};
export default meta;
type Story = StoryObj<typeof CollectionHeader>;

/** An album's header. */
export const Playground: Story = {};

/** A playlist with its description, and the action row (save, since it isn't yours). */
export const Playlist: Story = {
  render: () => {
    const p = playlistById("dinner-party")!;
    return (
      <>
        <CollectionHeader
          kind="Public playlist"
          title={p.title}
          seed={p.id}
          description={p.description}
          meta={<PlaylistMeta playlistId={p.id} owner={p.owner} followers={p.followers} />}
        />
        <CollectionActions
          context={{ kind: "playlist", id: p.id, title: p.title, href: hrefFor.playlist(p.id) }}
          playlistId={p.id}
          save={{ kind: "playlists", id: p.id }}
        />
      </>
    );
  },
};

/** An artist: verified, initials for a picture, and Follow. */
export const Artist: Story = {
  render: () => {
    const a = artistById("sol-ramirez");
    return (
      <>
        <CollectionHeader
          kind="Artist"
          verified
          title={a.name}
          seed={a.id}
          initials={initialsOf(a.name)}
          meta={<span className="text-muted-foreground">{monthlyListeners(a.monthlyListeners)}</span>}
        />
        <CollectionActions context={{ kind: "artist", id: a.id, title: a.name }} trackIds={[]} save={{ kind: "artists", id: a.id }} />
      </>
    );
  },
};

/** A title long enough to wrap. */
export const LongTitle: Story = { args: { title: "Tell Me Twice (Remixes): The Complete Night Bus Sessions, Volume Two", kind: "EP" } };

/** On a phone, stacked. */
export const Phone: Story = { globals: { viewport: { value: "iphoneSE", isRotated: false } } };
