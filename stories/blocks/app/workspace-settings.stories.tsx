import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { AppWorkspaceSettings } from "@/registry/plainspoken/blocks/app/workspace-settings";

const meta: Meta<typeof AppWorkspaceSettings> = {
  title: "Blocks/App skeleton/Workspace settings",
  component: AppWorkspaceSettings,
};
export default meta;
type Story = StoryObj<typeof AppWorkspaceSettings>;

/** The form, and the danger zone set apart in red. */
export const Default: Story = {};

/** Deleting: the confirmation wants the workspace's name typed before its button works. */
export const Deleting: Story = { args: { defaultDeleting: true }, decorators: [(S) => <div className="min-h-[640px]">{S()}</div>] };
