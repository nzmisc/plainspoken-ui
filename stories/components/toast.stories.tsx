import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Button } from "@/registry/plainspoken/ui/button";
import { Toaster, toast } from "@/registry/plainspoken/ui/toast";

const meta: Meta = {
  title: "Components/Feedback/Toast",
  component: Toaster,
  parameters: { layout: "fullscreen" },
  decorators: [
    (S) => (
      <div className="min-h-[420px] p-4">
        <S />
        <Toaster />
      </div>
    ),
  ],
};
export default meta;
type Story = StoryObj;

/**
 * Click to stack toasts in the corner (along the bottom edge on phones). They close after 5 s,
 * 8 s with an action; errors stay until dismissed. Timers pause while the pointer or focus is on
 * the stack. Alt+T focuses the newest toast's button; Escape there closes it and returns focus.
 */
export const Playground: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Button
        variant="primary"
        onClick={() =>
          toast({
            title: "Archived",
            description: "“Quarterly numbers” from Jonas Weber",
            action: { label: "Undo", onClick: () => toast({ title: "Moved back to Inbox", variant: "success" }) },
          })
        }
      >
        Archive (with Undo)
      </Button>
      <Button onClick={() => toast("Saved")}>Plain</Button>
      <Button onClick={() => toast({ title: "Link copied", description: "https://example.com/s/x7Kq", variant: "success" })}>Success</Button>
      <Button onClick={() => toast({ title: "Usage updated", description: "1,204 of 2,000 requests used", variant: "info" })}>Info</Button>
      <Button onClick={() => toast({ title: "Storage 84% full", variant: "warning" })}>Warning</Button>
      <Button onClick={() => toast({ title: "Sync failed", description: "HTTP 502 from the server", variant: "destructive" })}>
        Destructive (stays)
      </Button>
      <Button
        variant="ghost"
        onClick={() =>
          toast({
            title: "A long title that wraps onto a second line, because it says more than a toast should",
            description: "And a description that is also on the long side, to see how the box grows.",
            action: { label: "Open", onClick: () => {} },
            duration: 0,
          })
        }
      >
        Long text
      </Button>
    </div>
  ),
};

export const Phone: Story = { ...Playground, parameters: { viewport: { defaultViewport: "iphoneSE" } } };
