import { BlogColumns, BlogPageHeader, BlogSection } from "@/registry/plainspoken/blocks/blog/layout";

/**
 * A page inside the frame: the page header, a main column with titled sections, and a side column
 * that moves under it on narrow screens. BlogShell (not shown: it adds the page's <main>) puts the
 * site's header and footer around it.
 */
export default function BlogLayoutDemo() {
  return (
    <BlogColumns
      asideLabel="Elsewhere"
      aside={
        <BlogSection title="Elsewhere">
          <p>
            Email: <a href="mailto:ines@example.com" className="text-link underline">ines@example.com</a>
          </p>
        </BlogSection>
      }
    >
      <BlogPageHeader title="Writing">
        <p>
          Eleven posts since 2025, newest first. Also as an <a href="/feed.xml">RSS feed</a>.
        </p>
      </BlogPageHeader>
      <BlogSection title="Recent writing" more={{ label: "All 11 posts", href: "/posts" }}>
        <p>The newest five posts go here, in a BlogPostList.</p>
      </BlogSection>
    </BlogColumns>
  );
}
