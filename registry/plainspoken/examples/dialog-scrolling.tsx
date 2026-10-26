"use client";

import { useState } from "react";
import { Button } from "@/registry/plainspoken/ui/button";
import { Dialog } from "@/registry/plainspoken/ui/dialog";

const RELEASES = [
  { version: "4.2.0", date: "14 October 2026", notes: ["Shared inboxes can have their own signature.", "Search finds words inside PDF attachments.", "Snoozed threads show when they come back."] },
  { version: "4.1.3", date: "30 September 2026", notes: ["Fixed: drafts saved twice when the connection dropped.", "Fixed: the unread count was off by one after archiving from a notification."] },
  { version: "4.1.0", date: "9 September 2026", notes: ["Rules can move mail to a folder and mark it read in one step.", "Keyboard: e archives, # deletes, ⇧U marks unread.", "Calendar invites show the organiser's time zone next to yours."] },
  { version: "4.0.2", date: "21 August 2026", notes: ["Faster start-up on large mailboxes.", "Fixed: images in replies were sometimes sent as attachments."] },
  { version: "4.0.0", date: "4 August 2026", notes: ["A new three-pane layout you can resize.", "Threads group replies from every folder, not just the inbox.", "Dark mode follows the system setting.", "Older than two years: archived automatically, unless you turn it off."] },
];

/** A long body scrolls on its own; the title bar and the buttons stay where they are. */
export default function DialogScrolling() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>What&apos;s new</Button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="What's new in Mail"
        description="The last five releases"
        footer={
          <>
            <a href="#changelog" className="mr-auto text-link underline visited:text-link-visited">
              Full changelog
            </a>
            <Button variant="primary" onClick={() => setOpen(false)}>
              Got it
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          {RELEASES.map((r) => (
            <section key={r.version}>
              <h3 className="font-bold">
                {r.version} <span className="font-normal text-muted-foreground">· {r.date}</span>
              </h3>
              <ul className="mt-1 list-disc pl-5">
                {r.notes.map((n) => (
                  <li key={n}>{n}</li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </Dialog>
    </>
  );
}
