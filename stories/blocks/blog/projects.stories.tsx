import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { BlogProjects } from "@/registry/plainspoken/blocks/blog/projects";
import { PROJECTS } from "@/content/blog/site";

const meta: Meta<typeof BlogProjects> = {
  title: "Blocks/Blog/Projects",
  component: BlogProjects,
  decorators: [(S) => <div className="max-w-xs">{S()}</div>],
  args: { projects: PROJECTS },
};
export default meta;
type Story = StoryObj<typeof BlogProjects>;

/** Active, maintained and archived projects. */
export const Default: Story = {};
