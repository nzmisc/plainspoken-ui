import { WhoToFollow } from "@/registry/plainspoken/blocks/social/user";

/** People to follow, with bios. Hover a name (or Tab to it) for the profile card; Follow turns into Following. */
export default function SocialUserDemo() {
  return <WhoToFollow bio handles={["grace", "aiko", "linnea", "felix"]} moreHref="#" className="max-w-sm" />;
}
