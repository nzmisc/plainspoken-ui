import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { POSTS, getPost } from "@/content/blog/posts";
import { href } from "@/content/blog/site";
import { HighlightedCode } from "../../_lib/code";
import { JsonLd, PERSON_LD, absolute, pageMetadata } from "../../_lib/meta";
import { PostView } from "../../_views";

export function generateStaticParams() {
  return POSTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/demos/blog/posts/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return {};
  return pageMetadata({
    title: post.title,
    description: post.summary,
    path: href.post(slug),
    article: { published: post.date, updated: post.updated, tags: post.tags },
  });
}

// The post depends on the URL, so it renders inside Suspense; every slug is prerendered, so it is there at once.
export default function PostPage({ params }: PageProps<"/demos/blog/posts/[slug]">) {
  return (
    <Suspense fallback={<p className="text-muted-foreground">Loading the post…</p>}>
      <Post params={params} />
    </Suspense>
  );
}

async function Post({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();
  return (
    <>
      <JsonLd
        data={{
          "@type": "BlogPosting",
          headline: post.title,
          description: post.summary,
          datePublished: post.date,
          dateModified: post.updated ?? post.date,
          keywords: post.tags.join(", "),
          timeRequired: `PT${post.minutes}M`,
          url: absolute(href.post(slug)),
          mainEntityOfPage: absolute(href.post(slug)),
          author: PERSON_LD,
          inLanguage: "en-GB",
        }}
      />
      <PostView post={post} Code={HighlightedCode} />
    </>
  );
}
