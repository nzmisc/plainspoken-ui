import { Mail, Rss } from "@/registry/plainspoken/lib/icons";
import { BlogIntro } from "@/registry/plainspoken/blocks/blog/intro";
import { BlogPortrait } from "@/registry/plainspoken/blocks/blog/portrait";

export default function BlogIntroDemo() {
  return (
    <BlogIntro
      greeting="Hi, I’m Ines."
      portrait={<BlogPortrait name="Ines Varga" size={104} />}
      links={[
        { label: "Email", href: "mailto:ines@example.com", icon: Mail },
        { label: "RSS feed", href: "/feed.xml", icon: Rss },
      ]}
    >
      <p>
        I’m a backend and infrastructure engineer in Ljubljana. I keep databases and deploy pipelines boring for a living, and
        write here about the times they weren’t. More <a href="#about">about me</a>.
      </p>
    </BlogIntro>
  );
}
