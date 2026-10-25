"use client";

import { createContext, useContext, useEffect, useMemo, useReducer, useRef, useState, type ReactNode } from "react";
import { Heart, Pause, Play } from "@/registry/plainspoken/lib/icons";
import type { ControlSize } from "@/registry/plainspoken/lib/controls";
import { IconButton, type ButtonVariant } from "@/registry/plainspoken/ui/button";
import { Icon } from "@/registry/plainspoken/ui/icon";
import { Toggle } from "@/registry/plainspoken/ui/toggle";
import { cn } from "@/lib/utils";
import { toast } from "@/registry/plainspoken/ui/toast";
import { INITIAL_LIBRARY, LIKED_SONGS, NOW, playlistById, trackById, type PlaylistEntry, type Track } from "@/registry/plainspoken/blocks/music/data";

// -------------------------------------------------------------------------------------------------
// Playback

export type Repeat = "off" | "all" | "one";

/** Where the playing tracks come from: an album, a playlist, an artist's top tracks, a search */
export interface PlayContext {
  kind: "album" | "playlist" | "artist" | "liked" | "search";
  id: string;
  title: string;
  href?: string;
}

export interface PlaybackState {
  /** The track loaded in the player */
  current: string | null;
  context: PlayContext | null;
  /** The context's tracks in their own order */
  source: string[];
  /** The context's tracks in play order: `source`, or shuffled with the first track first */
  order: string[];
  /** Where `current` sits in `order`; -1 while a track from the queue plays */
  index: number;
  /** Added with "Add to queue": plays before the rest of the context */
  upNext: string[];
  playing: boolean;
  shuffle: boolean;
  repeat: Repeat;
  /** 0–100 */
  volume: number;
  muted: boolean;
}

type Action =
  | { type: "load"; context: PlayContext; source: string[]; order: string[]; start: string }
  | { type: "play" | "pause" | "toggle" }
  | { type: "next"; auto?: boolean }
  | { type: "prev" }
  | { type: "jump"; index: number }
  | { type: "jumpQueue"; index: number }
  | { type: "shuffle"; order: string[] | null }
  | { type: "repeat" }
  | { type: "volume"; volume: number }
  | { type: "mute" }
  | { type: "enqueue"; id: string; next?: boolean }
  | { type: "dequeue"; index: number }
  | { type: "clearQueue" };

const REPEAT_NEXT: Record<Repeat, Repeat> = { off: "all", all: "one", one: "off" };

function reduce(s: PlaybackState, a: Action): PlaybackState {
  switch (a.type) {
    case "load":
      return { ...s, context: a.context, source: a.source, order: a.order, index: a.order.indexOf(a.start), current: a.start, playing: true };
    case "play":
      return s.current ? { ...s, playing: true } : s;
    case "pause":
      return { ...s, playing: false };
    case "toggle":
      return s.current ? { ...s, playing: !s.playing } : s;
    case "next": {
      if (s.upNext.length) return { ...s, current: s.upNext[0], upNext: s.upNext.slice(1), playing: true };
      // Coming back from the queue: carry on after the context track that played last
      const i = s.index + 1;
      if (i < s.order.length) return { ...s, index: i, current: s.order[i], playing: true };
      if (!s.order.length) return { ...s, playing: false };
      // Past the end: round again with repeat, else stop on the first track, ready to start over
      return { ...s, index: 0, current: s.order[0], playing: s.repeat === "all" || (!a.auto && s.playing) };
    }
    case "prev": {
      if (s.index > 0) return { ...s, index: s.index - 1, current: s.order[s.index - 1] };
      if (s.repeat === "all" && s.order.length) return { ...s, index: s.order.length - 1, current: s.order.at(-1)! };
      return s;
    }
    case "jump":
      return a.index >= 0 && a.index < s.order.length ? { ...s, index: a.index, current: s.order[a.index], playing: true } : s;
    case "jumpQueue":
      return a.index >= 0 && a.index < s.upNext.length ? { ...s, current: s.upNext[a.index], upNext: s.upNext.slice(a.index + 1), playing: true } : s;
    case "shuffle": {
      const order = a.order ?? s.source;
      return { ...s, shuffle: a.order != null, order, index: s.current ? order.indexOf(s.current) : -1 };
    }
    case "repeat":
      return { ...s, repeat: REPEAT_NEXT[s.repeat] };
    case "volume":
      return { ...s, volume: Math.max(0, Math.min(100, Math.round(a.volume))), muted: a.volume <= 0 };
    case "mute":
      // Unmuting at zero volume would be silent: bring it back to something audible
      return s.muted || s.volume === 0 ? { ...s, muted: false, volume: s.volume || 50 } : { ...s, muted: true };
    case "enqueue":
      return { ...s, upNext: a.next ? [a.id, ...s.upNext] : [...s.upNext, a.id] };
    case "dequeue":
      return { ...s, upNext: s.upNext.filter((_, i) => i !== a.index) };
    case "clearQueue":
      return { ...s, upNext: [] };
  }
}

