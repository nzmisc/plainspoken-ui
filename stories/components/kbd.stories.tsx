import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Kbd } from "@/registry/plainspoken/ui/kbd";

const meta = {
  title: "Components/Typography/Kbd",
  component: Kbd,
  args: { keys: ["⌘", "K"] },
} satisfies Meta<typeof Kbd>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Keys: Story = {
  render: () => (
    <ul className="flex flex-col gap-1.5">
      <li>
        Search: <Kbd keys={["⌘", "K"]} />
      </li>
      <li>
        Copy: <Kbd keys={["Ctrl", "Shift", "C"]} />
      </li>
      <li>
        Close: <Kbd>Esc</Kbd>, move: <Kbd>↑</Kbd> <Kbd>↓</Kbd>
      </li>
    </ul>
  ),
};

/** Sizes itself from the text around it. */
export const InText: Story = {
  render: () => (
    <div className="flex flex-col gap-2">
      <p className="text-[12px]">
        Small print: press <Kbd>?</Kbd> for shortcuts.
      </p>
      <p>
        Body: press <Kbd keys={["Alt", "T"]} /> to reach notifications.
      </p>
      <h2 className="text-[22px] font-bold">
        Heading: <Kbd keys={["⌘", "Enter"]} /> sends
      </h2>
    </div>
  ),
};
