import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Button } from "@/registry/plainspoken/ui/button";
import { Spinner } from "@/registry/plainspoken/ui/spinner";

const meta = {
  title: "Components/Feedback/Spinner",
  component: Spinner,
  args: { label: "Loading" },
} satisfies Meta<typeof Spinner>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/** Alone, with words, inside text of several sizes, and the same mark in a loading Button. It stands still with reduced motion. */
export const Uses: Story = {
  render: () => (
    <div className="flex flex-col items-start gap-3">
      <Spinner />
      <Spinner>Checking for updates…</Spinner>
      <p className="text-[12px] text-muted-foreground">
        Refreshing <Spinner label="Refreshing" />
      </p>
      <p className="text-[22px] font-bold">
        Importing <Spinner label="Importing" />
      </p>
      <Spinner size={32} label="Loading the map" />
      <Button loading>Saving</Button>
    </div>
  ),
};
