import { Button } from "@/registry/plainspoken/ui/button";
import { Panel } from "@/registry/plainspoken/ui/panel";
import { Status } from "@/registry/plainspoken/ui/status";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/registry/plainspoken/ui/table";

/** flush drops the body's padding, for a table that brings its own borders; a frameless table keeps the edges single. */
export default function PanelFlush() {
  return (
    <Panel title="Deployments" meta="last 24 h" actions={<Button>View all</Button>} flush className="max-w-xl">
      <Table frameless>
        <TableHeader>
          <TableRow>
            <TableHead>Commit</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Duration</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell className="font-mono text-[13px]">a3f9c21</TableCell>
            <TableCell>
              <Status variant="success">live</Status>
            </TableCell>
            <TableCell numeric>1m 12s</TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="font-mono text-[13px]">77be0d4</TableCell>
            <TableCell>
              <Status variant="destructive">failed</Status>
            </TableCell>
            <TableCell numeric>38s</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </Panel>
  );
}
