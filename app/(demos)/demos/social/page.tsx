import type { Metadata } from "next";
import { Timeline } from "@/registry/plainspoken/blocks/social/timeline";

export const metadata: Metadata = {
  title: "Home",
  description: "The social demo's home timeline: For you and Following, with a composer on top.",
};

export default function SocialHome() {
  return (
    <>
      <h1 className="sr-only">Home</h1>
      <Timeline />
    </>
  );
}
