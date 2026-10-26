"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Dialog } from "@/registry/plainspoken/ui/dialog";
import { Kbd } from "@/registry/plainspoken/ui/kbd";
import { Toaster } from "@/registry/plainspoken/ui/toast";
import { MusicProvider, PLAYER_SHORTCUTS, usePlayerShortcuts, type MusicProviderProps } from "@/registry/plainspoken/blocks/music/player-provider";
import { MusicSidebar, MusicTabBar } from "@/registry/plainspoken/blocks/music/nav";
import { PlayerBar } from "@/registry/plainspoken/blocks/music/player-bar";
import { cn } from "@/lib/utils";

/** The keys the player answers to, in a small dialog */
export function ShortcutsDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Dialog open={open} onClose={onClose} title="Keyboard shortcuts" size="sm">
      <dl className="grid grid-cols-[auto_1fr] items-baseline gap-x-4 gap-y-1.5">
        {PLAYER_SHORTCUTS.map(([keys, what]) => (
          <div key={what} className="contents">
            <dt className="flex gap-1">
              {keys.map((k) => (
                <Kbd key={k}>{k}</Kbd>
              ))}
            </dt>
            <dd>{what}</dd>
          </div>
        ))}
      </dl>
    </Dialog>
  );
}

function Frame({ children, className }: { children: ReactNode; className?: string }) {
  const pathname = usePathname();
  const main = useRef<HTMLElement>(null);
  const [help, setHelp] = useState(false);
  usePlayerShortcuts(() => setHelp(true));
  // The layout stays mounted between pages, and so does the scrolled box: start each page at the top
  useEffect(() => {
    main.current?.scrollTo({ top: 0 });
  }, [pathname]);
  return (
    <div data-slot="music-app" className={cn("flex h-[calc(100dvh-var(--demo-bar,0px))] flex-col overflow-hidden bg-background text-foreground", className)}>
      <div className="flex min-h-0 flex-1">
        <MusicSidebar className="hidden md:flex" />
        <main ref={main} className="min-w-0 flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
      <PlayerBar onShowShortcuts={() => setHelp(true)} />
      <MusicTabBar className="md:hidden" />
      <ShortcutsDialog open={help} onClose={() => setHelp(false)} />
      <Toaster />
    </div>
  );
}

export interface MusicAppProps {
  children: ReactNode;
  /** What is loaded in the player to begin with */
  initial?: MusicProviderProps["initial"];
  className?: string;
}

/**
 * The music app's frame: the sidebar on the left (a tab bar along the bottom on phones), the page
 * scrolling on its own, and the player bar under everything. Holds the player, so put it in a
 * layout: pages change, the music doesn't stop. Fills the window less the demo bar's height.
 */
export function MusicApp({ children, initial, className }: MusicAppProps) {
  return (
    <MusicProvider initial={initial}>
      <Frame className={className}>{children}</Frame>
    </MusicProvider>
  );
}