/** A random order with `first` first (Fisher–Yates). Only ever called from event handlers. */
function shuffled(ids: string[], first?: string | null): string[] {
  const rest = ids.filter((id) => id !== first);
  for (let i = rest.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [rest[i], rest[j]] = [rest[j], rest[i]];
  }
  return first ? [first, ...rest] : rest;
}

export interface PlayerControls {
  /** Play a list of tracks as a context (an album, a playlist), from `start` or the beginning */
  playContext: (context: PlayContext, trackIds: string[], start?: string) => void;
  play: () => void;
  pause: () => void;
  toggle: () => void;
  next: () => void;
  /** Back to the start of the track, or (in its first 3 seconds) to the one before */
  previous: () => void;
  seek: (sec: number) => void;
  /** Move by this many seconds */
  skip: (delta: number) => void;
  jump: (index: number) => void;
  jumpQueue: (index: number) => void;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
  setVolume: (v: number) => void;
  toggleMute: () => void;
  addToQueue: (trackId: string) => void;
  playNext: (trackId: string) => void;
  removeFromQueue: (index: number) => void;
  clearQueue: () => void;
}

export interface Player extends PlaybackState, PlayerControls {
  track: Track | null;
  /** True when this context is the one loaded (playing or paused) */
  isContext: (kind: PlayContext["kind"], id: string) => boolean;
}

const PlaybackCtx = createContext<PlaybackState | null>(null);
const PositionCtx = createContext(0);
const ControlsCtx = createContext<PlayerControls | null>(null);

/** The player: what's loaded, the queue, the modes, and the controls. Re-renders when any of that changes, not on every tick. */
export function usePlayer(): Player {
  const s = useContext(PlaybackCtx);
  const c = useContext(ControlsCtx);
  if (!s || !c) throw new Error("usePlayer needs a <MusicProvider> around it");
  return { ...s, ...c, track: s.current ? (trackById(s.current) ?? null) : null, isContext: (kind, id) => s.context?.kind === kind && s.context.id === id };
}

/** Seconds into the current track. Changes four times a second while playing, so only time displays should read it. */
export function usePosition(): number {
  return useContext(PositionCtx);
}

const TICK_MS = 250;

// -------------------------------------------------------------------------------------------------
// Library: likes, saved albums and playlists, followed artists, playlist edits

export type SavedKind = "albums" | "artists" | "playlists";

export interface LibraryState {
  /** Liked track id → ISO date it was liked */
  liked: Record<string, string>;
  albums: string[];
  artists: string[];
  playlists: string[];
  /** Tracks added to playlists in this session */
  added: Record<string, PlaylistEntry[]>;
  /** Tracks removed from playlists in this session */
  removed: Record<string, string[]>;
}

export interface Library extends LibraryState {
  isLiked: (trackId: string) => boolean;
  toggleLike: (trackId: string) => void;
  isSaved: (kind: SavedKind, id: string) => boolean;
  toggleSaved: (kind: SavedKind, id: string, title: string) => void;
  /** A playlist's entries with this session's edits applied; "liked" for Liked Songs (newest first) */
  entriesOf: (playlistId: string) => PlaylistEntry[];
  addToPlaylist: (playlistId: string, trackId: string) => void;
  removeFromPlaylist: (playlistId: string, trackId: string) => void;
}

const LibraryCtx = createContext<Library | null>(null);

export function useLibrary(): Library {
  const l = useContext(LibraryCtx);
  if (!l) throw new Error("useLibrary needs a <MusicProvider> around it");
  return l;
}

const TODAY = NOW.slice(0, 10);

// -------------------------------------------------------------------------------------------------

