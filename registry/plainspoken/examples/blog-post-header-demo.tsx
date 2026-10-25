import { BlogPostHeader } from "@/registry/plainspoken/blocks/blog/post-header";

export default function BlogPostHeaderDemo() {
  return (
    <BlogPostHeader
      title="Draining a Postgres primary without dropping writes"
      summary="A planned switchover that the application never noticed, and the three things that almost broke it."
      date="2026-09-28"
      updated="2026-10-02"
      minutes={7}
      tags={[
        { label: "postgres", href: "/tags/postgres" },
        { label: "ops", href: "/tags/ops" },
      ]}
      crumbs={[{ label: "Home", href: "/" }, { label: "Writing", href: "/posts" }, { label: "Draining a Postgres primary" }]}
    />
  );
}
