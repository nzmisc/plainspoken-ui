"use client";

import { useState } from "react";
import { Bold, Italic, Strikethrough, TextAlignCenter, TextAlignEnd, TextAlignStart, Underline } from "@/registry/plainspoken/lib/icons";
import { Toggle, ToggleGroup } from "@/registry/plainspoken/ui/toggle";

/** type="multiple" for styles that combine; type="single" for alignment (pressing the pressed one again unpresses it). ←/→ move between them. */
export default function ToggleGroupExample() {
  const [styles, setStyles] = useState<string[]>(["bold"]);
  const [align, setAlign] = useState<string | null>("start");
  return (
    <div className="flex flex-wrap items-center gap-3">
      <ToggleGroup type="multiple" label="Text style" value={styles} onValueChange={setStyles}>
        <Toggle value="bold" icon={Bold} label="Bold" />
        <Toggle value="italic" icon={Italic} label="Italic" />
        <Toggle value="underline" icon={Underline} label="Underline" />
        <Toggle value="strike" icon={Strikethrough} label="Strikethrough" />
      </ToggleGroup>
      <ToggleGroup type="single" label="Alignment" value={align} onValueChange={setAlign}>
        <Toggle value="start" icon={TextAlignStart} label="Align left" />
        <Toggle value="center" icon={TextAlignCenter} label="Centre" />
        <Toggle value="end" icon={TextAlignEnd} label="Align right" />
      </ToggleGroup>
      <ToggleGroup type="single" label="View" variant="outline" size="sm" attached={false} defaultValue="list">
        <Toggle value="list">List</Toggle>
        <Toggle value="board">Board</Toggle>
      </ToggleGroup>
    </div>
  );
}
