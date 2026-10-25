"use client";

import Link from "next/link";
import { AudioLines, ListMusic, X } from "@/registry/plainspoken/lib/icons";
import { Button, IconButton } from "@/registry/plainspoken/ui/button";
import { Drawer } from "@/registry/plainspoken/ui/drawer";
import { EmptyState } from "@/registry/plainspoken/ui/empty-state";
import { Icon } from "@/registry/plainspoken/ui/icon";
import { Artwork } from "@/registry/plainspoken/blocks/music/artwork";
import { usePlayer } from "@/registry/plainspoken/blocks/music/player-provider";
import { artistNames, clock, trackById } from "@/registry/plainspoken/blocks/music/data";
import { cn } from "@/lib/utils";

function QueueRow({ id, now, onPlay, onRemove }: { id: string; now?: boolean; onPlay?: () => void; onRemove?: () => void }) {
  const t = trackById(id);
  if (!t) return null;
  const body = (
    <>
      <Artwork seed={t.albumId} size={32} />
      <span className="flex min-w-0 flex-1 flex-col leading-tight">
        <span className={cn("truncate", now && "font-bold")}>{t.title}</span>
        <span className="truncate text-[13px] text-muted-foreground">{artistNames(t)}</span>
      </span>
      {now && <Icon icon={AudioLines} label="Now playing" className="shrink-0" />}
      <span className="shrink-0 text-[13px] text-muted-foreground tabular-nums">{clock(t.duration)}</span>
    </>
  );
  return (
    <li className="group flex items-center gap-1 hover:bg-secondary">
      {onPlay ? (
        <button
          type="button"
          onClick={onPlay}
          aria-label={`Play ${t.title} by ${artistNames(t)}`}
          className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 px-2 py-1 text-left focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
        >
          {body}
        </button>
      ) : (
        <div className="flex min-w-0 flex-1 items-center gap-2 px-2 py-1">{body}</div>
      )}
      {onRemove && <IconButton size="sm" variant="ghost" icon={X} label={`Remove ${t.title} from the queue`} onClick={onRemove} className="mr-1" />}
    </li>
  );
}

function Heading({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="flex min-h-7 items-center gap-2 border-b border-border px-2 pt-2 pb-1">
      <h3 className="min-w-0 flex-1 truncate text-[13px] font-bold">{children}</h3>
      {action}
    </div>
  );
}

/**
 * What plays now and next: the current track, the tracks added with "Add to queue" (each
 * removable, and the lot clearable), then the rest of the album or playlist that is playing.
 * Choosing a row plays it. Fits a drawer or a side panel.
 */
export function QueueList({ limit = 40, onNavigate }: { limit?: number; onNavigate?: () => void }) {
  const p = usePlayer();
  if (!p.current)
    return <EmptyState compact icon={ListMusic} title="The queue is empty" description="Play an album or a playlist, or add songs with “Add to queue”." />;
  const rest = p.order.slice(p.index + 1, p.index + 1 + limit);
  const wrap = p.repeat === "all" && p.index >= 0 ? p.order.slice(0, Math.max(0, limit - rest.length)).slice(0, p.index) : [];
  return (
    <div className="flex flex-col pb-2 text-[14px]">
      <Heading>Now playing</Heading>
      <ul>
        <QueueRow id={p.current} now />
      </ul>
      {p.upNext.length > 0 && (
        <>
          <Heading
            action={
              <Button size="xs" variant="ghost" onClick={p.clearQueue}>
                Clear queue
              </Button>
            }
          >
            Next in queue
          </Heading>
          <ul>
            {p.upNext.map((id, i) => (
              <QueueRow key={`${id}-${i}`} id={id} onPlay={() => p.jumpQueue(i)} onRemove={() => p.removeFromQueue(i)} />
            ))}
          </ul>
        </>
      )}
      {p.context && rest.length + wrap.length > 0 && (
        <>
          <Heading>
            Next from:{" "}
            {p.context.href ? (
              <Link href={p.context.href} onClick={onNavigate} className="text-foreground underline visited:text-foreground hover:decoration-2">
                {p.context.title}
              </Link>
            ) : (
              p.context.title
            )}
          </Heading>
          <ul>
            {rest.map((id, i) => (
              <QueueRow key={id} id={id} onPlay={() => p.jump(p.index + 1 + i)} />
            ))}
            {wrap.map((id, i) => (
              <QueueRow key={`wrap-${id}`} id={id} onPlay={() => p.jump(i)} />
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

export interface QueueDrawerProps {
  open: boolean;
  onClose: () => void;
}

/** The queue in a drawer from the right (a sheet from the bottom on phones). */
export function QueueDrawer({ open, onClose }: QueueDrawerProps) {
  return (
    <Drawer open={open} onClose={onClose} title="Queue" bodyClassName="p-0" className="w-[24rem]">
      <QueueList onNavigate={onClose} />
    </Drawer>
  );
}
