import { Pencil } from "@/registry/plainspoken/lib/icons";
import { AppPageHeader } from "@/registry/plainspoken/blocks/app/page-header";
import { Badge } from "@/registry/plainspoken/ui/badge";
import { Button } from "@/registry/plainspoken/ui/button";

/** Breadcrumb, title with a badge, a line of description, and the page's buttons. */
export default function AppPageHeaderDemo() {
  return (
    <AppPageHeader
      crumbs={[{ label: "Brightwater Studio", href: "/demos/app" }, { label: "Customers", href: "/demos/app/customers" }, { label: "Fjord Outdoor" }]}
      title="Fjord Outdoor"
      badge={<Badge variant="success">Active</Badge>}
      description="Ingrid Solberg · Bergen, Norway · customer since 3 Mar 2025"
      actions={
        <>
          <Button icon={Pencil}>Edit</Button>
          <Button variant="primary">New invoice</Button>
        </>
      }
    />
  );
}
