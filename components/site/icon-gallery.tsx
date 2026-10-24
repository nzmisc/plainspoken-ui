"use client";

import { useDeferredValue, useState } from "react";
import * as all from "@/registry/plainspoken/lib/icons";
import { isGlyph, Search, type Glyph } from "@/registry/plainspoken/lib/icons";
import { Icon } from "@/registry/plainspoken/ui/icon";
import { Input } from "@/registry/plainspoken/ui/input";
import { CopyButton } from "@/registry/plainspoken/ui/copy-button";

const ICONS: [string, Glyph][] = Object.entries(all).filter((e): e is [string, Glyph] => isGlyph(e[1]));

/** Every icon in lib/icons, searchable by its export or Lucide name, with the import to copy. */
export function IconGallery() {
  const [q, setQ] = useState("");
  const query = useDeferredValue(q.trim().toLowerCase());
  const shown = query ? ICONS.filter(([exp, g]) => exp.toLowerCase().includes(query) || g.name.includes(query)) : ICONS;
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <Input prefix={Search} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search icons" aria-label="Search icons" className="w-64" />
        <span className="text-[13px] text-muted-foreground" aria-live="polite">
          {shown.length} of {ICONS.length}
        </span>
      </div>
      <ul className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] border-t border-l border-border">
        {shown.map(([exp, g]) => (
          <li key={exp} className="flex items-center gap-2 border-r border-b border-border py-1 pr-1 pl-2 text-[12px]">
            <Icon icon={g} size={18} />
            <span className="min-w-0 flex-1 truncate font-mono" title={g.name}>
              {exp}
            </span>
            <CopyButton text={`import { ${exp} } from "@/lib/icons";`} />
          </li>
        ))}
      </ul>
    </div>
  );
}
