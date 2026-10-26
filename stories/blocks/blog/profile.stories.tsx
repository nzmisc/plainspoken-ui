import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Code, Mail, MapPin, Rss } from "@/registry/plainspoken/lib/icons";
import { BlogPortrait } from "@/registry/plainspoken/blocks/blog/portrait";
import { BlogProfile } from "@/registry/plainspoken/blocks/blog/profile";

const meta: Meta<typeof BlogProfile> = {
  title: "Blocks/Blog/Profile",
  component: BlogProfile,
  decorators: [(S) => <div className="max-w-3xl">{S()}</div>],
  args: {
    name: "Ines Varga",
    role: "Backend and infrastructure engineer · Ljubljana, Slovenia",
    portrait: <BlogPortrait name="Ines Varga" size={96} />,
    contacts: [
      { label: "Email", value: "ines@example.com", href: "mailto:ines@example.com", icon: Mail },
      { label: "Code", value: "code.example.org/ines", href: "https://code.example.org/ines", icon: Code },
      { label: "Feed", value: "RSS: titles, summaries and tags", href: "/feed.xml", icon: Rss },
      { label: "Based in", value: "Ljubljana, Slovenia", icon: MapPin },
    ],
    children: (
      <>
        <p>I have spent nine years on the part of software that people only notice when it breaks.</p>
        <p>I like small tools, written-down runbooks and postmortems that change something.</p>
      </>
    ),
  },
};
export default meta;
type Story = StoryObj<typeof BlogProfile>;

export const Default: Story = {};

/** The drawn portrait at a few sizes. It follows light and dark mode by itself. */
export const Portraits: Story = {
  render: () => (
    <div className="flex items-end gap-3">
      <BlogPortrait name="Ines Varga" size={48} />
      <BlogPortrait name="Ines Varga" size={96} />
      <BlogPortrait name="Ines Varga" size={160} />
    </div>
  ),
};
