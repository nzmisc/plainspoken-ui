import { ChevronRight } from "@/registry/plainspoken/lib/icons";
import { Breadcrumb } from "@/registry/plainspoken/ui/breadcrumb";
import { Icon } from "@/registry/plainspoken/ui/icon";

/** Past maxItems (5) the middle folds into "…": press it to show the rest. Any separator works, an icon too. */
export default function BreadcrumbLong() {
  return (
    <Breadcrumb
      separator={<Icon icon={ChevronRight} />}
      items={[
        { label: "Drive", href: "#drive" },
        { label: "Shared with me", href: "#shared" },
        { label: "Studio Kranich", href: "#studio" },
        { label: "Clients", href: "#clients" },
        { label: "Bäckerei Hoffmann", href: "#hoffmann" },
        { label: "2026 rebrand", href: "#rebrand" },
        { label: "Logo drafts" },
      ]}
    />
  );
}
