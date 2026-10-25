import { Avatar, AvatarGroup } from "@/registry/plainspoken/ui/avatar";

/** Side by side, each ringed in the background colour; past max a "+3" box names the rest on hover. */
export default function AvatarGroupExample() {
  return (
    <div className="flex flex-col gap-3">
      <p className="flex items-center gap-2">
        <AvatarGroup label="Editing now" max={3}>
          <Avatar name="Amara Okafor" />
          <Avatar name="Jonas Weber" />
          <Avatar name="Li Wei" />
          <Avatar name="María González" />
          <Avatar name="Noah Fischer" />
        </AvatarGroup>
        <span className="text-muted-foreground">5 people editing</span>
      </p>
      <AvatarGroup label="Reviewers" size={24}>
        <Avatar name="Sofia Rossi" />
        <Avatar name="Jonas Weber" />
      </AvatarGroup>
    </div>
  );
}
