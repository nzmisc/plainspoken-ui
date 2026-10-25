import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Button } from "@/registry/plainspoken/ui/button";
import { Separator } from "@/registry/plainspoken/ui/separator";

const meta = {
  title: "Components/Layout/Separator",
  component: Separator,
  args: { orientation: "horizontal" },
  argTypes: { orientation: { control: "inline-radio", options: ["horizontal", "vertical"] } },
  decorators: [(S) => <div className="max-w-sm"><S /></div>],
} satisfies Meta<typeof Separator>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Kinds: Story = {
  render: () => (
    <div className="flex flex-col gap-3">
      <p>Above the line</p>
      <Separator />
      <p>Below the line</p>
      <Separator label="or" />
      <Separator label="Older messages" />
      <div className="flex h-5 items-center gap-2">
        <span>CPU</span>
        <Separator orientation="vertical" />
        <span>Memory</span>
        <Separator orientation="vertical" />
        <span>Disk</span>
      </div>
    </div>
  ),
};

/** Vertical lines stretch to the row: in a toolbar they are as tall as its controls. */
export const InToolbar: Story = {
  render: () => (
    <div className="ctl-sm flex items-center gap-1 border border-border p-1">
      <Button variant="ghost">Reply</Button>
      <Button variant="ghost">Forward</Button>
      <Separator orientation="vertical" />
      <Button variant="ghost">Archive</Button>
    </div>
  ),
};
