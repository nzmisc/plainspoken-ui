import { Search, X } from "@/registry/plainspoken/lib/icons";
import { IconButton } from "@/registry/plainspoken/ui/button";
import { Input } from "@/registry/plainspoken/ui/input";

/** An icon sits inside the box, text gets a gray cell, and an element (a small button) sits inside as it is. */
export default function InputAffixes() {
  return (
    <div className="flex max-w-md flex-col gap-2">
      <Input prefix={Search} placeholder="Search" aria-label="Search" />
      <Input prefix="https://" suffix=".example.com" defaultValue="shop" aria-label="Subdomain" />
      <Input suffix="GiB" type="number" defaultValue={512} aria-label="Disk size" className="w-40" />
      <Input defaultValue="filter text" aria-label="Filter" suffix={<IconButton size="xs" variant="ghost" icon={X} label="Clear" />} />
    </div>
  );
}
