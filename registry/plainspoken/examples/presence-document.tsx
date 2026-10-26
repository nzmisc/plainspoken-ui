"use client";

import { useRef, useState } from "react";
import { BlockMarks, DomCursors, type Collaborator } from "@/registry/plainspoken/ui/presence";
import { Prose } from "@/registry/plainspoken/ui/prose";

const JONAS: Collaborator = { id: "jonas", name: "Jonas Weber", color: 2 };
const PRIYA: Collaborator = { id: "priya", name: "Priya Nair", color: 4 };

/**
 * Presence over HTML text: a caret and a selection placed with DOM Ranges, and a mark beside the
 * paragraph Jonas is in, with his name in the gutter. The wrapper leaves room for it on the right.
 */
export default function PresenceDocument() {
  const box = useRef<HTMLDivElement>(null);
  // State, not refs: the marks are placed once the paragraphs exist
  const [first, setFirst] = useState<HTMLParagraphElement | null>(null);
  const [second, setSecond] = useState<HTMLParagraphElement | null>(null);
  return (
    <div ref={box} className="relative max-w-2xl border border-border py-2 pr-32 pl-4">
      <Prose>
        <p ref={setFirst}>The spring sale starts on Friday 14 March at 09:00. This page is the one list of what has to be ready, and who owns it.</p>
        <p ref={setSecond}>Amara watches the order dashboard from 08:30. If checkout errors rise above 2%, we pause the sale banner.</p>
      </Prose>
      <DomCursors
        container={box}
        cursors={[
          { person: JONAS, element: first, start: 44, end: 44 },
          { person: PRIYA, element: second, start: 18, end: 33, label: "Priya (reading)" },
        ]}
        version={!!(first && second)}
      />
      <BlockMarks container={box} marks={[{ person: JONAS, element: first }]} version={!!first} />
    </div>
  );
}