export interface MusicProviderProps {
  children: ReactNode;
  /** Start with this loaded (for stories and docs): a context, its tracks, and whether it's playing */
  initial?: { context: PlayContext; trackIds: string[]; start?: string; playing?: boolean; position?: number; upNext?: string[] };
}

/**
 * Holds the music player and the listener's library for everything under it, and runs a fake
 * clock: while playing, the position moves on a quarter second every 250 ms, and at the end of a
 * track the next one starts (or the same one, with repeat one). No audio is involved. Put it in a
 * layout that stays mounted, and playback carries on across pages.
 */
export function MusicProvider({ children, initial }: MusicProviderProps) {
  const [s, dispatch] = useReducer(reduce, undefined, (): PlaybackState => {
    const start = initial ? (initial.start ?? initial.trackIds[0]) : null;
    return {
      current: start,
      context: initial?.context ?? null,
      source: initial?.trackIds ?? [],
      order: initial?.trackIds ?? [],
      index: start && initial ? initial.trackIds.indexOf(start) : -1,
      upNext: initial?.upNext ?? [],
      playing: initial?.playing ?? false,
      shuffle: false,
      repeat: "off",
      volume: 70,
      muted: false,
    };
  });
  const [position, setPosition] = useState(initial?.position ?? 0);
  const pos = useRef(position);
  const latest = useRef(s);
  useEffect(() => {
    latest.current = s;
  });

  const setPos = (sec: number) => {
    pos.current = sec;
    setPosition(sec);
  };

  // The clock. The track's end decides what comes next: the same one again, the next, or a stop.
  const { playing, current } = s;
  useEffect(() => {
    if (!playing || !current) return;
    const duration = trackById(current)?.duration ?? 0;
    const t = setInterval(() => {
      const p = pos.current + TICK_MS / 1000;
      pos.current = p < duration ? p : 0;
      setPosition(pos.current);
      if (p >= duration && latest.current.repeat !== "one") dispatch({ type: "next", auto: true });
    }, TICK_MS);
    return () => clearInterval(t);
  }, [playing, current]);

  const controls = useMemo<PlayerControls>(() => {
    // A jump always starts a track from the top
    const go = (a: Action) => {
      setPos(0);
      dispatch(a);
    };
    return {
      playContext: (context, trackIds, start) => {
        const shuffle = latest.current.shuffle;
        const first = start ?? (shuffle ? trackIds[Math.floor(Math.random() * trackIds.length)] : trackIds[0]);
        if (!first) return;
        setPos(0);
        dispatch({ type: "load", context, source: trackIds, order: shuffle ? shuffled(trackIds, first) : trackIds, start: first });
      },
      play: () => dispatch({ type: "play" }),
      pause: () => dispatch({ type: "pause" }),
      toggle: () => dispatch({ type: "toggle" }),
      next: () => {
        setPos(0);
        dispatch({ type: "next" });
      },
      previous: () => {
        if (pos.current > 3 || latest.current.index <= 0) setPos(0);
        else {
          setPos(0);
          dispatch({ type: "prev" });
        }
      },
      seek: (sec) => {
        const d = latest.current.current ? (trackById(latest.current.current)?.duration ?? 0) : 0;
        setPos(Math.max(0, Math.min(d - 0.5, sec)));
      },
      skip: (delta) => {
        const d = latest.current.current ? (trackById(latest.current.current)?.duration ?? 0) : 0;
        setPos(Math.max(0, Math.min(d - 0.5, pos.current + delta)));
      },
      jump: (index) => go({ type: "jump", index }),
      jumpQueue: (index) => go({ type: "jumpQueue", index }),
      toggleShuffle: () => {
        const cur = latest.current;
        dispatch({ type: "shuffle", order: cur.shuffle ? null : shuffled(cur.source, cur.current) });
      },
      cycleRepeat: () => dispatch({ type: "repeat" }),
      setVolume: (volume) => dispatch({ type: "volume", volume }),
      toggleMute: () => dispatch({ type: "mute" }),
      addToQueue: (id) => {
        dispatch({ type: "enqueue", id });
        toast({ title: "Added to queue", description: trackById(id)?.title });
      },
      playNext: (id) => {
        dispatch({ type: "enqueue", id, next: true });
        toast({ title: "Playing next", description: trackById(id)?.title });
      },
      removeFromQueue: (index) => dispatch({ type: "dequeue", index }),
      clearQueue: () => dispatch({ type: "clearQueue" }),
    };
  }, []);

  const [lib, setLib] = useState<LibraryState>(() => ({
    liked: Object.fromEntries(LIKED_SONGS.map((e) => [e.trackId, e.added])),
    albums: INITIAL_LIBRARY.albums,
    artists: INITIAL_LIBRARY.artists,
    playlists: INITIAL_LIBRARY.playlists,
    added: {},
    removed: {},
  }));

  const library = useMemo<Library>(
    () => ({
      ...lib,
      isLiked: (id) => id in lib.liked,
      toggleLike: (id) => {
        const was = id in lib.liked;
        setLib((l) => {
          const liked = { ...l.liked };
          if (id in liked) delete liked[id];
          else liked[id] = TODAY;
          return { ...l, liked };
        });
        toast({ title: was ? "Removed from Liked Songs" : "Added to Liked Songs", description: trackById(id)?.title });
      },
      isSaved: (kind, id) => lib[kind].includes(id),
      toggleSaved: (kind, id, title) => {
        const was = lib[kind].includes(id);
        setLib((l) => ({ ...l, [kind]: l[kind].includes(id) ? l[kind].filter((x) => x !== id) : [id, ...l[kind]] }));
        const verb = kind === "artists" ? (was ? "Unfollowed" : "Following") : was ? "Removed from Your Library" : "Saved to Your Library";
        toast({ title: verb, description: title });
      },
      entriesOf: (pid) => {
        if (pid === "liked")
          return Object.entries(lib.liked)
            .map(([trackId, added]) => ({ trackId, added }))
            .sort((a, b) => b.added.localeCompare(a.added));
        const base = playlistById(pid)?.entries ?? [];
        const gone = new Set(lib.removed[pid] ?? []);
        return [...base, ...(lib.added[pid] ?? [])].filter((e) => !gone.has(e.trackId));
      },
      addToPlaylist: (pid, tid) => {
        setLib((l) => ({
          ...l,
          added: { ...l.added, [pid]: [...(l.added[pid] ?? []).filter((e) => e.trackId !== tid), { trackId: tid, added: TODAY }] },
          removed: { ...l.removed, [pid]: (l.removed[pid] ?? []).filter((x) => x !== tid) },
        }));
        toast({ title: `Added to ${playlistById(pid)?.title ?? "playlist"}`, description: trackById(tid)?.title });
      },
      removeFromPlaylist: (pid, tid) => {
        setLib((l) => ({
          ...l,
          added: { ...l.added, [pid]: (l.added[pid] ?? []).filter((e) => e.trackId !== tid) },
          removed: { ...l.removed, [pid]: [...(l.removed[pid] ?? []), tid] },
        }));
        toast({
          title: `Removed from ${playlistById(pid)?.title ?? "playlist"}`,
          description: trackById(tid)?.title,
          action: {
            label: "Undo",
            onClick: () => setLib((l) => ({ ...l, removed: { ...l.removed, [pid]: (l.removed[pid] ?? []).filter((x) => x !== tid) } })),
          },
        });
      },
    }),
    [lib],
  );

  return (
    <ControlsCtx value={controls}>
      <PlaybackCtx value={s}>
        <PositionCtx value={position}>
          <LibraryCtx value={library}>{children}</LibraryCtx>
        </PositionCtx>
      </PlaybackCtx>
    </ControlsCtx>
  );
}

