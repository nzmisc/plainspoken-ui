import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { Switch } from "@/registry/plainspoken/ui/switch";

const meta: Meta = { title: "Components/Forms/Switch" };
export default meta;

export const States: StoryObj = {
  render: function Render() {
    const [a, setA] = useState(true);
    const [b, setB] = useState(false);
    return (
      <div className="flex flex-col gap-3">
        <Switch checked={a} onChange={setA} label="Auto-refresh" />
        <Switch checked={b} onChange={setB} label="Beta features" description="Takes effect immediately." />
        <Switch checked={b} onChange={setB} label="Without the on/off words" showState={false} />
        <Switch checked onChange={() => {}} label="Disabled" disabled />
      </div>
    );
  },
};
