"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export interface DocsNavSection {
  title: string;
  items: { href: string; label: string }[];
}

/** The docs sidebar: headed lists of links, the current page bold with a bar on its left. */
export function DocsNav({ sections }: { sections: DocsNavSection[] }) {
  const path = usePathname();
  return (
    <nav aria-label="Docs" className="flex flex-col gap-4 text-[14px]">
      {sections.map((s) => (
        <div key={s.title}>
          <h2 className="mb-1 text-[12px] font-semibold tracking-wide text-muted-foreground uppercase">{s.title}</h2>
          <ul className="flex flex-col">
            {s.items.map((item) => {
              const on = path === item.href;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={on ? "page" : undefined}
                    className={cn(
                      "-ml-2 block border-l-2 py-0.5 pl-2 text-foreground no-underline hover:underline",
                      on ? "border-foreground bg-muted font-semibold" : "border-transparent",
                    )}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
