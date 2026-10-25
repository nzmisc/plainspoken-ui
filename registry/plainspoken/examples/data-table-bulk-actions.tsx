"use client";

import { useState } from "react";
import { UserPlus } from "@/registry/plainspoken/lib/icons";
import { Button } from "@/registry/plainspoken/ui/button";
import { DataTable, type DataColumn } from "@/registry/plainspoken/ui/data-table";

interface Member {
  email: string;
  name: string;
  role: "Owner" | "Admin" | "Member" | "Guest";
  status: "Active" | "Invited" | "Suspended";
  seats: number;
}

const START: Member[] = [
  { email: "ines@northwind.dev", name: "Inês Carvalho", role: "Owner", status: "Active", seats: 3 },
  { email: "jonas@northwind.dev", name: "Jonas Weber", role: "Admin", status: "Active", seats: 1 },
  { email: "amara@northwind.dev", name: "Amara Nwosu", role: "Member", status: "Active", seats: 1 },
  { email: "kenji@northwind.dev", name: "Kenji Watanabe", role: "Member", status: "Invited", seats: 1 },
  { email: "lea@northwind.dev", name: "Léa Dubois", role: "Member", status: "Active", seats: 2 },
  { email: "omar@contractor.io", name: "Omar Haddad", role: "Guest", status: "Suspended", seats: 0 },
  { email: "priya@northwind.dev", name: "Priya Raman", role: "Admin", status: "Active", seats: 1 },
  { email: "sam@contractor.io", name: "Sam Taylor", role: "Guest", status: "Invited", seats: 0 },
];

const COLUMNS: DataColumn<Member>[] = [
  { key: "name", header: "Name", type: "text", value: (m) => m.name, className: "whitespace-nowrap" },
  { key: "email", header: "Email", type: "text", value: (m) => m.email, className: "font-mono text-[13px]" },
  { key: "role", header: "Role", type: "enum", value: (m) => m.role, options: ["Owner", "Admin", "Member", "Guest"] },
  { key: "status", header: "Status", type: "enum", value: (m) => m.status, options: ["Active", "Invited", "Suspended"] },
  { key: "seats", header: "Seats", type: "number", value: (m) => m.seats },
];

/**
 * The page holds the selection (selected and onSelectionChange), with bulk actions in the selection
 * bar and an "Invite" button at the end of the toolbar. Export, density and the sort bar are off.
 */
export default function DataTableBulkActions() {
  const [members, setMembers] = useState(START);
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const setStatus = (rows: Member[], status: Member["status"]) => {
    const keys = new Set(rows.map((r) => r.email));
    setMembers((ms) => ms.map((m) => (keys.has(m.email) ? { ...m, status } : m)));
    setSelected(new Set());
  };
  return (
    <DataTable
      label="Team members"
      columns={COLUMNS}
      rows={members}
      rowKey={(m) => m.email}
      selectable
      selected={selected}
      onSelectionChange={setSelected}
      selectionActions={(rows) => (
        <>
          <Button onClick={() => setStatus(rows, "Active")}>Reactivate</Button>
          <Button variant="destructive" onClick={() => setStatus(rows, "Suspended")}>
            Suspend {rows.length}
          </Button>
        </>
      )}
      actions={
        <Button variant="primary" icon={UserPlus}>
          Invite
        </Button>
      }
      columnFilters={false}
      densityToggle={false}
      exportable={false}
      sortBar={false}
      pageSizes={[0]}
      maxHeight="none"
    />
  );
}
