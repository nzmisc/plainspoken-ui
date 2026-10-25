import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { CollectionActions, CollectionHeader } from "@/registry/plainspoken/blocks/music/collection-header";
import { AlbumCard, Shelf } from "@/registry/plainspoken/blocks/music/media-card";
import { TrackTable } from "@/registry/plainspoken/blocks/music/track-table";
import { ALBUMS, albumById, albumTracks, artistById, hrefFor, longDate, plural, releasesBy, totalLength, year } from "@/registry/plainspoken/blocks/music/data";

export function generateStaticParams() {
  return ALBUMS.map((a) => ({ id: a.id }));
}

export async function generateMetadata({ params }: PageProps<"/demos/music/album/[id]">): Promise<Metadata> {
  const a = albumById((await params).id);
  if (!a) return {};
  const by = artistById(a.artistId).name;
  return { title: `${a.title} by ${by}`, description: `${a.kind} by ${by}, ${year(a)}: ${plural(a.trackIds.length, "song")}.` };
}

export default function AlbumPage({ params }: PageProps<"/demos/music/album/[id]">) {
  return (
    <Suspense fallback={<p className="p-4 text-muted-foreground">Loading album…</p>}>
      <Album params={params} />
    </Suspense>
  );
}

async function Album({ params }: { params: Promise<{ id: string }> }) {
  const a = albumById((await params).id);
  if (!a) notFound();
  const artist = artistById(a.artistId);
  const tracks = albumTracks(a);
  const length = tracks.reduce((s, t) => s + t.duration, 0);
  const href = hrefFor.album(a.id);
  const more = releasesBy(a.artistId).filter((r) => r.id !== a.id);
  return (
    <>
      <CollectionHeader
        kind={a.kind}
        title={a.title}
        seed={a.id}
        meta={
          <>
            <Link href={hrefFor.artist(artist.id)} className="font-bold text-foreground no-underline visited:text-foreground hover:underline">
              {artist.name}
            </Link>
            <span className="text-muted-foreground">
              · {year(a)} · {plural(tracks.length, "song")}, {totalLength(length)}
            </span>
          </>
        }
      />
      <CollectionActions
        context={{ kind: "album", id: a.id, title: a.title, href }}
        trackIds={a.trackIds}
        save={{ kind: "albums", id: a.id }}
        artistId={artist.id}
      />
      <TrackTable
        entries={tracks.map((t) => ({ trackId: t.id }))}
        context={{ kind: "album", id: a.id, title: a.title, href }}
        columns={{ artists: tracks.some((t) => t.artistIds.length > 1) }}
        label={`${a.title}, ${tracks.length} songs`}
        className="md:px-2"
      />
      <footer className="px-3 py-4 text-[13px] text-muted-foreground md:px-5">
        <p>{longDate(a.released)}</p>
        <p>
          ℗ {year(a)} {a.label}
        </p>
      </footer>
      {more.length > 0 && (
        <Shelf title={`More by ${artist.name}`} href={hrefFor.artist(artist.id)} className="px-1.5 pb-6 md:px-3.5">
          {more.map((r) => (
            <li key={r.id}>
              <AlbumCard id={r.id} />
            </li>
          ))}
        </Shelf>
      )}
    </>
  );
}
