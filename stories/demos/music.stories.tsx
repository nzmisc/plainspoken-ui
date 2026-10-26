import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { MusicApp } from "@/registry/plainspoken/blocks/music/app-shell";
import { ArtistAbout, Discography, PopularTracks } from "@/registry/plainspoken/blocks/music/artist";
import { CollectionActions, CollectionHeader, PlaylistMeta } from "@/registry/plainspoken/blocks/music/collection-header";
import { AlbumCard, ArtistCard, PlaylistCard, RecentGrid, Shelf } from "@/registry/plainspoken/blocks/music/media-card";
import { PlaylistTracks } from "@/registry/plainspoken/blocks/music/track-table";
import {
  ALBUMS,
  ARTISTS,
  RECENTLY_PLAYED,
  artistById,
  demoPlayback,
  greeting,
  hrefFor,
  initialsOf,
  monthlyListeners,
  playlistById,
  popularTracks,
} from "@/registry/plainspoken/blocks/music/data";

function Home() {
  return (
    <div className="flex flex-col gap-6 px-1.5 py-4 md:px-3.5">
      <div className="flex flex-col gap-3 px-1.5">
        <h1 className="text-[24px] font-bold">{greeting()}</h1>
        <RecentGrid items={RECENTLY_PLAYED} />
      </div>
      <Shelf title="Made for Robin" href="#">
        {["daily-mix-1", "daily-mix-2", "weekly-finds", "on-repeat", "deep-focus", "rainy-day-indie"].map((id) => (
          <li key={id}>
            <PlaylistCard id={id} />
          </li>
        ))}
      </Shelf>
      <Shelf title="New releases" href="#">
        {[...ALBUMS]
          .sort((a, b) => b.released.localeCompare(a.released))
          .slice(0, 10)
          .map((a) => (
            <li key={a.id}>
              <AlbumCard id={a.id} byArtist />
            </li>
          ))}
      </Shelf>
      <Shelf title="Popular artists">
        {ARTISTS.map((a) => (
          <li key={a.id}>
            <ArtistCard id={a.id} />
          </li>
        ))}
      </Shelf>
    </div>
  );
}

function Playlist({ id }: { id: string }) {
  const p = playlistById(id)!;
  return (
    <>
      <CollectionHeader
        kind="Playlist"
        title={p.title}
        seed={p.id}
        description={p.description}
        meta={<PlaylistMeta playlistId={p.id} owner={p.owner} followers={p.followers} />}
      />
      <CollectionActions context={{ kind: "playlist", id, title: p.title, href: hrefFor.playlist(id) }} playlistId={id} />
      <PlaylistTracks playlistId={id} title={p.title} />
    </>
  );
}

function Artist({ id }: { id: string }) {
  const a = artistById(id);
  return (
    <>
      <CollectionHeader
        kind="Artist"
        verified={a.verified}
        title={a.name}
        seed={a.id}
        initials={initialsOf(a.name)}
        meta={<span className="text-muted-foreground">{monthlyListeners(a.monthlyListeners)}</span>}
      />
      <CollectionActions
        context={{ kind: "artist", id, title: a.name, href: hrefFor.artist(id) }}
        trackIds={popularTracks(id).map((t) => t.id)}
        save={{ kind: "artists", id }}
      />
      <div className="flex flex-col gap-6 pb-6">
        <PopularTracks artistId={id} />
        <Discography artistId={id} />
        <ArtistAbout artistId={id} />
      </div>
    </>
  );
}

/** Turntable, the music demo at /demos/music: everything is clickable, and playback is simulated (no sound). */
const meta: Meta<typeof MusicApp> = {
  title: "Demos/Music",
  component: MusicApp,
  parameters: { layout: "fullscreen", nextjs: { navigation: { pathname: "/demos/music" } } },
  args: { initial: demoPlayback("night-drive"), className: "h-dvh" },
};
export default meta;
type Story = StoryObj<typeof MusicApp>;

/** Home: recently played, mixes, new releases, artists. */
export const HomeScreen: Story = { name: "Home", args: { children: <Home /> } };

/** A playlist, playing. */
export const PlaylistScreen: Story = {
  name: "Playlist",
  parameters: { nextjs: { navigation: { pathname: "/demos/music/playlist/night-drive" } } },
  args: { initial: demoPlayback("night-drive", { playing: true }), children: <Playlist id="night-drive" /> },
};

/** An artist. */
export const ArtistScreen: Story = { name: "Artist", args: { children: <Artist id="nadia-okafor" /> } };

/** Home on a phone: tab bar and mini player. */
export const Phone: Story = { args: { children: <Home /> }, globals: { viewport: { value: "iphoneSE", isRotated: false } } };
