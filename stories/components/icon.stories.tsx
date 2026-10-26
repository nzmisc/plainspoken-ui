import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Bell, Inbox, Star } from "@/registry/plainspoken/lib/icons";
import { Icon } from "@/registry/plainspoken/ui/icon";

const meta = {
  title: "Components/Foundations/Icon",
  component: Icon,
  args: { icon: Inbox, size: 24 },
  argTypes: { icon: { control: false } },
} satisfies Meta<typeof Icon>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Labelled: Story = {
  render: () => (
    <p className="text-[14px]">
      Decorative next to words: <Icon icon={Bell} /> 3 new. Meaningful alone, so labelled: <Icon icon={Star} label="Starred" />
    </p>
  ),
};
