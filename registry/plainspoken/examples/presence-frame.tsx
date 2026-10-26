"use client";

import { useState } from "react";
import { Textarea } from "@/registry/plainspoken/ui/textarea";
import { PresenceFrame, type Collaborator } from "@/registry/plainspoken/ui/presence";

const JONAS: Collaborator = { id: "jonas", name: "Jonas Weber", color: 2 };

/**
 * A ring in someone's colour around the field they're in, with a tag on it. The field points at
 * the tag (aria-describedby), so focusing it says who else is there. Your own focus ring still shows.
 */
export default function PresenceFrameExample() {
  const [text, setText] = useState("Customers who change the delivery address after checkout still get the old address in the confirmation email.");
  return (
    <div className="flex max-w-xl flex-col gap-1 pt-1">
      <label htmlFor="presence-frame-field" className="text-[14px] font-semibold">
        Description
      </label>
      <PresenceFrame person={JONAS} label="Jonas is typing…" labelId="presence-frame-tag">
        <Textarea id="presence-frame-field" aria-describedby="presence-frame-tag" value={text} onChange={(e) => setText(e.target.value)} />
      </PresenceFrame>
    </div>
  );
}