// -------------------------------------------------------------------------------------------------
// Keyboard

/** Elements that use these keys themselves: text fields, sliders, menus, tab strips, radio groups */
const OWN_KEYS =
  "input, textarea, select, [contenteditable=true], [role=menu], [role=listbox], [role=tablist], [role=radiogroup], [role=slider], [role=dialog][data-slot=popover]";

/**
 * The player's keys, on the whole page: Space plays and pauses, ←/→ seek 5 seconds, ↑/↓ change
 * the volume, N and P go to the next and previous track, M mutes, S shuffles, R cycles repeat, and
 * ? calls `onHelp`. Nothing happens while typing, or where the focused control uses the key itself
 * (Space on a button presses it; arrows move in a slider, a menu or a list of tracks).
 */
export function usePlayerShortcuts(onHelp?: () => void) {
  const c = useContext(ControlsCtx);
  const s = useContext(PlaybackCtx);
  const vol = useRef(s?.volume ?? 70);
  const help = useRef(onHelp);
  useEffect(() => {
    vol.current = s?.volume ?? 70;
    help.current = onHelp;
  });
  useEffect(() => {
    if (!c) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey) return;
      const t = e.target instanceof Element ? e.target : null;
      if (t?.closest(OWN_KEYS)) return;
      const onControl = !!t?.closest("button, a, summary, [role=button], [role=menuitem], [role=checkbox], [role=switch], label");
      const inRows = !!t?.closest("[data-track-row]");
      let handled = true;
      switch (e.key) {
        case " ":
          if (onControl || inRows) handled = false;
          else c.toggle();
          break;
        case "ArrowLeft":
          c.skip(-5);
          break;
        case "ArrowRight":
          c.skip(5);
          break;
        case "ArrowUp":
          if (inRows) handled = false;
          else c.setVolume(vol.current + 10);
          break;
        case "ArrowDown":
          if (inRows) handled = false;
          else c.setVolume(vol.current - 10);
          break;
        case "n":
        case "N":
          c.next();
          break;
        case "p":
        case "P":
          c.previous();
          break;
        case "m":
        case "M":
          c.toggleMute();
          break;
        case "s":
        case "S":
          c.toggleShuffle();
          break;
        case "r":
        case "R":
          c.cycleRepeat();
          break;
        case "?":
          if (help.current) help.current();
          else handled = false;
          break;
        default:
          handled = false;
      }
      if (handled) e.preventDefault();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [c]);
}

