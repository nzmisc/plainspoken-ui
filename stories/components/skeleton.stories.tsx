import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Skeleton } from "@/registry/plainspoken/ui/skeleton";

const meta = {
  title: "Components/Feedback/Skeleton",
  component: Skeleton,
  args: { lines: 3 },
  decorators: [(S) => <div className="max-w-md"><S /></div>],
} satisfies Meta<typeof Skeleton>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/** Blocks sized with classes, and text lines. The region has aria-busy; the shapes are hidden from screen readers. */
export const Shapes: Story = {
  render: () => (
    <section aria-busy="true" aria-label="Loading services" className="flex flex-col gap-3 border border-border p-3">
      <Skeleton className="h-5 w-40" />
      <Skeleton lines={3} />
      <div className="flex gap-3">
        <Skeleton className="size-16" />
        <Skeleton lines={2} className="flex-1" />
      </div>
    </section>
  ),
};

/** Lines follow the font size around them. */
export const TextSizes: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="text-[13px]">
        <Skeleton lines={2} />
      </div>
      <div className="text-[20px]">
        <Skeleton lines={2} />
      </div>
    </div>
  ),
};
