import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useEffect, useState } from "react";
import { Meter, Progress } from "@/registry/plainspoken/ui/progress";

const meta = {
  title: "Components/Feedback/Progress",
  component: Progress,
  args: { label: "Uploading", value: 42, max: 100, showValue: true },
  decorators: [(S) => <div className="max-w-md"><S /></div>],
} satisfies Meta<typeof Progress>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/** Determinate (live), with custom text, and indeterminate: a sliding block, or a still hatched bar with reduced motion. */
export const Bars: Story = {
  render: function Render() {
    const [v, setV] = useState(0);
    useEffect(() => {
      const t = setInterval(() => setV((x) => (x >= 100 ? 0 : x + 4)), 200);
      return () => clearInterval(t);
    }, []);
    return (
      <div className="flex flex-col gap-2">
        <Progress label="Uploading" value={v} />
        <Progress label="Copying" value={3.2} max={8} showValue="3.2 of 8 GiB" />
        <Progress label="Waiting for the server" />
        <Progress label="Done" value={100} />
        <Progress label="No text" value={30} showValue={false} />
      </div>
    );
  },
};

/** A measurement in a range. Past a threshold it changes colour and gains a symbol; screen readers hear "84%, warning". */
export const Meters: Story = {
  render: () => (
    <dl className="grid grid-cols-[auto_1fr] items-center gap-x-3 gap-y-1.5">
      <dt>/</dt>
      <dd>
        <Meter label="/ used" value={8} warn={80} crit={90} valueText="8% · 266 GiB free" />
      </dd>
      <dt>/boot</dt>
      <dd>
        <Meter label="/boot used" value={84} warn={80} crit={90} />
      </dd>
      <dt>/boot/efi</dt>
      <dd>
        <Meter label="/boot/efi used" value={96} warn={80} crit={90} />
      </dd>
    </dl>
  ),
};
