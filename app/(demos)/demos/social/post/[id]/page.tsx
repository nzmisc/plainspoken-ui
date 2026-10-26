import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PageHeader } from "@/registry/plainspoken/blocks/social/nav";
import { PostThread } from "@/registry/plainspoken/blocks/social/thread";
import { POSTS, SOCIAL_BASE, postById, userBy } from "@/registry/plainspoken/blocks/social/data";

export function generateStaticParams() {
  return POSTS.map((p) => ({ id: p.id }));
}

export async function generateMetadata({ params }: PageProps<"/demos/social/post/[id]">): Promise<Metadata> {
  const p = postById((await params).id);
  if (!p) return {};
  const who = userBy(p.author);
  return { title: `${who.name}: “${p.text.length > 60 ? `${p.text.slice(0, 59)}…` : p.text}”`, description: p.text };
}

export default function PostPage({ params }: PageProps<"/demos/social/post/[id]">) {
  return (
    <>
      <PageHeader title="Post" backHref={SOCIAL_BASE} />
      <Suspense fallback={<p className="p-4 text-muted-foreground">Loading post…</p>}>
        <Thread params={params} />
      </Suspense>
    </>
  );
}

async function Thread({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!postById(id)) notFound();
  return <PostThread id={id} />;
}
