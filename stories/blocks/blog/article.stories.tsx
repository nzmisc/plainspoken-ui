import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { BlogArticle } from "@/registry/plainspoken/blocks/blog/article";
import { BlogPostHeader } from "@/registry/plainspoken/blocks/blog/post-header";
import { getPost, tagLinks } from "@/content/blog/posts";
import { PlainCode } from "./fixtures";

function Article({ slug, size }: { slug: string; size?: "base" | "lg" }) {
  const post = getPost(slug)!;
  const body = post.body({ Code: PlainCode });
  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <BlogArticle
        size={size}
        header={<BlogPostHeader title={post.title} summary={post.summary} date={post.date} minutes={post.minutes} tags={tagLinks(post.tags)} />}
        sections={body.sections}
        footnotes={body.footnotes}
      >
        {body.intro}
      </BlogArticle>
    </div>
  );
}

const meta: Meta<typeof Article> = {
  title: "Blocks/Blog/Article",
  component: Article,
  parameters: { layout: "fullscreen" },
  args: { slug: "drain-postgres-primary" },
};
export default meta;
type Story = StoryObj<typeof Article>;

/** Every piece: headings with # links, two code blocks, a figure, a table, a blockquote and two footnotes. Scroll: the contents column follows. */
export const Full: Story = {};

/** A post with an elevation profile drawn as SVG. */
export const WithFigure: Story = { args: { slug: "parenzana" } };

/** At the base size (14px) instead of lg. */
export const BaseSize: Story = { args: { size: "base" } };

/** On a phone the contents are a closed box above the text. */
export const Phone: Story = { globals: { viewport: { value: "iphoneSE", isRotated: false } } };
