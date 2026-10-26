import { AppFrame } from "@/registry/plainspoken/blocks/app/frame";
import { AppStats } from "@/registry/plainspoken/blocks/app/stats";

/**
 * The frame in a 560px box, with a page in it. Search (or Ctrl+K / ⌘K) opens the palette, the bell
 * the notifications, the avatar the account menu; the menu button hides the sidebar and Collapse
 * narrows it to a rail. The links go to the demo's pages.
 */
export default function AppFrameDemo() {
  return (
    <AppFrame className="h-[560px] border border-border">
      <div className="p-4">
        <h1 className="mb-3 text-[22px] font-bold">Dashboard</h1>
        <AppStats columns={2} />
      </div>
    </AppFrame>
  );
}
