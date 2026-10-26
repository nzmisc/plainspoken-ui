import type { Metadata } from "next";
import { siteUrl } from "@/lib/site";
import { Customizer } from "@/components/site/customizer/customizer";
import { previewFontVariables } from "@/components/site/customizer/fonts";

export const metadata: Metadata = {
  title: "Customize",
  description:
    "Make a plainspoken-ui theme: pick a base gray, a main colour, link colours and fonts, see them on real components, check the contrast, and copy the CSS or a shadcn command.",
  alternates: { canonical: "/customize" },
};

export default function Customize() {
  return (
    <main className={`mx-auto max-w-[1240px] px-4 pt-6 ${previewFontVariables}`}>
      <h1 className="text-[28px] leading-tight font-bold tracking-tight">Customize</h1>
      <p className="mt-2 mb-6 max-w-[80ch] text-[16px] text-muted-foreground">
        Pick a base gray, a main colour, link colours and fonts. The preview is made of the real components; under it are the
        contrast checks and the CSS or shadcn command that make it your theme. The choices are kept in the address, so the link is
        the theme.
      </p>
      <Customizer siteOrigin={siteUrl()} />
    </main>
  );
}
