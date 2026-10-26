import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { ChatModelPicker, type ChatModelPickerProps } from "@/registry/plainspoken/blocks/chat/model-picker";
import { Button } from "@/registry/plainspoken/ui/button";
import { Measure } from "../../support/measure";

function Picker(props: Partial<ChatModelPickerProps>) {
  const [value, setValue] = useState(props.value ?? "anthropic/claude-haiku-5.5");
  return <ChatModelPicker {...props} value={value} onChange={setValue} />;
}

const meta: Meta<typeof ChatModelPicker> = {
  title: "Blocks/AI chat/Model picker",
  component: ChatModelPicker,
  render: (args) => <Picker {...args} />,
};
export default meta;
type Story = StoryObj<typeof ChatModelPicker>;

/** The system picker: fast and cheap models, then the stronger one; the price is beside it (hidden on phones). */
export const Default: Story = {};

/** The stronger, dearer model picked. */
export const Stronger: Story = { args: { value: "anthropic/claude-sonnet-5.5" } };

/** On the height scale with buttons, at every size. */
export const Sizes: Story = {
  render: () => (
    <div className="flex flex-col gap-3">
      {(["sm", "md", "lg"] as const).map((s) => (
        <Measure key={s}>
          <div className="flex items-center gap-2">
            <Picker size={s} showPrice={false} />
            <Button size={s}>Send</Button>
          </div>
        </Measure>
      ))}
    </div>
  ),
};

/** Without the price. */
export const NoPrice: Story = { args: { showPrice: false } };

/** Disabled. */
export const Disabled: Story = { args: { disabled: true } };
