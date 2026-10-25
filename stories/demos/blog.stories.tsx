import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { AboutView, BlogFrame, HomeView, PostView, TagView, WritingView } from "@/app/(demos)/demos/blog/_views";
import { getPost } from "@/content/blog/posts";
import { href } from "@/content/blog/site";
import { PlainCode } from "../blocks/blog/fixtures";

type Page = "home" | "writing" | "post" | "tag" | "about";

/** The blog demo's pages, framed as at /demos/blog. Code blocks are plain here: the site highlights them on the server. */
function BlogDemo({ page, slug = "drain-postgres-primary", tag = "ops" }: { page: Page; slug?: string; tag?: string }) {
  const current = { home: href.home, writing: href.posts, post: href.post(slug), tag: href.tag(tag), about: href.about }[page];
  return (
    <BlogFrame currentHref={current}>
      {page === "home" && <HomeView />}
      {page === "writing" && <WritingView />}
      {page === "post" && <PostView post={getPost(slug)!} Code={PlainCode} />}
      {page === "tag" && <TagView tag={tag} />}
      {page === "about" && <AboutView />}
    </BlogFrame>
  );
}

const meta: Meta<typeof BlogDemo> = {
  title: "Demos/Blog",
  component: BlogDemo,
  parameters: { layout: "fullscreen" },
  args: { page: "home" },
  argTypes: { page: { control: "inline-radio", options: ["home", "writing", "post", "tag", "about"] } },
};
export default meta;
type Story = StoryObj<typeof BlogDemo>;

/** Ines Varga's home page: intro, recent writing, the Now box and projects. */
export const Home: Story = {};

/** The archive, grouped by year, with tags beside it. */
export const Writing: Story = { args: { page: "writing" } };

/** A post with every piece: table of contents, code, a figure, a table, footnotes, reply by email, older and newer. */
export const Post: Story = { args: { page: "post" } };

/** The trip report, with an elevation profile. */
export const TripReport: Story = { args: { page: "post", slug: "parenzana" } };

export const Tag: Story = { args: { page: "tag", tag: "ops" } };

export const About: Story = { args: { page: "about" } };

export const PhonePost: Story = { args: { page: "post" }, globals: { viewport: { value: "iphoneSE", isRotated: false } } };
