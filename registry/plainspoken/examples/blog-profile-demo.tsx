import { Code, Mail, MapPin } from "@/registry/plainspoken/lib/icons";
import { BlogPortrait } from "@/registry/plainspoken/blocks/blog/portrait";
import { BlogProfile } from "@/registry/plainspoken/blocks/blog/profile";

export default function BlogProfileDemo() {
  return (
    <BlogProfile
      name="Ines Varga"
      role="Backend and infrastructure engineer · Ljubljana"
      portrait={<BlogPortrait name="Ines Varga" size={88} />}
      contacts={[
        { label: "Email", value: "ines@example.com", href: "mailto:ines@example.com", icon: Mail },
        { label: "Code", value: "code.example.org/ines", href: "https://code.example.org/ines", icon: Code },
        { label: "Based in", value: "Ljubljana, Slovenia", icon: MapPin },
      ]}
    >
      <p>
        I have spent nine years on the part of software that people only notice when it breaks: databases, queues, deploys,
        and the people on call for them.
      </p>
    </BlogProfile>
  );
}
