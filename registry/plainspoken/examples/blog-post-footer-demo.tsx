import { BlogPostFooter } from "@/registry/plainspoken/blocks/blog/post-footer";

export default function BlogPostFooterDemo() {
  return (
    <BlogPostFooter
      title="Draining a Postgres primary without dropping writes"
      replyTo="ines@example.com"
      older={{ title: "How Buildings Learn, for people who build software", href: "/posts/how-buildings-learn" }}
      newer={{ title: "Four days on the Parenzana", href: "/posts/parenzana" }}
    />
  );
}
