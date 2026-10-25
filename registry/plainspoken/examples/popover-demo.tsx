"use client";

import { useState } from "react";
import { Button } from "@/registry/plainspoken/ui/button";
import { Checkbox } from "@/registry/plainspoken/ui/checkbox";
import { Input } from "@/registry/plainspoken/ui/input";
import { Popover } from "@/registry/plainspoken/ui/popover";
import { Select } from "@/registry/plainspoken/ui/select";

const NONE = { status: "Any", minTotal: "", unpaidOnly: false };

export default function PopoverDemo() {
  const [applied, setApplied] = useState(NONE);
  const [draft, setDraft] = useState(NONE);
  const active = (applied.status !== "Any" ? 1 : 0) + (applied.minTotal ? 1 : 0) + (applied.unpaidOnly ? 1 : 0);
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Popover
        trigger={active ? `Filter (${active})` : "Filter"}
        chevron
        title="Filter orders"
        onOpenChange={(open) => open && setDraft(applied)}
      >
        {(close) => (
          <form
            className="flex flex-col gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              setApplied(draft);
              close();
            }}
          >
            <label className="flex items-center justify-between gap-4">
              Status
              <Select value={draft.status} onChange={(e) => setDraft({ ...draft, status: e.target.value })} options={["Any", "Paid", "Shipped", "Refunded"]} />
            </label>
            <label className="flex items-center justify-between gap-4">
              Total at least
              <Input
                inputMode="decimal"
                prefix="€"
                value={draft.minTotal}
                onChange={(e) => setDraft({ ...draft, minTotal: e.target.value.replace(/[^\d.]/g, "") })}
                className="w-24"
                inputClassName="text-right tabular-nums"
              />
            </label>
            <Checkbox label="Unpaid only" checked={draft.unpaidOnly} onChange={(e) => setDraft({ ...draft, unpaidOnly: e.target.checked })} />
            <div className="-mx-3 mt-1 -mb-3 flex justify-end gap-2 border-t border-border bg-muted px-3 py-2">
              <Button onClick={() => setDraft(NONE)}>Reset</Button>
              <Button type="submit" variant="primary">
                Apply
              </Button>
            </div>
          </form>
        )}
      </Popover>
      <span className="text-muted-foreground">{active ? `${active} filter${active > 1 ? "s" : ""} on` : "Showing all 1,284 orders"}</span>
    </div>
  );
}
