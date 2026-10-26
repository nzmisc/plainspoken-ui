import { Badge } from "@/registry/plainspoken/ui/badge";

/** solid fills the badge, for counts and labels that must stand out. icon={false} drops the symbol where the words say it all. */
export default function BadgeSolid() {
  return (
    <p className="flex flex-wrap items-center gap-2">
      <Badge solid>12</Badge>
      <Badge solid variant="info">
        New
      </Badge>
      <Badge solid variant="success">
        Passing
      </Badge>
      <Badge solid variant="warning" icon={false}>
        3 warnings
      </Badge>
      <Badge solid variant="destructive" icon={false}>
        2 errors
      </Badge>
    </p>
  );
}
