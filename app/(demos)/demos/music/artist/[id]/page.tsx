import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ArtistAbout, Discography, PopularTracks } from "@/registry/plainspoken/blocks/music/artist";
import { CollectionActions, CollectionHeader } from "@/registry/plainspoken/blocks/music/collection-header";
import { ArtistCard, Shelf } from "@/registry/plainspoken/blocks/music/media-card";
import { ARTISTS, artistById, hrefFor, initialsOf, monthlyListeners, popularTracks } from "@/registry/plainspoken/blocks/music/data";

export function generateStaticParams() {
  return ARTISTS.map((a) => ({ id: a.id }));
}

export async function generateMetadata({ params }: PageProps<"/demos/music/artist/[id]">): Promise<Metadata> {
  const { id } = await params;
  const a = ARTISTS.find((x) => x.id === id);
  if (!a) return {};
  return { title: a.name, description: `${a.name}, from ${a.city}: popular tracks, albums, singles and more. ${monthlyListeners(a.monthlyListeners)}.` };
}

export default function ArtistPage({ params }: PageProps<"/demos/music/artist/[id]">) {
  return (
    <Suspense fallback={<p className="p-4 text-muted-foreground">Loading artist…</p>}>
      <Artist params={params} />
    </Suspense>
  );
}

async function Artist({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!ARTISTS.some((a) => a.id === id)) notFound();
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
        context={{ kind: "artist", id: a.id, title: a.name, href: hrefFor.artist(a.id) }}
        trackIds={popularTracks(a.id).map((t) => t.id)}
        save={{ kind: "artists", id: a.id }}
      />
      <div className="flex flex-col gap-6 pb-6">
        <PopularTracks artistId={a.id} />
        <Discography artistId={a.id} />
        <Shelf title="Fans also like" className="px-1.5 md:px-3.5">
          {a.related.map((r) => (
            <li key={r}>
              <ArtistCard id={r} />
            </li>
          ))}
        </Shelf>
        <ArtistAbout artistId={a.id} />
      </div>
    </>
  );
}
