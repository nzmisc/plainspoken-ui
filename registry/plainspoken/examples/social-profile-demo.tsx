import { ProfileHeader, ProfileTabs } from "@/registry/plainspoken/blocks/social/profile";

/** Someone else's profile: notify, follow and ⋯; under it their posts, replies, pictures and (private) likes. */
export default function SocialProfileDemo() {
  return (
    <div className="max-h-[640px] max-w-[600px] overflow-y-auto border border-border">
      <ProfileHeader handle="kwame" />
      <ProfileTabs handle="kwame" />
    </div>
  );
}
