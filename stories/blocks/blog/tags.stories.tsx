import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { BlogTags } from "@/registry/plainspoken/blocks/blog/tags";
import { TAG_LINKS } from "@/content/blog/posts";

const meta: Meta<typeof BlogTags> = {
  title: "Blocks/Blog/Tag links",
  component: BlogTags,
  decorators: [(S) => <div className="max-w-xs">{S()}</div>],
  args: { tags: TAG_LINKS },
};
export default meta;
type Story = StoryObj<typeof BlogTags>;

export const Default: Story = {};

/** On a tag's page: that tag is filled and marked aria-current. */
export const Current: Story = { args: { current: "ops" } };

/** md, for a page of its own. */
export const Medium: Story = { args: { size: "md" } };
