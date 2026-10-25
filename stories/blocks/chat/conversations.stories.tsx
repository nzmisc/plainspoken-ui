import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { CHAT_CONVERSATIONS, CHAT_TODAY } from "@/registry/plainspoken/blocks/chat/data";
import { ChatDeleteDialog, ChatRenameDialog, chatSections } from "@/registry/plainspoken/blocks/chat/conversations";
import { CHAT_SHOWCASE } from "@/registry/plainspoken/blocks/chat/showcase";
import { SidebarList } from "@/registry/plainspoken/ui/sidebar";

const all = [CHAT_SHOWCASE, ...CHAT_CONVERSATIONS];

function List({ empty = false }: { empty?: boolean }) {
  return (
    <nav aria-label="Conversations" className="w-60 border border-border">
      <SidebarList sections={chatSections(empty ? [] : all, CHAT_TODAY, CHAT_TODAY)} current="launch" onNavigate={() => {}} />
    </nav>
  );
}

const meta: Meta<typeof List> = {
  title: "Blocks/AI chat/Conversations",
  component: List,
};
export default meta;
type Story = StoryObj<typeof List>;

/** Fifteen conversations under Today, Yesterday, Previous 7 days and Older, newest first, the open one marked. */
export const Sidebar: Story = {};

/** None yet: a muted line, so the sidebar keeps its shape. */
export const Empty: Story = { args: { empty: true } };

/** Renaming: the title in a box, selected; Enter saves, Escape cancels. */
export const Rename: Story = {
  parameters: { docs: { story: { inline: false, height: "640px" } } },
  render: () => <ChatRenameDialog open title="Launch plan for Tidewater" onClose={() => {}} onRename={() => {}} />,
};

/** Deleting asks first; focus starts on Cancel. */
export const Delete: Story = {
  parameters: { docs: { story: { inline: false, height: "640px" } } },
  render: () => <ChatDeleteDialog open title="Launch plan for Tidewater" onClose={() => {}} onDelete={() => {}} />,
};
