import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { TAGS, postsTagged } from "@/content/blog/posts";
import { AUTHOR, href } from "@/content/blog/site";
import { pageMetadata } from "../../_lib/meta";
import { TagView } from "../../_views";

export function generateStaticParams() {
  return TAGS.map(({ tag }) => ({ tag }));
}

export async function generateMetadata({ params }: PageProps<"/demos/blog/tags/[tag]">): Promise<Metadata> {
  const { tag } = await params;
  const posts = postsTagged(tag);
  if (posts.length === 0) return {};
  return pageMetadata({
    title: `Posts tagged #${tag}`,
    description: `${posts.length} ${posts.length === 1 ? "post" : "posts"} by ${AUTHOR.name} tagged #${tag}: ${posts.map((p) => p.title).join("; ")}.`,
    path: href.tag(tag),
  });
}

export default function TagPage({ params }: PageProps<"/demos/blog/tags/[tag]">) {
  return (
    <Suspense fallback={<p className="text-muted-foreground">Loading…</p>}>
      <Tagged params={params} />
    </Suspense>
  );
}

async function Tagged({ params }: { params: Promise<{ tag: string }> }) {
  const { tag } = await params;
  const posts = postsTagged(tag);
  if (posts.length === 0) notFound();
  return <TagView tag={tag} />;
}
