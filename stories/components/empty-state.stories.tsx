import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { FolderOpen, Inbox, Plus, Search } from "@/registry/plainspoken/lib/icons";
import { Button } from "@/registry/plainspoken/ui/button";
import { EmptyState } from "@/registry/plainspoken/ui/empty-state";
import { Panel } from "@/registry/plainspoken/ui/panel";

const meta = {
  title: "Components/Feedback/Empty state",
  component: EmptyState,
  args: {
    icon: Inbox,
    title: "No messages",
    description: "Mail you receive at hello@example.com shows up here.",
    bordered: false,
    compact: false,
  },
  argTypes: { icon: { control: false }, actions: { control: false } },
  decorators: [(S) => <div className="max-w-xl"><S /></div>],
} satisfies Meta<typeof EmptyState>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const WithActions: Story = {
  args: {
    bordered: true,
    actions: (
      <>
        <Button variant="primary" icon={Plus}>
          New message
        </Button>
        <Button>Import mail</Button>
      </>
    ),
  },
};

/** compact inside a panel. */
export const InPanel: Story = {
  render: () => (
    <Panel title="Files" meta="/projects/2026">
      <EmptyState compact icon={FolderOpen} title="This folder is empty" description="Drop files here, or upload them." actions={<Button size="sm">Upload</Button>} />
    </Panel>
  ),
};

export const NoIcon: Story = {
  args: { icon: undefined, title: "Nothing matches “hofman”", description: "Check the spelling, or search by email address." },
};

export const LongText: Story = {
  args: {
    icon: Search,
    title: "Nothing matches “quarterly report for the north-east region, final, v3”",
    description:
      "Search looks at titles, file names and the first page of each document. Try fewer words, or check the filters on the left, which may be hiding results.",
  },
};
