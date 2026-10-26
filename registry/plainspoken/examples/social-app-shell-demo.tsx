import { RightRail } from "@/registry/plainspoken/blocks/social/app-shell";

/**
 * The right-hand column of the app frame on wide screens: search (which goes to Explore), trends
 * and suggestions. SocialApp puts it beside the nav and the page; see the demo for the whole frame.
 */
export default function SocialAppShellDemo() {
  return <RightRail className="max-w-[350px]" />;
}
