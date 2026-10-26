import { Input } from "@/registry/plainspoken/ui/input";

export default function InputDemo() {
  return (
    <div className="flex max-w-sm flex-col gap-2">
      <Input placeholder="Search the docs" aria-label="Search the docs" />
      <Input defaultValue="Read only" readOnly aria-label="Read only" />
      <Input defaultValue="Disabled" disabled aria-label="Disabled" />
      <Input defaultValue="not-an-email" invalid aria-label="Invalid" />
    </div>
  );
}
