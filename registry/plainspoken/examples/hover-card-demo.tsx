"use client";

import { useState } from "react";
import { Avatar } from "@/registry/plainspoken/ui/avatar";
import { Button } from "@/registry/plainspoken/ui/button";
import { HoverCard, HoverCardActions, HoverCardFacts } from "@/registry/plainspoken/ui/hover-card";

const PEOPLE = {
  ada: { name: "Ada Okonkwo", handle: "ada", bio: "Builds trains in Lisbon. Writes about timetables, rolling stock and the joy of a well-run interchange.", joined: "March 2019", following: 312, followers: 4810 },
  lukas: { name: "Lukas Brandt", handle: "lbrandt", bio: "Type designer. Currently drawing a grotesque with too many weights.", joined: "July 2021", following: 98, followers: 1207 },
};

function ProfileCard({ who }: { who: keyof typeof PEOPLE }) {
  const p = PEOPLE[who];
  const [following, setFollowing] = useState(false);
  return (
    <>
      <span className="flex gap-3 px-3 pt-3">
        <Avatar name={p.name} size={44} />
        <span className="flex min-w-0 flex-col">
          <b>{p.name}</b>
          <span className="text-muted-foreground">@{p.handle}</span>
        </span>
      </span>
      <span className="block px-3 pt-2">{p.bio}</span>
      <HoverCardFacts
        rows={[
          ["Joined", p.joined],
          ["Followers", <span key="f" className="tabular-nums">{(p.followers + (following ? 1 : 0)).toLocaleString("en-GB")}</span>],
        ]}
      />
      <HoverCardActions>
        <a href={`#@${p.handle}`} className="text-link underline visited:text-link-visited">
          Profile
        </a>
        <Button size="sm" variant={following ? "default" : "primary"} className="ml-auto" aria-pressed={following} onClick={() => setFollowing(!following)}>
          {following ? "Following" : "Follow"}
        </Button>
      </HoverCardActions>
    </>
  );
}

const handle = "text-link underline visited:text-link-visited";

/** Profiles behind names in a post. Hover a name, or Tab to it and then Tab on into the card; on a phone, the first tap opens the card. */
export default function HoverCardDemo() {
  return (
    <p className="max-w-prose">
      Lovely evening at the type meetup with{" "}
      <HoverCard label="Ada Okonkwo's profile" card={<ProfileCard who="ada" />}>
        <a href="#@ada" className={handle}>
          @ada
        </a>
      </HoverCard>{" "}
      and{" "}
      <HoverCard label="Lukas Brandt's profile" card={<ProfileCard who="lukas" />}>
        <a href="#@lbrandt" className={handle}>
          @lbrandt
        </a>
      </HoverCard>
      . Slides are up tomorrow.
    </p>
  );
}