/** The shortcuts, for a help dialog: [keys, what they do] */
export const PLAYER_SHORTCUTS: [string[], string][] = [
  [["Space"], "Play or pause"],
  [["←", "→"], "Back or forward 5 seconds"],
  [["↑", "↓"], "Volume up or down"],
  [["N"], "Next track"],
  [["P"], "Previous track, or back to the start"],
  [["M"], "Mute or unmute"],
  [["S"], "Shuffle on or off"],
  [["R"], "Repeat: off, all, one"],
  [["?"], "This list"],
];

// -------------------------------------------------------------------------------------------------
// The play button for a whole album, playlist or artist

export interface PlayCollectionButtonProps {
  context: PlayContext;
  trackIds: string[];
  size?: ControlSize;
  variant?: ButtonVariant;
  className?: string;
}

/**
 * Play (or pause) a whole collection: an album, a playlist, an artist's top tracks. While that
 * collection is the one playing it shows Pause; pressing it again resumes where it was.
 */
export function PlayCollectionButton({ context, trackIds, size, variant = "primary", className }: PlayCollectionButtonProps) {
  const p = usePlayer();
  const loaded = p.isContext(context.kind, context.id);
  const playing = loaded && p.playing;
  return (
    <IconButton
      variant={variant}
      size={size}
      label={`${playing ? "Pause" : "Play"} ${context.title}`}
      disabled={!trackIds.length}
      onClick={(e) => {
        e.stopPropagation();
        if (playing) p.pause();
        else if (loaded) p.play();
        else p.playContext(context, trackIds);
      }}
      icon={<Icon icon={playing ? Pause : Play} className="fill-current" />}
      className={className}
    />
  );
}

export interface LikeButtonProps {
  trackId: string;
  size?: ControlSize;
  /** Keep it invisible until the row it is in is hovered or focused, unless the track is liked */
  revealOnHover?: boolean;
  /** -1 inside a list where only the focused row's buttons are in the tab order */
  tabIndex?: number;
  className?: string;
}

/**
 * The heart: likes a track (adds it to Liked Songs) or unlikes it. A toggle button, so screen
 * readers hear "Like, pressed"; the heart fills in when pressed, so it doesn't rest on colour.
 */
export function LikeButton({ trackId, size, revealOnHover = false, tabIndex, className }: LikeButtonProps) {
  const lib = useLibrary();
  const liked = lib.isLiked(trackId);
  return (
    <Toggle
      variant="ghost"
      size={size}
      label="Like"
      tabIndex={tabIndex}
      pressed={liked}
      onPressedChange={() => lib.toggleLike(trackId)}
      onClick={(e) => e.stopPropagation()}
      icon={Heart}
      iconPressed={<Icon icon={Heart} className="fill-current" />}
      className={cn(
        "aria-pressed:border-transparent aria-pressed:bg-transparent aria-pressed:hover:bg-secondary",
        revealOnHover && !liked && "opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 focus-visible:opacity-100",
        className,
      )}
    />
  );
}
