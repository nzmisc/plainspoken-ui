import Link from "next/link";
import { DEMOS } from "@/lib/demos";
import { REPO_URL } from "@/lib/site";

/** Height of the bar, for demos that fill the rest of the screen: h-[calc(100dvh-var(--demo-bar))] */
export const DEMO_BAR_HEIGHT = "29px";

/**
 * The thin strip above every demo: what you're looking at, where its code is, and the way back.
 * Demos are whole apps with their own chrome, so this stays out of the way.
 */
export function DemoBar({ slug }: { slug: string }) {
  const demo = DEMOS.find((d) => d.slug === slug);
  return (
    <div className="flex h-[29px] items-center gap-2 overflow-x-auto border-b border-border bg-muted px-3 text-[12px] whitespace-nowrap sm:gap-3">
      <Link href="/" className="font-mono font-bold text-foreground no-underline">
        plainspoken-ui
      </Link>
      <span className="text-muted-foreground max-sm:hidden">demo:</span>
      <span className="font-semibold">{demo?.title ?? slug}</span>
      <span className="ml-auto flex gap-2 sm:gap-3">
        <Link href="/demos" className="text-link underline visited:text-link-visited">
          All demos
        </Link>
        <Link href="/docs/blocks" className="text-link underline visited:text-link-visited">
          Its blocks
        </Link>
        <a href={`${REPO_URL}/tree/main/app/(demos)/demos/${slug}`} className="text-link underline visited:text-link-visited">
          Source
        </a>
      </span>
    </div>
  );
}
