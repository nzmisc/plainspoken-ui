import { Inbox, Plus } from "@/registry/plainspoken/lib/icons";
import { Button } from "@/registry/plainspoken/ui/button";
import { EmptyState } from "@/registry/plainspoken/ui/empty-state";

export default function EmptyStateDemo() {
  return (
    <EmptyState
      icon={Inbox}
      title="No messages"
      description="Mail you receive at hello@example.com shows up here. Nothing has arrived yet."
      actions={
        <>
          <Button variant="primary" icon={Plus}>
            New message
          </Button>
          <Button>Import mail</Button>
        </>
      }
      bordered
    />
  );
}
