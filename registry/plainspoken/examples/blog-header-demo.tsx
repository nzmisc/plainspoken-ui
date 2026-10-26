import { BlogHeader } from "@/registry/plainspoken/blocks/blog/header";

/** The current section is worked out from the path: a post marks Writing, and so does a tag page listed in `also`. */
export default function BlogHeaderDemo() {
  return (
    <BlogHeader
      name="Ines Varga"
      homeHref="/"
      currentHref="/posts/drain-postgres-primary"
      feedHref="/feed.xml"
      links={[
        { key: "home", label: "Home", href: "/" },
        { key: "writing", label: "Writing", href: "/posts", also: ["/tags"] },
        { key: "about", label: "About", href: "/about" },
      ]}
    />
  );
}
