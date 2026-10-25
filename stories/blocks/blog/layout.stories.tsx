import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { BlogColumns, BlogPageHeader, BlogSection, BlogShell } from "@/registry/plainspoken/blocks/blog/layout";
import { BlogPostList } from "@/registry/plainspoken/blocks/blog/post-list";
import { BlogTags } from "@/registry/plainspoken/blocks/blog/tags";
import { POSTS, TAG_LINKS, listItem } from "@/content/blog/posts";

const meta: Meta<typeof BlogShell> = {
  title: "Blocks/Blog/Blog layout",
  component: BlogShell,
  parameters: { layout: "fullscreen" },
};
export default meta;
type Story = StoryObj<typeof BlogShell>;

const header = <div className="border-b border-border bg-muted px-4 py-2 font-bold">Ines Varga</div>;
const footer = <div className="border-t border-border bg-muted px-4 py-2 text-[13px] text-muted-foreground">© 2026 Ines Varga</div>;

/** A page header, a main column and a side column that moves under it below the lg breakpoint. Tab once to see the skip link. */
export const WithSideColumn: Story = {
  render: () => (
    <BlogShell header={header} footer={footer}>
      <BlogColumns asideLabel="Tags" aside={<BlogSection title="By tag"><BlogTags tags={TAG_LINKS} /></BlogSection>}>
        <BlogPageHeader title="Writing">
          <p>{POSTS.length} posts, newest first.</p>
        </BlogPageHeader>
        <BlogSection title="Recent writing" more={{ label: `All ${POSTS.length} posts`, href: "#" }}>
          <BlogPostList posts={POSTS.slice(0, 3).map(listItem)} />
        </BlogSection>
      </BlogColumns>
    </BlogShell>
  ),
};

/** One column, for pages without a side column. Short pages push the footer to the bottom. */
export const OneColumn: Story = {
  render: () => (
    <BlogShell header={header} footer={footer}>
      <BlogPageHeader title="Tags">
        <p>Every tag, with how many posts carry it.</p>
      </BlogPageHeader>
    </BlogShell>
  ),
};
