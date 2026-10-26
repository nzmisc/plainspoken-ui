"use client";

import { useState } from "react";
import { Ellipsis, Mail, Trash, UserPlus } from "@/registry/plainspoken/lib/icons";
import { APP_NOW, TEAM, type TeamMember } from "@/registry/plainspoken/blocks/app/data";
import { ms } from "@/registry/plainspoken/blocks/app/format";
import { Avatar } from "@/registry/plainspoken/ui/avatar";
import { Badge } from "@/registry/plainspoken/ui/badge";
import { Button } from "@/registry/plainspoken/ui/button";
import { Dialog } from "@/registry/plainspoken/ui/dialog";
import { DropdownMenu } from "@/registry/plainspoken/ui/dropdown-menu";
import { Field } from "@/registry/plainspoken/ui/field";
import { RadioGroup } from "@/registry/plainspoken/ui/radio-group";
import { RelativeTime } from "@/registry/plainspoken/ui/relative-time";
import { Select } from "@/registry/plainspoken/ui/select";
import { SimpleTable } from "@/registry/plainspoken/ui/table";
import { Textarea } from "@/registry/plainspoken/ui/textarea";

const ROLES = [
  { value: "Admin", label: "Admin", description: "Everything, including billing and removing people." },
  { value: "Member", label: "Member", description: "Customers, projects and invoices; no billing." },
  { value: "Billing", label: "Billing", description: "Invoices and payments only, for your accountant." },
];

export interface AppTeamTableProps {
  team?: TeamMember[];
  now?: string;
  /** Start with the invite dialog open */
  defaultInviting?: boolean;
}

/**
 * The people in the workspace: avatar, name and email, job, role (a select, except for the
 * owner), and when they were last in, or "Invited" for those who haven't joined. Each row has a
 * menu; Invite opens a dialog for addresses and a role.
 */
export function AppTeamTable({ team = TEAM, now = APP_NOW, defaultInviting = false }: AppTeamTableProps) {
  const [inviting, setInviting] = useState(defaultInviting);
  const [role, setRole] = useState("Member");
  return (
    <div data-slot="app-team-table" className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-muted-foreground">
          {team.length} people, 5 of 8 seats used on the Studio plan.
        </p>
        <Button variant="primary" icon={UserPlus} onClick={() => setInviting(true)}>
          Invite people
        </Button>
      </div>
      <SimpleTable
        rows={team}
        rowKey={(m) => m.id}
        columns={[
          {
            key: "who",
            header: "Person",
            cell: (m) => (
              <span className="flex items-center gap-2">
                <Avatar name={m.name} size={28} />
                <span className="min-w-0">
                  <span className="block font-semibold">{m.name}</span>
                  <span className="block text-[13px] text-muted-foreground">{m.email}</span>
                </span>
              </span>
            ),
          },
          { key: "title", header: "Job", cell: (m) => m.title, className: "max-md:hidden" },
          {
            key: "role",
            header: "Role",
            cell: (m) => (m.role === "Owner" ? <span className="inline-flex h-6 items-center font-medium">Owner</span> : <Select size="sm" aria-label={`Role of ${m.name}`} defaultValue={m.role} options={ROLES.map((r) => r.value)} />),
          },
          {
            key: "seen",
            header: "Last in",
            cell: (m) =>
              m.status === "Invited" ? (
                <Badge variant="warning">Invited</Badge>
              ) : (
                <RelativeTime date={ms(m.lastActive)} now={ms(now)} format="long" locale="en-GB" className="whitespace-nowrap text-muted-foreground" />
              ),
            className: "max-sm:hidden",
          },
          {
            key: "menu",
            header: <span className="sr-only">Actions</span>,
            cell: (m) =>
              m.role === "Owner" ? null : (
                <DropdownMenu
                  trigger={Ellipsis}
                  label={`Actions for ${m.name}`}
                  triggerVariant="ghost"
                  size="sm"
                  align="end"
                  items={[
                    ...(m.status === "Invited" ? [{ label: "Send the invitation again", icon: Mail }] : []),
                    { label: "Remove from workspace", icon: Trash, destructive: true },
                  ]}
                />
              ),
            className: "w-0",
          },
        ]}
      />
      <Dialog
        open={inviting}
        onClose={() => setInviting(false)}
        title="Invite people"
        description="They get an email with a link to join Brightwater Studio."
        footer={
          <>
            <Button onClick={() => setInviting(false)}>Cancel</Button>
            <Button variant="primary" onClick={() => setInviting(false)}>
              Send invitations
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-3">
          <Field label="Email addresses" hint="One per line, or separated by commas.">
            <Textarea rows={3} placeholder={"rosa.lima@mailbox.example\nnew.designer@example.com"} />
          </Field>
          <RadioGroup legend="Role" value={role} onChange={setRole} options={ROLES} />
        </div>
      </Dialog>
    </div>
  );
}
