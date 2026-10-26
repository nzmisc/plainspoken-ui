import { SimpleTable, type TableColumn } from "@/registry/plainspoken/ui/table";

type Member = { name: string; email: string; role: string; seats: number };

const MEMBERS: Member[] = [
  { name: "Amara Okafor", email: "amara@example.com", role: "Owner", seats: 1 },
  { name: "Jonas Weber", email: "jonas@example.com", role: "Admin", seats: 1 },
  { name: "Li Wei", email: "li@example.com", role: "Member", seats: 2 },
];

const COLUMNS: TableColumn<Member>[] = [
  { key: "name", header: "Name", cell: (m) => m.name },
  { key: "email", header: "Email", cell: (m) => m.email, className: "hidden sm:table-cell" },
  { key: "role", header: "Role", cell: (m) => m.role },
  { key: "seats", header: "Seats", numeric: true, cell: (m) => m.seats },
];

/**
 * SimpleTable: columns that say how to draw their cells, and an array of rows. rules="rows" draws
 * only the lines between rows. With no rows it says so.
 */
export default function TableSimple() {
  return (
    <div className="flex flex-col gap-4">
      <SimpleTable columns={COLUMNS} rows={MEMBERS} rowKey={(m) => m.email} rules="rows" className="max-w-xl" />
      <SimpleTable columns={COLUMNS} rows={[]} rowKey={(m) => m.email} empty="No one has been invited yet." className="max-w-xl" />
    </div>
  );
}
