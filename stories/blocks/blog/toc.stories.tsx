import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { BlogToc } from "@/registry/plainspoken/blocks/blog/toc";

const ITEMS = [
  { id: "the-setup", title: "The setup" },
  { id: "the-runbook", title: "The runbook" },
  { id: "the-gate", title: "The gate", level: 3 as const },
  { id: "what-the-application-saw", title: "What the application saw" },
  { id: "three-things", title: "The three things that almost broke it" },
  { id: "takeaways", title: "Takeaways" },
];

const meta: Meta<typeof BlogToc> = {
  title: "Blocks/Blog/Table of contents",
  component: BlogToc,
  decorators: [(S) => <div className="max-w-56">{S()}</div>],
  args: { items: ITEMS },
};
export default meta;
type Story = StoryObj<typeof BlogToc>;

/** The side-column list. On a post page the section being read is bold with a bar; see the Article story. */
export const List: Story = {};

/** The closed box for narrow screens. */
export const Collapsible: Story = { args: { variant: "collapsible" }, decorators: [(S) => <div className="max-w-md">{S()}</div>] };
