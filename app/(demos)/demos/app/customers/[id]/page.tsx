import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { Archive, Ellipsis, Mail, Pencil, Trash } from "@/registry/plainspoken/lib/icons";
import { CUSTOMERS, customerById } from "@/registry/plainspoken/blocks/app/data";
import { CUSTOMER_VARIANT, day } from "@/registry/plainspoken/blocks/app/format";
import { AppCustomerDetail } from "@/registry/plainspoken/blocks/app/customer-detail";
import { NewInvoiceButton } from "@/registry/plainspoken/blocks/app/new-invoice";
import { AppPage, AppPageHeader } from "@/registry/plainspoken/blocks/app/page-header";
import { Badge } from "@/registry/plainspoken/ui/badge";
import { Button } from "@/registry/plainspoken/ui/button";
import { DropdownMenu } from "@/registry/plainspoken/ui/dropdown-menu";
import { Skeleton } from "@/registry/plainspoken/ui/skeleton";

export function generateStaticParams() {
  return CUSTOMERS.map((c) => ({ id: c.id }));
}

export async function generateMetadata({ params }: PageProps<"/demos/app/customers/[id]">): Promise<Metadata> {
  const { id } = await params;
  const c = customerById(id);
  if (!c) return {};
  return { title: `${c.name} · App skeleton`, description: `${c.name}, a customer in Tally, the plainspoken-ui demo app: details, invoices, projects and activity.` };
}

// The part that reads the URL waits in Suspense, so the frame shows at once; every id is prerendered.
export default function CustomerPage({ params }: PageProps<"/demos/app/customers/[id]">) {
  return (
    <AppPage>
      <Suspense fallback={<Skeleton lines={6} className="max-w-xl" />}>
        <Customer params={params} />
      </Suspense>
    </AppPage>
  );
}

async function Customer({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const c = customerById(id);
  if (!c) notFound();
  return (
    <>
      <AppPageHeader
        crumbs={[{ label: "Brightwater Studio", href: "/demos/app" }, { label: "Customers", href: "/demos/app/customers" }, { label: c.name }]}
        title={c.name}
        badge={<Badge variant={CUSTOMER_VARIANT[c.status]}>{c.status}</Badge>}
        description={`${c.contact} · ${c.city}, ${c.country} · customer since ${day(c.since)}`}
        actions={
          <>
            <Button icon={Pencil}>Edit</Button>
            <NewInvoiceButton customerId={c.id} />
            <DropdownMenu
              trigger={Ellipsis}
              label="More actions"
              align="end"
              items={[
                { label: "Send a statement", icon: Mail },
                { label: "Archive customer", icon: Archive },
                { type: "separator" },
                { label: "Delete customer", icon: Trash, destructive: true },
              ]}
            />
          </>
        }
      />
      <AppCustomerDetail customer={c} />
    </>
  );
}
