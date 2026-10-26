import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import * as all from "@/registry/plainspoken/lib/icons";
import { isGlyph, Search, type Glyph } from "@/registry/plainspoken/lib/icons";
import { Icon } from "@/registry/plainspoken/ui/icon";
import { Input } from "@/registry/plainspoken/ui/input";

const ICONS = Object.entries(all).filter((e): e is [string, Glyph] => isGlyph(e[1]));

/** Every icon in lib/icons: copied from Lucide as plain data, drawn by <Icon>. */
const meta: Meta<{ size: number; strokeWidth: number }> = {
  title: "Foundations/Icons",
  args: { size: 20, strokeWidth: 2 },
  argTypes: { size: { control: { type: "range", min: 12, max: 48 } }, strokeWidth: { control: { type: "range", min: 1, max: 3, step: 0.25 } } },
};
export default meta;

export const Gallery: StoryObj<{ size: number; strokeWidth: number }> = {
  render: function Render({ size, strokeWidth }) {
    const [q, setQ] = useState("");
    const shown = ICONS.filter(([n, g]) => !q || n.toLowerCase().includes(q.toLowerCase()) || g.name.includes(q.toLowerCase()));
    return (
      <div className="flex flex-col gap-3">
        <Input prefix={Search} value={q} onChange={(e) => setQ(e.target.value)} placeholder={`Search ${ICONS.length} icons`} aria-label="Search icons" className="w-64" />
        <ul className="grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-px border border-border bg-border">
          {shown.map(([n, g]) => (
            <li key={n} className="flex flex-col items-center gap-1 bg-background p-2 text-center">
              <Icon icon={g} size={size} strokeWidth={strokeWidth} />
              <span className="font-mono text-[11px] break-all text-muted-foreground">{n}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  },
};

/** Icons sit on the text baseline at 1.1em, whatever the font size. */
export const InText: StoryObj = {
  render: () => (
    <div className="flex flex-col gap-2">
      {[12, 14, 16, 20, 28].map((px) => (
        <p key={px} style={{ fontSize: px }}>
          <Icon icon={all.Inbox} /> Inbox <Icon icon={all.Star} /> Starred <Icon icon={all.Send} /> Sent
        </p>
      ))}
    </div>
  ),
};
