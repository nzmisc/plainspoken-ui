import { Alert } from "@/registry/plainspoken/ui/alert";

export default function AlertDemo() {
  return (
    <div className="flex max-w-xl flex-col gap-2">
      <Alert>Usage is counted once an hour, so the numbers below can be up to an hour old.</Alert>
      <Alert variant="info" title="Scheduled maintenance">
        The API is read-only on Sunday 2 November from 02:00 to 03:00 UTC.
      </Alert>
      <Alert variant="success" title="Domain verified">
        Mail from example.com is now signed and will reach inboxes.
      </Alert>
      <Alert variant="warning" title="Storage 84% full">
        41 GB of 50 GB used. Old exports are deleted after seven days.
      </Alert>
      <Alert variant="destructive" title="Payment failed">
        The card ending 4242 was declined. Update it before 1 November to keep your workspace.
      </Alert>
    </div>
  );
}
