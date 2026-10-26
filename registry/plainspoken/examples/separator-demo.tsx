import { Button } from "@/registry/plainspoken/ui/button";
import { Separator } from "@/registry/plainspoken/ui/separator";

/** A rule between sections, a labelled rule, and vertical lines between groups in a toolbar. */
export default function SeparatorDemo() {
  return (
    <div className="flex max-w-md flex-col gap-3">
      <div>
        <p className="font-semibold">Profile</p>
        <p className="text-muted-foreground">Your name and photo, as other people see them.</p>
      </div>
      <Separator />
      <Button variant="primary" block>
        Continue with email
      </Button>
      <Separator label="or" />
      <Button block>Continue with a passkey</Button>
      <div className="ctl-sm flex items-center gap-2 border border-border p-1">
        <Button variant="ghost">Reply</Button>
        <Button variant="ghost">Forward</Button>
        <Separator orientation="vertical" />
        <Button variant="ghost">Archive</Button>
        <Button variant="ghost">Delete</Button>
      </div>
    </div>
  );
}
