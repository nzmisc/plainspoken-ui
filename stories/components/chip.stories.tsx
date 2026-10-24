import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { Chip } from "@/registry/plainspoken/ui/chip";
import { Measure } from "../support/measure";

const meta: Meta = { title: "Components/Controls/Chip" };
export default meta;

export const Kinds: StoryObj = {
  render: function Render() {
    const [failed, setFailed] = useState(true);
    const [tags, setTags] = useState(["linux", "storage", "backup"]);
    return (
      <Measure>
        <div className="flex flex-wrap items-center gap-1.5">
          <Chip pressed={failed} onPressedChange={setFailed}>
            Failed only
          </Chip>
          <Chip>v2.4.1</Chip>
          {tags.map((t) => (
            <Chip key={t} onRemove={() => setTags(tags.filter((x) => x !== t))}>
              {t}
            </Chip>
          ))}
        </div>
      </Measure>
    );
  },
};
