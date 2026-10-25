"use client";

import { useRef, useState } from "react";
import { Textarea } from "@/registry/plainspoken/ui/textarea";
import { TextareaCursors, type Collaborator } from "@/registry/plainspoken/ui/presence";

const JONAS: Collaborator = { id: "jonas", name: "Jonas Weber", color: 2 };
const PRIYA: Collaborator = { id: "priya", name: "Priya Nair", color: 4 };

const TEXT = "It happens on web and in the app. Expected: the email is sent again with the new address, or the change is blocked once the parcel is packed.";

/**
 * Other people's carets and selections over a textarea, placed from offsets. Type: the marks
 * stay on their characters only if you move the offsets with the text (lib/diff's mapSelection
 * does that); here they stay put, as a plain illustration.
 */
export default function PresenceCursors() {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [text, setText] = useState(TEXT);
  const at = (find: string) => Math.max(0, text.indexOf(find));
  return (
    // The wrapper is exactly the textarea's box: the marks are placed relative to it
    <div className="relative max-w-xl">
      <Textarea ref={ref} aria-label="Description" rows={4} value={text} onChange={(e) => setText(e.target.value)} />
      <TextareaCursors
        textarea={ref}
        value={text}
        cursors={[
          { person: JONAS, start: at("in the app") + 7, end: at("in the app") + 7, label: "Jonas typing" },
          { person: PRIYA, start: at("new address"), end: at("new address") + 11 },
        ]}
      />
    </div>
  );
}
