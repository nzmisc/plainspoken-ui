"use client";

import { useState } from "react";
import { Download, Trash, Users } from "@/registry/plainspoken/lib/icons";
import { WORKSPACE } from "@/registry/plainspoken/blocks/app/data";
import { Alert } from "@/registry/plainspoken/ui/alert";
import { AlertDialog } from "@/registry/plainspoken/ui/alert-dialog";
import { Button } from "@/registry/plainspoken/ui/button";
import { Field } from "@/registry/plainspoken/ui/field";
import { FileField } from "@/registry/plainspoken/ui/file-upload";
import { Input } from "@/registry/plainspoken/ui/input";
import { Select } from "@/registry/plainspoken/ui/select";
import { Separator } from "@/registry/plainspoken/ui/separator";

export interface AppWorkspaceSettingsProps {
  /** Start with the delete confirmation open */
  defaultDeleting?: boolean;
}

/**
 * The workspace: its name, address, logo, currency and invoice numbering, then the danger zone,
 * set apart in red: export everything, hand the workspace to someone else, or delete it, which
 * asks you to type the workspace's name before it goes ahead.
 */
export function AppWorkspaceSettings({ defaultDeleting = false }: AppWorkspaceSettingsProps) {
  const [deleting, setDeleting] = useState(defaultDeleting);
  return (
    <div data-slot="app-workspace-settings" className="flex max-w-2xl flex-col gap-4">
      <form className="flex flex-col gap-3" onSubmit={(e) => e.preventDefault()}>
        <Field label="Name" required inline>
          <Input defaultValue={WORKSPACE} />
        </Field>
        <Field label="Address" inline hint="Your team signs in here.">
          <Input prefix="tally.example/" defaultValue="brightwater" />
        </Field>
        <Field label="Logo" inline hint="On invoices and statements. SVG or PNG, up to 1 MB.">
          <FileField accept=".svg,.png" maxSize={1024 * 1024} />
        </Field>
        <Field label="Currency" inline>
          <Select defaultValue="EUR" options={["EUR", "GBP", "USD", "SEK"]} className="self-start" />
        </Field>
        <Field label="Invoice numbers" inline hint="The next one is INV-2026-0167.">
          <Input defaultValue="INV-{year}-{number}" inputClassName="font-mono" />
        </Field>
        <Button type="submit" variant="primary" className="self-start">
          Save workspace
        </Button>
      </form>
      <Separator />
      <section aria-labelledby="danger-heading" className="border border-destructive">
        <h3 id="danger-heading" className="border-b border-destructive px-3 py-1.5 font-bold text-destructive">
          Danger zone
        </h3>
        <ul className="divide-y divide-border">
          <li className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
            <span>
              <b className="font-semibold">Export everything</b>
              <span className="block text-[13px] text-muted-foreground">Customers, invoices and projects as CSV files, in one zip.</span>
            </span>
            <Button icon={Download}>Export</Button>
          </li>
          <li className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
            <span>
              <b className="font-semibold">Transfer ownership</b>
              <span className="block text-[13px] text-muted-foreground">Make an admin the owner. You stay on as an admin.</span>
            </span>
            <Button icon={Users}>Transfer</Button>
          </li>
          <li className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
            <span>
              <b className="font-semibold">Delete this workspace</b>
              <span className="block text-[13px] text-muted-foreground">Everything in it goes, for everyone, and can&apos;t be brought back.</span>
            </span>
            <Button variant="destructive" icon={Trash} onClick={() => setDeleting(true)}>
              Delete workspace
            </Button>
          </li>
        </ul>
      </section>
      <AlertDialog
        open={deleting}
        onClose={() => setDeleting(false)}
        title={`Delete ${WORKSPACE}?`}
        description="24 customers, 26 invoices, 12 projects and 6 people's access go with it. This can't be undone."
        confirmLabel="Delete workspace"
        destructive
        typeToConfirm={WORKSPACE}
        onConfirm={() => setDeleting(false)}
      >
        <Alert variant="warning" title="Export first">
          Invoices you have sent must be kept for 10 years. Export them before you go ahead.
        </Alert>
      </AlertDialog>
    </div>
  );
}
