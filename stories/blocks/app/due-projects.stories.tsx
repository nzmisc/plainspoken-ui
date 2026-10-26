import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { AppDueProjects } from "@/registry/plainspoken/blocks/app/due-projects";

const meta: Meta<typeof AppDueProjects> = {
  title: "Blocks/App skeleton/Due next",
  component: AppDueProjects,
  decorators: [(S) => <div className="max-w-sm">{S()}</div>],
};
export default meta;
type Story = StoryObj<typeof AppDueProjects>;

/** The five open projects due soonest; within two weeks is amber. */
export const Default: Story = {};

/** Only three. */
export const Three: Story = { args: { limit: 3 } };
