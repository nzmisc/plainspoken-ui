"use client";

import { Button } from "@/registry/plainspoken/ui/button";
import { Toaster, toast } from "@/registry/plainspoken/ui/toast";

/**
 * Put one <Toaster /> in your root layout and call toast() from anywhere. Toasts close after 5 s
 * (8 s with an action, never for errors); their timers pause while the pointer or focus is on
 * them. Alt+T jumps to the newest one's button.
 */
export default function ToastDemo() {
  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant="primary"
        onClick={() =>
          toast({
            title: "Conversation archived",
            description: "“Quarterly numbers” from Jonas Weber",
            action: { label: "Undo", onClick: () => toast({ title: "Moved back to Inbox", variant: "success" }) },
          })
        }
      >
        Archive
      </Button>
      <Button onClick={() => toast({ title: "Link copied", variant: "success" })}>Copy link</Button>
      <Button onClick={() => toast({ title: "New version available", description: "Reload to get it.", variant: "info" })}>Info</Button>
      <Button onClick={() => toast({ title: "You're offline", description: "Changes will sync when you reconnect.", variant: "warning" })}>
        Warning
      </Button>
      <Button onClick={() => toast({ title: "Couldn't send the message", description: "SMTP 554: rejected as spam.", variant: "destructive" })}>
        Error (stays)
      </Button>
      <Toaster />
    </div>
  );
}
