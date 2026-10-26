import { BlogPostList } from "@/registry/plainspoken/blocks/blog/post-list";

const tag = (t: string) => ({ label: t, href: `/tags/${t}` });

export default function BlogPostListDemo() {
  return (
    <BlogPostList
      posts={[
        {
          href: "/posts/parenzana",
          title: "Four days on the Parenzana",
          date: "2026-10-12",
          summary: "An old narrow-gauge railway from Trieste to Poreč, ridden by bike through three countries.",
          minutes: 6,
          tags: [tag("travel"), tag("cycling")],
        },
        {
          href: "/posts/drain-postgres-primary",
          title: "Draining a Postgres primary without dropping writes",
          date: "2026-09-28",
          summary: "A planned switchover that the application never noticed, and the three things that almost broke it.",
          minutes: 7,
          tags: [tag("postgres"), tag("ops")],
        },
      ]}
    />
  );
}
