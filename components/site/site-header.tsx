import Link from "next/link";
import { REPO_URL } from "@/lib/site";
import { ThemeToggle } from "@/components/site/theme";
import { SiteNav } from "@/components/site/site-nav";

/** The bar on every docs page: name, sections, theme. Wraps onto two lines on phones. */
export function SiteHeader() {
  return (
    <header className="border-b border-border bg-background">
      <div className="mx-auto flex max-w-[1240px] flex-wrap items-center gap-x-6 gap-y-1 px-4 py-2">
        <Link href="/" className="font-mono text-[15px] font-bold text-foreground no-underline">
          plainspoken-ui
        </Link>
        <SiteNav
          items={[
            { href: "/docs", label: "Docs" },
            { href: "/docs/components", label: "Components" },
            { href: "/customize", label: "Customize" },
            { href: "/demos", label: "Demos" },
            { href: "/storybook/index.html", label: "Storybook", external: true },
            { href: REPO_URL, label: "GitHub", external: true },
          ]}
        />
        <div className="ml-auto">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-border">
      <div className="mx-auto flex max-w-[1240px] flex-wrap gap-x-6 gap-y-1 px-4 py-4 text-[13px] text-muted-foreground">
        <span>plainspoken-ui · MIT license</span>
        <span>
          Icons from{" "}
          <a className="text-link underline visited:text-link-visited" href="https://lucide.dev">
            Lucide
          </a>{" "}
          (ISC), copied in. Token names and base grays from{" "}
          <a className="text-link underline visited:text-link-visited" href="https://ui.shadcn.com">
            shadcn/ui
          </a>{" "}
          (MIT).
        </span>
      </div>
    </footer>
  );
}
