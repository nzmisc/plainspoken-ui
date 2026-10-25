import { Badge } from "@/registry/plainspoken/ui/badge";
import { DescriptionList } from "@/registry/plainspoken/ui/description-list";

/** Terms on the left, descriptions beside them; on a phone each term goes above its description. */
export default function DescriptionListDemo() {
  return (
    <DescriptionList
      className="max-w-xl"
      items={[
        { term: "Order", description: <span className="font-mono text-[13px]">#40213</span> },
        { term: "Status", description: <Badge variant="success">Shipped</Badge> },
        { term: "Ship to", description: "Jonas Weber, Lindenallee 4, 10115 Berlin, Germany" },
        { term: "Delivery", description: "DHL, tracked, expected Tuesday 28 October" },
        { term: "Total", description: <span className="tabular-nums">€86.40 incl. VAT</span> },
      ]}
    />
  );
}
