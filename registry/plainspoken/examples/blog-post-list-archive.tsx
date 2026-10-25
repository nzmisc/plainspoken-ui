import { BlogArchive } from "@/registry/plainspoken/blocks/blog/post-list";

/** BlogArchive groups posts under a heading per year, newest first, and drops the year from the dates. */
export default function BlogPostListArchive() {
  return (
    <BlogArchive
      summaries={false}
      posts={[
        { href: "/posts/parenzana", title: "Four days on the Parenzana", date: "2026-10-12", minutes: 6 },
        { href: "/posts/systemd-user-units", title: "systemd user units are underrated", date: "2026-08-14", minutes: 5 },
        { href: "/posts/year-2025", title: "2025 in review", date: "2025-12-30", minutes: 4 },
        { href: "/posts/flame-graphs", title: "Reading flame graphs without lying to yourself", date: "2025-11-07", minutes: 6 },
      ]}
    />
  );
}
