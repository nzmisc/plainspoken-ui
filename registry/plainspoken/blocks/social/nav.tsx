"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { ArrowLeft, Bell, Ellipsis, Feather, House, LogOut, MessagesSquare, Search, Settings, User as UserIcon } from "@/registry/plainspoken/lib/icons";
import { FOCUS_RING } from "@/registry/plainspoken/lib/controls";
import { Avatar } from "@/registry/plainspoken/ui/avatar";
import { Button, IconButton } from "@/registry/plainspoken/ui/button";
import { DropdownMenu } from "@/registry/plainspoken/ui/dropdown-menu";
import { Icon } from "@/registry/plainspoken/ui/icon";
import { Sidebar, type SidebarSection } from "@/registry/plainspoken/ui/sidebar";
import { toast } from "@/registry/plainspoken/ui/toast";
import { useCompose } from "@/registry/plainspoken/blocks/social/composer";
import { APP_NAME, ME, NOTIFICATIONS, SOCIAL_BASE, hrefFor, userBy } from "@/registry/plainspoken/blocks/social/data";
import { cn } from "@/lib/utils";

const UNREAD = NOTIFICATIONS.filter((n) => n.minutesAgo < 120).length;

const LINKS = [
  { key: "home", label: "Home", href: SOCIAL_BASE, icon: House },
  { key: "explore", label: "Explore", href: `${SOCIAL_BASE}/explore`, icon: Search },
  { key: "notifications", label: "Notifications", href: `${SOCIAL_BASE}/notifications`, icon: Bell, badge: UNREAD, badgeLabel: `${UNREAD} new` },
  { key: "profile", label: "Profile", href: hrefFor.user(ME), icon: UserIcon },
];

/** Which nav item the path belongs to: an exact section, or your own profile */
function currentKey(pathname: string): string | undefined {
  const rest = pathname.slice(SOCIAL_BASE.length);
  if (rest === "" || rest === "/") return "home";
  if (rest.startsWith("/explore")) return "explore";
  if (rest.startsWith("/notifications")) return "notifications";
  if (rest === `/u/${ME}`) return "profile";
  return undefined;
}

/** The app's name and mark */
export function SocialBrand({ className }: { className?: string }) {
  return (
    <Link
      href={SOCIAL_BASE}
      className={cn("inline-flex items-center gap-1.5 text-[17px] font-bold text-foreground no-underline visited:text-foreground", FOCUS_RING, className)}
    >
      <Icon icon={MessagesSquare} />
      {APP_NAME}
    </Link>
  );
}

/** You, at the foot of the nav: picture, name and handle, and a menu with settings and log out */
function Account({ rail }: { rail: boolean }) {
  const me = userBy(ME);
  const router = useRouter();
  return (
    <div className={cn("flex items-center gap-2", rail && "justify-center")}>
      <Avatar name={me.name} size={rail ? 24 : 32} />
      {!rail && (
        <span className="flex min-w-0 flex-1 flex-col leading-tight">
          <b className="truncate text-foreground">{me.name}</b>
          <span className="truncate">@{me.handle}</span>
        </span>
      )}
      {!rail && (
        <DropdownMenu
          trigger={Ellipsis}
          label="Account"
          triggerVariant="ghost"
          size="sm"
          side="top"
          align="end"
          items={[
            { label: "Your profile", icon: UserIcon, onSelect: () => router.push(hrefFor.user(ME)) },
            { label: "Settings", icon: Settings, onSelect: () => toast("Settings are not in this demo") },
            { type: "separator" },
            { label: `Log out @${me.handle}`, icon: LogOut, onSelect: () => toast("You can't log out of a demo") },
          ]}
        />
      )}
    </div>
  );
}

/**
 * The left column: the app's name, Home, Explore, Notifications (with a count of new ones) and
 * your Profile, a big Post button, and your account at the foot. With `rail` it narrows to icons
 * (the Post button becomes a ✎), for medium screens.
 */
