import { PROJECTS } from "@/registry/plainspoken/blocks/app/data";
import { AppProjectCard } from "@/registry/plainspoken/blocks/app/project-card";

/** On track, nearly out of budget, and over budget. */
export default function AppProjectCardDemo() {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {["p-fjord-catalogue", "p-pinecrest-booking", "p-harbor-winter"].map((id) => (
        <AppProjectCard key={id} project={PROJECTS.find((p) => p.id === id)!} />
      ))}
    </div>
  );
}
