import { Facepile, type Collaborator } from "@/registry/plainspoken/ui/presence";

const JONAS: Collaborator = { id: "jonas", name: "Jonas Weber", color: 2 };
const PRIYA: Collaborator = { id: "priya", name: "Priya Nair", color: 4 };
const TOMAS: Collaborator = { id: "tomas", name: "Tomás Rey", color: 3 };

/** Who else has it open, each in their colour; faded when they've gone quiet, and their status in each avatar's name. */
export default function PresenceDemo() {
  return (
    <div className="flex flex-col gap-3">
      <Facepile
        people={[{ person: JONAS, status: "typing" }, { person: PRIYA, status: "viewing" }, { person: TOMAS, status: "idle for 5 minutes", away: true }]}
        caption="Jonas is typing…"
      />
      <Facepile people={[]} />
    </div>
  );
}
