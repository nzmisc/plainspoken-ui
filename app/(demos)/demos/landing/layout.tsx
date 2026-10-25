import type { Metadata } from "next";
import { DemoBar } from "@/components/site/demo-bar";
import { PRODUCT } from "@/content/landing/content";
import { LandingFrame } from "./_views";

export const metadata: Metadata = {
  title: { template: `%s · ${PRODUCT.name}`, default: PRODUCT.name },
  description: PRODUCT.description,
};

export default function LandingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <DemoBar slug="landing" />
      <LandingFrame>{children}</LandingFrame>
    </>
  );
}
