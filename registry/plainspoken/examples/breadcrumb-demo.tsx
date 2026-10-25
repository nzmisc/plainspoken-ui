import { Breadcrumb } from "@/registry/plainspoken/ui/breadcrumb";

/**
 * The last item is the current page. Links are plain <a> by default; pass your router's link
 * component as linkAs (with Next.js: linkAs={Link} from next/link) for client-side navigation.
 */
export default function BreadcrumbDemo() {
  return (
    <Breadcrumb
      items={[
        { label: "Home", href: "#home" },
        { label: "Settings", href: "#settings" },
        { label: "Billing", href: "#billing" },
        { label: "Invoices" },
      ]}
    />
  );
}
