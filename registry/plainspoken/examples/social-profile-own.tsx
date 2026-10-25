import { ProfileHeader } from "@/registry/plainspoken/blocks/social/profile";

/** Your own profile has "Edit profile", which opens a dialog of fields. */
export default function SocialProfileOwn() {
  return (
    <div className="max-w-[600px] border border-border">
      <ProfileHeader handle="robin" />
    </div>
  );
}
