import { Avatar, AvatarGroup } from "@/registry/plainspoken/ui/avatar";

/** Square by default; `shape="circle"` for apps where people are round by custom. A group passes its shape on, "+2" box included. */
export default function AvatarShapes() {
  return (
    <div className="flex flex-col gap-3">
      <p className="flex flex-wrap items-center gap-3">
        <Avatar name="Amara Okafor" />
        <Avatar name="Amara Okafor" shape="circle" />
        <Avatar name="Jonas Weber" size={36} />
        <Avatar name="Jonas Weber" size={36} shape="circle" />
      </p>
      <AvatarGroup label="Assigned" shape="circle" max={3}>
        <Avatar name="Li Wei" />
        <Avatar name="María González" />
        <Avatar name="Noah Fischer" />
        <Avatar name="Sofia Rossi" />
        <Avatar name="Jonas Weber" />
      </AvatarGroup>
    </div>
  );
}
