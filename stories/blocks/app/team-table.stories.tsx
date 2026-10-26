import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { AppTeamTable } from "@/registry/plainspoken/blocks/app/team-table";

const meta: Meta<typeof AppTeamTable> = {
  title: "Blocks/App skeleton/Team table",
  // A dialog or drawer open on load would cover the whole docs page: there, each story gets its own frame
  parameters: { docs: { story: { inline: false, height: "640px" } } },
  component: AppTeamTable,
};
export default meta;
type Story = StoryObj<typeof AppTeamTable>;

/** The owner's role is fixed; others are selects; Rosa hasn't joined yet. */
export const Default: Story = {};

/** The invite dialog. */
export const Inviting: Story = { args: { defaultInviting: true }, decorators: [(S) => <div className="min-h-[560px]">{S()}</div>] };
