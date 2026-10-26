import { MilkdownEditor } from "@/registry/plainspoken/ui/milkdown-editor";

const TABLE = `## Bike servicing, spring

| Bike | Last service | Next due | Mechanic |
| :--- | ---: | ---: | --- |
| Cargo 1 | 12 Jan | 12 Apr | Callum |
| Cargo 2 | 3 Feb | 3 May | Callum |
| Road 7 | 20 Feb | 20 Mar | Ines |

Click into the table for its toolbar.`;

/**
 * GFM tables: the table button picks a size on a grid; in a table a small toolbar adds and
 * removes rows and columns and aligns whole columns (Markdown aligns columns, not cells). Tab and
 * ⇧Tab move between cells, and Tab in the last cell adds a row. "|3x4| " typed on a line makes one too.
 */
export default function MilkdownEditorTables() {
  return <MilkdownEditor aria-label="Servicing" defaultValue={TABLE} className="max-w-2xl" />;
}
