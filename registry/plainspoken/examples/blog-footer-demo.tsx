import { BlogFooter } from "@/registry/plainspoken/blocks/blog/footer";

export default function BlogFooterDemo() {
  return (
    <BlogFooter
      name="Ines Varga"
      tagline="Notes on databases, deploys, plain web pages and the occasional bike trip."
      links={[
        { label: "Writing", href: "/posts" },
        { label: "About", href: "/about" },
        { label: "RSS feed", href: "/feed.xml" },
        { label: "Email", href: "mailto:ines@example.com" },
      ]}
      smallPrint="© 2026 Ines Varga. Words under CC BY 4.0. No tracking, no cookies."
    />
  );
}
