import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Code, Mail, Rss } from "@/registry/plainspoken/lib/icons";
import { BlogIntro } from "@/registry/plainspoken/blocks/blog/intro";
import { BlogPortrait } from "@/registry/plainspoken/blocks/blog/portrait";

const meta: Meta<typeof BlogIntro> = {
  title: "Blocks/Blog/Blog intro",
  component: BlogIntro,
  decorators: [(S) => <div className="max-w-3xl">{S()}</div>],
  args: {
    greeting: "Hi, I’m Ines.",
    portrait: <BlogPortrait name="Ines Varga" size={112} />,
    links: [
      { label: "Email", href: "mailto:ines@example.com", icon: Mail },
      { label: "RSS feed", href: "/feed.xml", icon: Rss },
      { label: "Code", href: "https://code.example.org/ines", icon: Code },
    ],
    children: (
      <>
        <p>
          I’m a backend and infrastructure engineer in Ljubljana. I keep databases, deploy pipelines and on-call rotations boring
          for a living, and write here about the times they weren’t.
        </p>
        <p>
          More <a href="#about">about me</a>, or start with <a href="#post">draining a Postgres primary</a>.
        </p>
      </>
    ),
  },
};
export default meta;
type Story = StoryObj<typeof BlogIntro>;

export const Default: Story = {};

/** Without a portrait or links: just the greeting and the text. */
export const TextOnly: Story = { args: { portrait: undefined, links: undefined } };
