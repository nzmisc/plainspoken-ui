import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { Textarea } from "@/registry/plainspoken/ui/textarea";

const meta = {
  title: "Components/Forms/Textarea",
  component: Textarea,
  args: { placeholder: "Write a reply…", "aria-label": "Reply" },
} satisfies Meta<typeof Textarea>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const WithCount: Story = {
  render: function Render() {
    const [v, setV] = useState("Shipped the registry today.");
    return (
      <div className="flex max-w-md flex-col">
        <Textarea aria-label="Status" value={v} onChange={(e) => setV(e.target.value)} maxLength={60} showCount />
      </div>
    );
  },
};

export const States: Story = {
  render: () => (
    <div className="flex max-w-md flex-col gap-2">
      <Textarea aria-label="Disabled" defaultValue="Disabled" disabled />
      <Textarea aria-label="Invalid" defaultValue="Invalid" invalid />
    </div>
  ),
};
