import { SiteFooter, SiteHeader } from "@/components/site/site-header";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:bg-background focus:p-2">
        Skip to content
      </a>
      <SiteHeader />
      <div id="main">{children}</div>
      <SiteFooter />
    </>
  );
}
