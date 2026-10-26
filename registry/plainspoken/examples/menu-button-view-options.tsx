"use client";

import { useState } from "react";
import { Settings2 } from "@/registry/plainspoken/lib/icons";
import { Button } from "@/registry/plainspoken/ui/button";
import { Checkbox } from "@/registry/plainspoken/ui/checkbox";
import { MenuButton } from "@/registry/plainspoken/ui/menu-button";
import { Select } from "@/registry/plainspoken/ui/select";

/**
 * A small settings panel at the right end of a toolbar: align="end" lines it up with the button's
 * right edge, and the ctl-sm class on the bar makes everything inside, panel included, the small size.
 */
export default function MenuButtonViewOptions() {
  const [archived, setArchived] = useState(false);
  const [previews, setPreviews] = useState(true);
  const [group, setGroup] = useState("none");
  return (
    <div className="ctl-sm flex flex-wrap items-center gap-1.5 border border-border bg-muted px-1.5 py-1 text-[13px]">
      <b className="mr-auto px-1">Inbox</b>
      <Button>Mark all read</Button>
      <MenuButton label="View" icon={Settings2} align="end" panelClassName="w-56">
        <div className="flex flex-col gap-1">
          <Checkbox label="Show archived" checked={archived} onChange={(e) => setArchived(e.target.checked)} />
          <Checkbox label="Show previews" checked={previews} onChange={(e) => setPreviews(e.target.checked)} />
          <label className="mt-1 flex items-center justify-between gap-2">
            Group by
            <Select
              value={group}
              onChange={(e) => setGroup(e.target.value)}
              options={[
                { value: "none", label: "Nothing" },
                { value: "date", label: "Date" },
                { value: "sender", label: "Sender" },
              ]}
            />
          </label>
        </div>
      </MenuButton>
    </div>
  );
}
