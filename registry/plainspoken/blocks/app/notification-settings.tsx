"use client";

import { useState } from "react";
import { Button } from "@/registry/plainspoken/ui/button";
import { Checkbox } from "@/registry/plainspoken/ui/checkbox";
import { Field } from "@/registry/plainspoken/ui/field";
import { Panel } from "@/registry/plainspoken/ui/panel";
import { Select } from "@/registry/plainspoken/ui/select";
import { Switch } from "@/registry/plainspoken/ui/switch";

const EMAIL = [
  { key: "paid", label: "A customer pays", description: "One email per payment, with the amount and the invoice." },
  { key: "overdue", label: "An invoice becomes overdue", description: "The morning after its due date." },
  { key: "comments", label: "Someone comments on your projects" },
  { key: "mentions", label: "Someone mentions you", description: "In comments and notes, anywhere in the workspace." },
  { key: "weekly", label: "Weekly summary", description: "Monday morning: what came in, what's late, what's due." },
];

export interface AppNotificationSettingsProps {
  /** Which emails are on at first */
  defaultOn?: string[];
}

/**
 * Which emails you get (switches: they apply at once), and the reminders customers get about
 * unpaid invoices (checkboxes and a time, saved with the button).
 */
export function AppNotificationSettings({ defaultOn = ["paid", "overdue", "mentions", "weekly"] }: AppNotificationSettingsProps) {
  const [on, setOn] = useState(() => new Set(defaultOn));
  return (
    <div data-slot="app-notification-settings" className="flex max-w-2xl flex-col gap-4">
      <Panel title="Email me when" meta="saved as you switch">
        <ul className="flex flex-col gap-2.5 p-1">
          {EMAIL.map((e) => (
            <li key={e.key}>
              <Switch
                label={e.label}
                description={e.description}
                checked={on.has(e.key)}
                onChange={(v) =>
                  setOn((s) => {
                    const next = new Set(s);
                    if (v) next.add(e.key);
                    else next.delete(e.key);
                    return next;
                  })
                }
              />
            </li>
          ))}
        </ul>
      </Panel>
      <Panel title="Reminders to customers" meta="for unpaid invoices">
        <form className="flex flex-col gap-2 p-1" onSubmit={(e) => e.preventDefault()}>
          <fieldset className="flex flex-col">
            <legend className="mb-1 font-medium">Send a reminder</legend>
            <Checkbox label="3 days before the due date" defaultChecked />
            <Checkbox label="On the due date" defaultChecked />
            <Checkbox label="7 days late" description="With the invoice attached again." defaultChecked />
            <Checkbox label="14 days late, with a copy to you" />
          </fieldset>
          <Field label="At" inline>
            <Select
              defaultValue="09"
              options={[
                { value: "08", label: "08:00" },
                { value: "09", label: "09:00" },
                { value: "13", label: "13:00" },
              ]}
              className="self-start"
            />
          </Field>
          <Button type="submit" variant="primary" className="self-start">
            Save reminders
          </Button>
        </form>
      </Panel>
    </div>
  );
}
