import type { Metadata } from "next";
import { DemoBar } from "@/components/site/demo-bar";
import { AUTHOR } from "@/content/blog/site";
import { BlogFrame } from "./_views";

export const metadata: Metadata = {
  title: { template: `%s · ${AUTHOR.name}`, default: AUTHOR.name },
  description: AUTHOR.tagline,
};

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <DemoBar slug="blog" />
      <BlogFrame>{children}</BlogFrame>
    </>
  );
}
