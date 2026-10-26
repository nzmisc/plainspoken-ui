import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { CONTROL_SIZES } from "@/registry/plainspoken/lib/controls";
import { Button } from "@/registry/plainspoken/ui/button";
import { SegmentedControl } from "@/registry/plainspoken/ui/segmented-control";
import { Measure } from "../support/measure";

const meta: Meta = { title: "Components/Controls/Segmented control" };
export default meta;

export const Sizes: StoryObj = {
  render: function Render() {
    const [v, setV] = useState("7d");
    return (
      <Measure>
        <div className="flex flex-col gap-2">
          {CONTROL_SIZES.map((s) => (
            <div key={s} className={`ctl-${s} flex items-center gap-2`}>
              <SegmentedControl label="Range" value={v} onChange={setV} options={["24h", "7d", "30d"]} />
              <Button>Export</Button>
            </div>
          ))}
        </div>
      </Measure>
    );
  },
};
