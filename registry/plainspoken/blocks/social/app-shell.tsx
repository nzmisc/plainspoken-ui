"use client";

import Form from "next/form";
import Link from "next/link";
import type { ReactNode } from "react";
import { Feather, Search } from "@/registry/plainspoken/lib/icons";
import { IconButton } from "@/registry/plainspoken/ui/button";
import { Input } from "@/registry/plainspoken/ui/input";
import { Toaster } from "@/registry/plainspoken/ui/toast";
import { ComposeProvider, useCompose } from "@/registry/plainspoken/blocks/social/composer";
import { SocialBottomNav, SocialSidebar } from "@/registry/plainspoken/blocks/social/nav";
import { TrendsPanel } from "@/registry/plainspoken/blocks/social/trends";
import { WhoToFollow } from "@/registry/plainspoken/blocks/social/user";
import { APP_NAME, SOCIAL_BASE, suggestions } from "@/registry/plainspoken/blocks/social/data";
import { cn } from "@/lib/utils";

/** The search box that goes to Explore with ?q= (a real GET form, so it works before the page is interactive) */
export function SearchBox({ defaultValue, autoFocus, className }: { defaultValue?: string; autoFocus?: boolean; className?: string }) {
  return (
    <Form action={`${SOCIAL_BASE}/explore`} role="search" className={className}>
      <Input
        type="search"
        name="q"
        size="lg"
        prefix={Search}
        placeholder={`Search ${APP_NAME}`}
        aria-label={`Search ${APP_NAME}`}
        defaultValue={defaultValue}
        autoFocus={autoFocus}
        className="w-full"
      />
    </Form>
  );
}

/** The right-hand column on wide screens: search, what's happening, who to follow, and the small print */
export function RightRail({ search = true, className }: { search?: boolean; className?: string }) {
  return (
    <aside aria-label="Trends and suggestions" className={cn("flex flex-col gap-3", className)}>
      {search && <SearchBox />}
      <TrendsPanel />
      <WhoToFollow handles={suggestions(3).map((u) => u.handle)} moreHref={`${SOCIAL_BASE}/explore`} />
      <p className="px-1 text-[12px] leading-relaxed text-muted-foreground">
        A demo of plainspoken-ui. Everyone here is made up.{" "}
        <Link href="/demos" className="text-muted-foreground underline visited:text-muted-foreground hover:text-foreground">
          More demos
        </Link>
      </p>
    </aside>
  );
}

function ComposeFab() {
  const compose = useCompose();
  return (
    <IconButton
      variant="primary"
      size="lg"
      icon={Feather}
      label="New post"
      onClick={() => compose?.compose()}
      className="fixed right-4 bottom-[calc(3.5rem+env(safe-area-inset-bottom)+0.75rem)] z-30 size-12 shadow-md md:hidden [&_svg]:size-5"
    />
  );
}

export interface SocialAppProps {
  children: ReactNode;
  className?: string;
}

/**
 * The microblog's frame, three columns on wide screens: the nav on the left (icons only on
 * medium screens), the page in a 600px column, and search, trends and suggestions on the right.
 * Phones get one column, a tab bar along the bottom and a round-the-corner ✎ button to post. The
 * page scrolls the window; the side columns stay put (under a bar of height --demo-bar, if set). Holds the compose dialog and the toasts.
 */
export function SocialApp({ children, className }: SocialAppProps) {
  return (
    <ComposeProvider>
      <div
        data-slot="social-app"
        className={cn("mx-auto flex min-h-[calc(100dvh-var(--demo-bar,0px))] max-w-[1265px] justify-center bg-background text-foreground", className)}
      >
        <div className="sticky top-(--demo-bar,0px) hidden h-[calc(100dvh-var(--demo-bar,0px))] shrink-0 md:flex">
          <SocialSidebar rail className="xl:hidden" />
          <SocialSidebar className="max-xl:hidden" />
        </div>
        <main className="w-full max-w-[600px] min-w-0 border-border pb-16 sm:border-x md:pb-0">{children}</main>
        <div className="sticky top-(--demo-bar,0px) hidden h-[calc(100dvh-var(--demo-bar,0px))] w-80 shrink-0 overflow-y-auto p-3 lg:block xl:w-[350px]">
          <RightRail />
        </div>
      </div>
      <SocialBottomNav className="fixed inset-x-0 bottom-0 z-30 md:hidden" />
      <ComposeFab />
      <Toaster />
    </ComposeProvider>
  );
}
