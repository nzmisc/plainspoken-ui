import { Badge } from "@/registry/plainspoken/ui/badge";

export default function BadgeDemo() {
  return (
    <div className="flex flex-col gap-3">
      <p className="flex flex-wrap items-center gap-2">
        <Badge>Draft</Badge>
        <Badge variant="info">Beta</Badge>
        <Badge variant="success">Paid</Badge>
        <Badge variant="warning">Overdue</Badge>
        <Badge variant="destructive">Failed</Badge>
      </p>
      <p>
        Invoice INV-2041 is <Badge variant="success">paid</Badge>; INV-2042 is <Badge variant="warning">3 days overdue</Badge>.
      </p>
    </div>
  );
}
