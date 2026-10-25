"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AudioLines, Disc3, Heart, House, Library, Search } from "@/registry/plainspoken/lib/icons";
import { FOCUS_RING } from "@/registry/plainspoken/lib/controls";
import { Icon } from "@/registry/plainspoken/ui/icon";
import { Kbd } from "@/registry/plainspoken/ui/kbd";
import { Sidebar, type SidebarSection } from "@/registry/plainspoken/ui/sidebar";
import { Artwork } from "@/registry/plainspoken/blocks/music/artwork";
import { useLibrary, usePlayer } from "@/registry/plainspoken/blocks/music/player-provider";
import { APP_NAME, MUSIC_BASE, hrefFor, playlistById } from "@/registry/plainspoken/blocks/music/data";
import { cn } from "@/lib/utils";

const MAIN = [
  { key: "home", label: "Home", href: MUSIC_BASE, icon: House },
  { key: "search", label: "Search", href: `${MUSIC_BASE}/search`, icon: Search },
  { key: "library", label: "Your Library", href: `${MUSIC_BASE}/library`, icon: Library },
];

/** The app's name with its mark, for the top of the sidebar */
export function MusicBrand({ className }: { className?: string }) {
  return (
    <Link
      href={MUSIC_BASE}
      className={cn("flex items-center gap-1.5 text-[16px] font-bold text-foreground no-underline visited:text-foreground", FOCUS_RING, className)}
    >
      <Icon icon={Disc3} />
      {APP_NAME}
    </Link>
  );
}

/**
 * The music app's sidebar: Home, Search and Your Library, then Liked Songs and the playlists in
 * the library, each with its cover. The playlist that is playing gets a small sound-wave mark
 * (read out as "playing"). Hidden on phones, where MusicTabBar takes over.
 */
export function MusicSidebar({ className }: { className?: string }) {
  const pathname = usePathname();
  const lib = useLibrary();
  const p = usePlayer();
  const playing = (kind: "playlist" | "liked", id: string) =>
    p.isContext(kind, id) ? { badge: <Icon icon={AudioLines} className={cn(!p.playing && "opacity-50")} />, badgeLabel: p.playing ? "playing" : "paused" } : {};
  const sections: SidebarSection[] = [
    { key: "main", items: MAIN },
    {
      key: "playlists",
      heading: "Playlists",
      items: [
        { key: "liked", label: "Liked Songs", href: hrefFor.playlist("liked"), icon: Heart, ...playing("liked", "liked") },
        ...lib.playlists.flatMap((id) => {
          const pl = playlistById(id);
          if (!pl) return [];
          return [{ key: id, label: pl.title, href: hrefFor.playlist(id), icon: <Artwork seed={id} size={16} />, ...playing("playlist", id) }];
        }),
      ],
    },
  ];
  // Worked out here rather than from the path's prefix, which would mark Home on every page
  const rest = pathname.slice(MUSIC_BASE.length);
  const current = rest === "" || rest === "/" ? "home" : rest.startsWith("/playlist/") ? rest.split("/")[2] : rest.split("/")[1];
  return (
    <Sidebar
      label="Music"
      sections={sections}
      current={current}
      linkAs={Link}
      header={<MusicBrand className="px-1" />}
      footer={
        <span>
          Press <Kbd>?</Kbd> for keyboard shortcuts
        </span>
      }
      className={cn("w-60", className)}
    />
  );
}

/**
 * The phone's navigation: Home, Search and Your Library as three big tabs along the bottom, icon
 * over label, the current one bold with a bar above it.
 */
export function MusicTabBar({ className }: { className?: string }) {
  const pathname = usePathname();
  const current = pathname.startsWith(`${MUSIC_BASE}/search`)
    ? "search"
    : pathname.startsWith(`${MUSIC_BASE}/library`)
      ? "library"
      : pathname === MUSIC_BASE
        ? "home"
        : undefined;
  return (
    <nav aria-label="Music" className={cn("shrink-0 border-t border-border bg-background pb-[env(safe-area-inset-bottom)]", className)}>
      <ul className="grid grid-cols-3">
        {MAIN.map((m) => {
          const on = current === m.key;
          return (
            <li key={m.key}>
              <Link
                href={m.href}
                aria-current={on ? "page" : undefined}
                className={cn(
                  "relative flex h-12 flex-col items-center justify-center gap-0.5 text-[12px] text-foreground no-underline visited:text-foreground",
                  on
                    ? "font-bold before:absolute before:inset-x-4 before:top-0 before:h-0.5 before:bg-foreground"
                    : "text-muted-foreground visited:text-muted-foreground",
                  FOCUS_RING,
                  "focus-visible:-outline-offset-2",
                )}
              >
                <Icon icon={m.icon} size={20} />
                {m.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
