import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { CONTROL_HEIGHT, CONTROL_SIZES } from "@/registry/plainspoken/lib/controls";
import { Bold, Heart, Italic, Repeat, Repeat1, Shuffle, TextAlignCenter, TextAlignEnd, TextAlignStart, Underline } from "@/registry/plainspoken/lib/icons";
import { Button } from "@/registry/plainspoken/ui/button";
import { Toggle, ToggleGroup, type ToggleVariant } from "@/registry/plainspoken/ui/toggle";
import { Measure } from "../support/measure";

const meta = {
  title: "Components/Controls/Toggle",
  component: Toggle,
  args: { children: "Starred", variant: "default", defaultPressed: false, disabled: false },
  argTypes: {
    variant: { control: "inline-radio", options: ["default", "outline", "ghost"] },
    size: { control: "select", options: [undefined, "xs", "sm", "md", "lg"] },
    icon: { control: false },
    iconPressed: { control: false },
  },
} satisfies Meta<typeof Toggle>;
export default meta;
type Story = StoryObj<typeof meta>;

const VARIANTS: ToggleVariant[] = ["default", "outline", "ghost"];

/** Space or Enter toggles it; screen readers hear "toggle button, pressed / not pressed". */
export const Playground: Story = {};

/** Each variant unpressed and pressed. Pressed changes more than the shade: default and outline fill; ghost gains a border. */
export const Variants: Story = {
  render: () => (
    <Measure>
      <div className="flex flex-col gap-2">
        {VARIANTS.map((v) => (
          <div key={v} className="flex items-center gap-2">
            <span className="w-16 font-mono text-[12px] text-muted-foreground">{v}</span>
            <Toggle variant={v}>Off</Toggle>
            <Toggle variant={v} defaultPressed>
              On
            </Toggle>
            <Toggle variant={v} icon={Bold} label="Bold" />
            <Toggle variant={v} icon={Bold} label="Bold" defaultPressed />
            <Toggle variant={v} disabled>
              Disabled
            </Toggle>
            <Button variant={v}>Button</Button>
          </div>
        ))}
      </div>
    </Measure>
  ),
};

export const Sizes: Story = {
  render: () => (
    <Measure>
      <div className="flex flex-col gap-2">
        {CONTROL_SIZES.map((s) => (
          <div key={s} className="flex items-center gap-2">
            <span className="w-14 font-mono text-[12px] text-muted-foreground">
              {s} {CONTROL_HEIGHT[s]}px
            </span>
            <Toggle size={s} icon={Heart} defaultPressed>
              Liked
            </Toggle>
            <Toggle size={s} icon={Shuffle} label="Shuffle" />
            <Button size={s}>Button</Button>
          </div>
        ))}
      </div>
    </Measure>
  ),
};

/** Groups: multiple (styles), single (alignment). ←/→, Home and End move focus inside a group. */
export const Groups: Story = {
  render: function Render() {
    const [styles, setStyles] = useState<string[]>(["bold"]);
    const [align, setAlign] = useState<string | null>("start");
    return (
      <Measure>
        <div className="flex flex-col items-start gap-3">
          <ToggleGroup type="multiple" label="Text style" value={styles} onValueChange={setStyles}>
            <Toggle value="bold" icon={Bold} label="Bold" />
            <Toggle value="italic" icon={Italic} label="Italic" />
            <Toggle value="underline" icon={Underline} label="Underline" />
          </ToggleGroup>
          <ToggleGroup type="single" label="Alignment" value={align} onValueChange={setAlign} variant="ghost">
            <Toggle value="start" icon={TextAlignStart} label="Align left" />
            <Toggle value="center" icon={TextAlignCenter} label="Centre" />
            <Toggle value="end" icon={TextAlignEnd} label="Align right" />
          </ToggleGroup>
          <ToggleGroup type="multiple" label="Filters" variant="outline" size="sm" attached={false} defaultValue={["open"]}>
            <Toggle value="open">Open</Toggle>
            <Toggle value="mine">Assigned to me</Toggle>
            <Toggle value="urgent">Urgent</Toggle>
          </ToggleGroup>
          <p className="text-[12px] text-muted-foreground">
            styles: {styles.join(", ") || "none"} · align: {align ?? "none"}
          </p>
        </div>
      </Measure>
    );
  },
};

/** A player's toggles: an icon per state (Repeat → Repeat1), and a heart that fills when pressed. */
export const Player: Story = {
  render: function Render() {
    const [repeat, setRepeat] = useState<"off" | "all" | "one">("off");
    return (
      <div className="flex items-center gap-1">
        <Toggle variant="ghost" icon={Shuffle} label="Shuffle" />
        <Toggle
          variant="ghost"
          icon={repeat === "one" ? Repeat1 : Repeat}
          label={repeat === "one" ? "Repeat one" : "Repeat"}
          pressed={repeat !== "off"}
          onPressedChange={() => setRepeat(repeat === "off" ? "all" : repeat === "all" ? "one" : "off")}
        />
        <Toggle variant="ghost" icon={Heart} label="Like" className="aria-pressed:[&_svg]:fill-current" />
      </div>
    );
  },
};
