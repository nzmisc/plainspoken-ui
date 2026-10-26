import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { CONTROL_HEIGHT, CONTROL_SIZES } from "@/registry/plainspoken/lib/controls";
import { Play, Volume2 } from "@/registry/plainspoken/lib/icons";
import { IconButton } from "@/registry/plainspoken/ui/button";
import { Slider } from "@/registry/plainspoken/ui/slider";
import { Measure } from "../support/measure";

const time = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

const meta = {
  title: "Components/Forms/Slider",
  component: Slider,
  args: { label: "Warn when storage is over", defaultValue: 80, min: 50, max: 95, step: 5, format: (v: number) => `${v}%` },
  argTypes: {
    size: { control: "select", options: [undefined, "xs", "sm", "md", "lg"] },
    format: { control: false },
    label: { control: "text" },
  },
  decorators: [(S) => <div className="max-w-sm"><S /></div>],
} satisfies Meta<typeof Slider>;
export default meta;
type Story = StoryObj<typeof meta>;

/**
 * The browser's keys: ←/→ and ↑/↓ step, Page Up/Down jump, Home/End go to the ends. Screen
 * readers hear the formatted value ("80%").
 */
export const Playground: Story = {};

export const Labelled: Story = {
  render: function Render() {
    const [a, setA] = useState(80);
    const [b, setB] = useState(24);
    return (
      <div className="flex flex-col gap-4">
        <Slider label="Warn when disk is over" value={a} onChange={setA} format={(v) => `${v}%`} />
        <Slider
          label="Chart window"
          value={b}
          onChange={setB}
          min={1}
          max={168}
          marks={[1, 24, 72, 168]}
          format={(v) => (v >= 24 && v % 24 === 0 ? `${v / 24} d` : `${v} h`)}
        />
        <Slider label="Disabled" defaultValue={40} disabled />
      </div>
    );
  },
};

/** No label: give it an aria-label. showValue prints the value after the track. onCommit fires once on release. */
export const Bare: Story = {
  render: function Render() {
    const [v, setV] = useState(83);
    const [committed, setCommitted] = useState(83);
    return (
      <div className="flex flex-col gap-2">
        <Slider aria-label="Seek" value={v} onChange={setV} onCommit={setCommitted} max={296} format={(s) => `${time(s)} of 4:56`} />
        <Slider aria-label="Volume" defaultValue={70} showValue format={(s) => `${s}%`} />
        <p className="text-[12px] text-muted-foreground">Last committed: {time(committed)}</p>
      </div>
    );
  },
};

/** The track's box is a control's height, so it lines up with buttons beside it. */
export const Sizes: Story = {
  render: () => (
    <Measure>
      <div className="flex flex-col gap-3">
        {CONTROL_SIZES.map((s) => (
          <div key={s} className="flex items-center gap-2">
            <span className="w-14 font-mono text-[12px] text-muted-foreground">
              {s} {CONTROL_HEIGHT[s]}px
            </span>
            <IconButton size={s} variant="ghost" icon={Play} label="Play" />
            <Slider size={s} aria-label={`Seek (${s})`} defaultValue={40} className="flex-1" />
            <IconButton size={s} variant="ghost" icon={Volume2} label="Volume" />
          </div>
        ))}
      </div>
    </Measure>
  ),
};
