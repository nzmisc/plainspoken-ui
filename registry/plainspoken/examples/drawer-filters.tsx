"use client";

import { useState } from "react";
import { Funnel } from "@/registry/plainspoken/lib/icons";
import { Button } from "@/registry/plainspoken/ui/button";
import { Checkbox } from "@/registry/plainspoken/ui/checkbox";
import { Drawer } from "@/registry/plainspoken/ui/drawer";
import { Field } from "@/registry/plainspoken/ui/field";
import { Select } from "@/registry/plainspoken/ui/select";

const STATUSES = ["Open", "In review", "Blocked", "Done"];
const NONE = { statuses: ["Open", "In review"], assignee: "Anyone", updated: "any" };

/** Filters from the left, with Reset and Apply in the footer. Nothing changes until Apply. */
export default function DrawerFilters() {
  const [open, setOpen] = useState(false);
  const [applied, setApplied] = useState(NONE);
  const [draft, setDraft] = useState(NONE);
  const show = () => {
    setDraft(applied);
    setOpen(true);
  };
  const toggle = (s: string, on: boolean) => setDraft({ ...draft, statuses: on ? [...draft.statuses, s] : draft.statuses.filter((x) => x !== s) });
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button icon={Funnel} onClick={show}>
        Filters
      </Button>
      <span className="text-muted-foreground">
        {applied.statuses.join(", ") || "No status"} · {applied.assignee} · updated {applied.updated === "any" ? "any time" : `in the last ${applied.updated}`}
      </span>
      <Drawer
        side="left"
        open={open}
        onClose={() => setOpen(false)}
        title="Filter issues"
        className="w-[22rem]"
        footer={
          <>
            <Button className="mr-auto" onClick={() => setDraft(NONE)}>
              Reset
            </Button>
            <Button onClick={() => setOpen(false)}>Cancel</Button>
            <Button
              variant="primary"
              onClick={() => {
                setApplied(draft);
                setOpen(false);
              }}
            >
              Apply
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <fieldset className="border border-border px-3 pb-2">
            <legend className="px-1 font-medium">Status</legend>
            {STATUSES.map((s) => (
              <Checkbox key={s} label={s} checked={draft.statuses.includes(s)} onChange={(e) => toggle(s, e.target.checked)} className="flex" />
            ))}
          </fieldset>
          <Field label="Assignee">
            <Select options={["Anyone", "Me", "Unassigned", "Priya Raman", "Tomás Ferreira"]} value={draft.assignee} onChange={(e) => setDraft({ ...draft, assignee: e.target.value })} />
          </Field>
          <Field label="Updated">
            <Select
              options={[
                { value: "any", label: "Any time" },
                { value: "24 hours", label: "Last 24 hours" },
                { value: "7 days", label: "Last 7 days" },
                { value: "30 days", label: "Last 30 days" },
              ]}
              value={draft.updated}
              onChange={(e) => setDraft({ ...draft, updated: e.target.value })}
            />
          </Field>
        </div>
      </Drawer>
    </div>
  );
}
