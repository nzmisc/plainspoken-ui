import { BlogTags } from "@/registry/plainspoken/blocks/blog/tags";

/** On a tag's own page, that tag is filled. */
export default function BlogTagsDemo() {
  return (
    <BlogTags
      current="ops"
      tags={[
        { label: "ops", href: "/tags/ops", count: 3 },
        { label: "personal", href: "/tags/personal", count: 2 },
        { label: "tools", href: "/tags/tools", count: 2 },
        { label: "postgres", href: "/tags/postgres", count: 1 },
        { label: "travel", href: "/tags/travel", count: 1 },
        { label: "web", href: "/tags/web", count: 1 },
      ]}
    />
  );
}
