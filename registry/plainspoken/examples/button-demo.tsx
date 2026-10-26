import { Download } from "@/registry/plainspoken/lib/icons";
import { Button } from "@/registry/plainspoken/ui/button";

export default function ButtonDemo() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button>Default</Button>
      <Button variant="primary">Save changes</Button>
      <Button icon={Download}>Download</Button>
      <Button loading>Saving</Button>
      <Button disabled>Disabled</Button>
    </div>
  );
}
