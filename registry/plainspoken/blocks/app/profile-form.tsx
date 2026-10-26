"use client";

import { useState } from "react";
import { ME, type TeamMember } from "@/registry/plainspoken/blocks/app/data";
import { Avatar } from "@/registry/plainspoken/ui/avatar";
import { Button } from "@/registry/plainspoken/ui/button";
import { Combobox } from "@/registry/plainspoken/ui/combobox";
import { Field } from "@/registry/plainspoken/ui/field";
import { FileField } from "@/registry/plainspoken/ui/file-upload";
import { Input } from "@/registry/plainspoken/ui/input";
import { RadioGroup } from "@/registry/plainspoken/ui/radio-group";
import { Select } from "@/registry/plainspoken/ui/select";
import { Separator } from "@/registry/plainspoken/ui/separator";

const ZONES = [
  ["Europe/Lisbon", "Lisbon", "UTC+0"],
  ["Europe/London", "London", "UTC+0"],
  ["Europe/Dublin", "Dublin", "UTC+0"],
  ["Europe/Madrid", "Madrid", "UTC+1"],
  ["Europe/Paris", "Paris", "UTC+1"],
  ["Europe/Berlin", "Berlin", "UTC+1"],
  ["Europe/Stockholm", "Stockholm", "UTC+1"],
  ["Europe/Helsinki", "Helsinki", "UTC+2"],
  ["America/New_York", "New York", "UTC−5"],
  ["America/Sao_Paulo", "São Paulo", "UTC−3"],
  ["Asia/Tokyo", "Tokyo", "UTC+9"],
].map(([value, label, hint]) => ({ value, label, hint }));

export interface AppProfileFormProps {
  user?: TeamMember;
}

/**
 * Your own settings: photo, name, email, job title, time zone (a combobox to type into), language
 * and how dates are written, with the labels beside the fields on wide screens. Save and Cancel
 * sit under a rule.
 */
export function AppProfileForm({ user = ME }: AppProfileFormProps) {
  const [dates, setDates] = useState("dmy");
  return (
    <form data-slot="app-profile-form" className="flex max-w-2xl flex-col gap-3" onSubmit={(e) => e.preventDefault()}>
      <div className="flex items-center gap-3">
        <Avatar name={user.name} size={56} />
        <FileField label="Photo" accept=".png,.jpg,.jpeg" maxSize={2 * 1024 * 1024} className="flex-1" />
      </div>
      <Separator />
      <Field label="Name" required inline>
        <Input defaultValue={user.name} autoComplete="name" />
      </Field>
      <Field label="Email" required inline hint="Where sign-in links and notifications go.">
        <Input type="email" defaultValue={user.email} autoComplete="email" />
      </Field>
      <Field label="Job title" inline hint="Shown to your team and on invoices you send.">
        <Input defaultValue={user.title} />
      </Field>
      <Field label="Time zone" inline>
        <Combobox options={ZONES} defaultValue="Europe/Lisbon" />
      </Field>
      <Field label="Language" inline>
        <Select
          defaultValue="en-GB"
          options={[
            { value: "en-GB", label: "English (UK)" },
            { value: "en-US", label: "English (US)" },
            { value: "pt-PT", label: "Português" },
            { value: "de-DE", label: "Deutsch" },
            { value: "fr-FR", label: "Français" },
          ]}
          className="self-start"
        />
      </Field>
      <RadioGroup
        legend="Dates"
        value={dates}
        onChange={setDates}
        horizontal
        options={[
          { value: "dmy", label: "24 Oct 2026" },
          { value: "mdy", label: "Oct 24, 2026" },
          { value: "iso", label: "2026-10-24" },
        ]}
      />
      <Separator />
      <div className="flex gap-2">
        <Button type="submit" variant="primary">
          Save changes
        </Button>
        <Button type="reset">Cancel</Button>
      </div>
    </form>
  );
}
