import { POSTS } from "@/content/blog/posts";
import { AUTHOR, href } from "@/content/blog/site";
import { JsonLd, PERSON_LD, absolute, pageMetadata } from "../_lib/meta";
import { WritingView } from "../_views";

export const metadata = pageMetadata({
  title: "Writing",
  description: `Every post by ${AUTHOR.name}, newest first: Postgres and SQLite in production, deploys, systemd, plain web design, books and travel.`,
  path: href.posts,
});

export default function WritingPage() {
  return (
    <>
      <JsonLd
        data={{
          "@type": "Blog",
          name: `${AUTHOR.name}: writing`,
          url: absolute(href.posts),
          author: PERSON_LD,
          blogPost: POSTS.map((p) => ({ "@type": "BlogPosting", headline: p.title, url: absolute(href.post(p.slug)), datePublished: p.date })),
        }}
      />
      <WritingView />
    </>
  );
}