export function SocialSidebar({ rail = false, className }: { rail?: boolean; className?: string }) {
  const pathname = usePathname();
  const compose = useCompose();
  const sections: SidebarSection[] = [{ key: "main", items: LINKS }];
  return (
    <Sidebar
      label={APP_NAME}
      rail={rail}
      sections={sections}
      current={currentKey(pathname)}
      linkAs={Link}
      header={(r) =>
        r ? (
          <div className="flex flex-col items-center gap-2">
            <Link href={SOCIAL_BASE} aria-label={`${APP_NAME} home`} className={cn("text-foreground visited:text-foreground", FOCUS_RING)}>
              <Icon icon={MessagesSquare} size={20} />
            </Link>
            <IconButton variant="primary" icon={Feather} label="Post" onClick={() => compose?.compose()} />
          </div>
        ) : (
          <div className="flex flex-col gap-2 px-1 py-1">
            <SocialBrand />
            <Button variant="primary" size="lg" block icon={Feather} onClick={() => compose?.compose()}>
              Post
            </Button>
          </div>
        )
      }
      footer={(r) => <Account rail={r} />}
      className={cn("[&_li>a]:min-h-9 [&_li>a]:text-[15px]", rail ? "w-12" : "w-60", className)}
    />
  );
}

/**
 * The phone's navigation: four icons along the bottom, each with a small label, the current one
 * bold with a bar on top; Notifications carries a dot and its count for screen readers.
 */
export function SocialBottomNav({ className }: { className?: string }) {
  const pathname = usePathname();
  const current = currentKey(pathname);
  return (
    <nav aria-label={APP_NAME} className={cn("border-t border-border bg-background pb-[env(safe-area-inset-bottom)]", className)}>
      <ul className="grid grid-cols-4">
        {LINKS.map((l) => {
          const on = current === l.key;
          return (
            <li key={l.key}>
              <Link
                href={l.href}
                aria-current={on ? "page" : undefined}
                className={cn(
                  "relative flex h-12 flex-col items-center justify-center gap-0.5 text-[11px] no-underline",
                  on
                    ? "font-bold text-foreground visited:text-foreground before:absolute before:inset-x-5 before:top-0 before:h-0.5 before:bg-foreground"
                    : "text-muted-foreground visited:text-muted-foreground",
                  FOCUS_RING,
                  "focus-visible:-outline-offset-2",
                )}
              >
                <span className="relative">
                  <Icon icon={l.icon} size={20} />
                  {l.badge ? <span aria-hidden className="absolute -top-0.5 -right-1 size-2 bg-foreground" /> : null}
                </span>
                {l.label}
                {l.badge ? <span className="sr-only">, {l.badgeLabel}</span> : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export interface PageHeaderProps {
  title: ReactNode;
  /** Small line under the title: "214 posts" */
  subtitle?: ReactNode;
  /** Show a back arrow to here */
  backHref?: string;
  /** Right side: a settings button, a menu */
  actions?: ReactNode;
  className?: string;
}

/**
 * The bar at the top of the middle column, which stays put while the posts scroll: a back arrow
 * on pages you reach from somewhere, the page's title (its h1), and a line under it.
 */
export function PageHeader({ title, subtitle, backHref, actions, className }: PageHeaderProps) {
  return (
    <div
      className={cn(
        "sticky top-(--demo-bar,0px) z-20 flex min-h-12 items-center gap-3 border-b border-border bg-background/95 px-3 backdrop-blur-sm",
        className,
      )}
    >
      {backHref && (
        <Link
          href={backHref}
          aria-label="Back"
          title="Back"
          className={cn("inline-flex size-8 items-center justify-center text-foreground visited:text-foreground hover:bg-secondary", FOCUS_RING)}
        >
          <Icon icon={ArrowLeft} size={18} />
        </Link>
      )}
      <div className="flex min-w-0 flex-1 flex-col leading-tight">
        <h1 className="truncate text-[17px] font-bold">{title}</h1>
        {subtitle && <p className="truncate text-[13px] text-muted-foreground">{subtitle}</p>}
      </div>
      {actions}
    </div>
  );
}
