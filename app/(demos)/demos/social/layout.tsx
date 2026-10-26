import type { Metadata } from "next";
import { DemoBar } from "@/components/site/demo-bar";
import { SocialApp } from "@/registry/plainspoken/blocks/social/app-shell";

export const metadata: Metadata = {
  title: { default: "Social", template: "%s · Social demo" },
  description: "A microblog built from plainspoken-ui: timeline, composer, threads, profiles, explore and notifications.",
};

export default function SocialLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* The window scrolls here, so the demo bar stays on top and the columns stick under it */}
      <div className="sticky top-0 z-40">
        <DemoBar slug="social" />
      </div>
      <SocialApp>{children}</SocialApp>
    </>
  );
}
