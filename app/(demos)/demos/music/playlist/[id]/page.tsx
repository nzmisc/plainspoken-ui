import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { CollectionActions, CollectionHeader, PlaylistMeta } from "@/registry/plainspoken/blocks/music/collection-header";
import { LikedCover } from "@/registry/plainspoken/blocks/music/library";
import { PlaylistTracks } from "@/registry/plainspoken/blocks/music/track-table";
import { PLAYLISTS, YOU, hrefFor, playlistById } from "@/registry/plainspoken/blocks/music/data";

export function generateStaticParams() {
  return [{ id: "liked" }, ...PLAYLISTS.map((p) => ({ id: p.id }))];
}

export async function generateMetadata({ params }: PageProps<"/demos/music/playlist/[id]">): Promise<Metadata> {
  const { id } = await params;
  if (id === "liked") return { title: "Liked Songs", description: "The songs you liked, newest first." };
  const p = playlistById(id);
  if (!p) return {};
  return { title: p.title, description: `${p.description} A playlist by ${p.owner}.` };
}

export default function PlaylistPage({ params }: PageProps<"/demos/music/playlist/[id]">) {
  return (
    <Suspense fallback={<p className="p-4 text-muted-foreground">Loading playlist…</p>}>
      <Playlist params={params} />
    </Suspense>
  );
}

async function Playlist({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const liked = id === "liked";
  const p = liked ? null : playlistById(id);
  if (!liked && !p) notFound();
  const title = p?.title ?? "Liked Songs";
  const context = { kind: liked ? ("liked" as const) : ("playlist" as const), id, title, href: hrefFor.playlist(id) };
  return (
    <>
      <CollectionHeader
        kind={p && p.followers > 50 ? "Public playlist" : "Playlist"}
        title={title}
        seed={id}
        cover={
          liked ? (
            <span className="w-40 max-sm:mx-auto sm:w-44 lg:w-52">
              <LikedCover big />
            </span>
          ) : undefined
        }
        description={p?.description}
        meta={<PlaylistMeta playlistId={id} owner={p?.owner ?? YOU.name} followers={p?.followers} />}
      />
      <CollectionActions context={context} playlistId={id} save={p ? { kind: "playlists", id } : undefined} />
      <div className="pb-6">
        <PlaylistTracks playlistId={id} title={title} />
      </div>
    </>
  );
}
