"use client";

import { useState } from "react";
import { Avatar, AvatarGroup } from "@/registry/plainspoken/ui/avatar";

const PEOPLE: [name: string, role: string][] = [
  ["Amara Okafor", "Editor"],
  ["Jonas Weber", "Photographer"],
  ["Li Wei", "Reporter"],
  ["María González", "Reporter"],
  ["Noah Fischer", "Sub-editor"],
  ["Sofia Rossi", "Designer"],
  ["Kenji Watanabe", "Data journalist"],
  ["Aisha Bello", "Reporter"],
  ["Lukas Novák", "Video producer"],
  ["Fatou Diop", "Fact-checker"],
  ["Mateo Silva", "Reporter"],
  ["Ingrid Berg", "Copy editor"],
  ["Rahim Chowdhury", "Developer"],
  ["Elena Popa", "Audience editor"],
  ["Tomasz Zieliński", "Photographer"],
  ["Nadia Haddad", "Reporter"],
  ["Oscar Lindgren", "Graphics"],
  ["Priya Iyer", "Podcast producer"],
  ["Samuel Mensah", "Reporter"],
  ["Yuki Hayashi", "Translator"],
];

/**
 * When the rest can run to dozens, `overflow="list"` makes the "+N" a button that opens everyone
 * in a popover: name, the avatar's `detail` underneath, a box to find someone past eight people.
 * With `onPersonSelect` each person is a button too.
 */
export default function AvatarGroupListExample() {
  const [chosen, setChosen] = useState<string | null>(null);
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <AvatarGroup
          label="Working on this story"
          listTitle="Working on this story: 20"
          shape="circle"
          max={5}
          overflow="list"
          onPersonSelect={(i) => setChosen(PEOPLE[i][0])}
          personLabel={(name) => `Message ${name}`}
        >
          {PEOPLE.map(([name, role]) => (
            <Avatar key={name} name={name} detail={role} />
          ))}
        </AvatarGroup>
        <span className="text-muted-foreground">20 people on this story</span>
      </div>
      <p aria-live="polite" className="text-[13px] text-muted-foreground">
        {chosen ? `You chose ${chosen}.` : "Choose someone, in the row or in the list."}
      </p>
    </div>
  );
}
