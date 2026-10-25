// A tiny collaboration world for the edit-conflict prototypes, all in the browser: a "server"
// that keeps numbered versions and refuses a save based on an old one, two clients (you and
// Jonas) that each follow one approach's policy, presence, a network that can be slow or cut,
// and scripts that type Jonas's (and, when a scenario needs it, your) edits out letter by letter.
import { useState, useSyncExternalStore } from "react";
import { diffChars, mapSelection, merge3, mergeBlocks, mergedBlocks, mergedText, type TextSelection } from "@/registry/plainspoken/lib/diff";
import type { Collaborator } from "@/registry/plainspoken/ui/presence";
import { AMARA, JONAS, type Material, type ScriptedEdit } from "@/registry/plainspoken/blocks/conflicts/content";

/**
 * How a client treats other people's changes:
 * - lock: whoever starts first holds the field; others get it read-only (with "Edit anyway").
 *   Saves as you type. A clash after "Edit anyway" or offline is a plain choice of two.
 * - warn: you save by hand. Others' saves arrive as a notice; your text is never touched.
 * - save: you save by hand and find out about others' saves only when yours is refused.
 * - merge: saves as you type and merges others' changes in (three-way); stops and asks where both changed the same words.
 * - live: saves as you type, quickly, and merges everything, keeping both where both typed in one spot.
 */
export type Policy = "lock" | "warn" | "save" | "merge" | "live";

export type Side = "you" | "them";

/** A saved version on the server */
export interface Revision {
  version: number;
  text: string;
  author: Collaborator;
  /** Epoch ms; 0 for the version that was there before the page opened */
  at: number;
  /** "Restored version 3" */
  note?: string;
}

/** What one client knows of the other person */
export interface PeerPresence {
  person: Collaborator;
  online: boolean;
  focused: boolean;
  /** When they came into the field: the earlier of two holds a lock */
  since: number;
  typing: boolean;
  selection: TextSelection | null;
}

export interface ClientState {
  side: Side;
  person: Collaborator;
  text: string;
  /** This person's selection, for presence and for putting the caret back */
  selection: TextSelection | null;
  /** Bumped whenever the text changes other than by this person's typing: the editor then puts the caret back from `selection` */
  external: number;
  /** The server version the text builds on */
  base: Revision;
  online: boolean;
  /** Changes waiting to go to the server */
  pending: boolean;
  /** A newer version held back: warn shows it as a notice (blocked: a save was refused), lock asks which to keep */
  incoming: { rev: Revision; offline: boolean; blocked: boolean } | null;
  /**
   * merge: both changed the same words; the three texts, until a person settles it. `partial` is
   * the version saved meanwhile with everything that merged cleanly (their side where it clashed),
   * when the approach syncs what it can straight away.
   */
  resolving: { base: string; mine: string; theirs: Revision; offline: boolean; partial?: Revision } | null;
  /** save: the server refused a save */
  rejected: { mine: string; base: Revision; theirs: Revision } | null;
  /** merge, live: the last automatic merge, for "Merged Jonas's change" and Undo */
  merged: { base: string; mine: string; result: string; theirs: Revision; offline: boolean; at: number } | null;
  /** lock: "Edit anyway" pressed */
  editAnyway: boolean;
  /** In the field (for the lock: the earlier of two holds it) */
  focused: boolean;
  peer: PeerPresence | null;
  savedAt: number | null;
  /** The latest thing worth announcing to this person */
  news: { text: string; n: number };
}

export interface LogEntry {
  id: number;
  at: number;
  text: string;
}

export interface SimState {
  revisions: Revision[];
  you: ClientState;
  them: ClientState;
  log: LogEntry[];
  /** The scenario being played, if any */
  running: ScenarioId | null;
}

export type ScenarioId = "other" | "same" | "stale" | "offline";

export interface SimOptions {
  material: Material;
  policy: Policy;
  /** Three-way merge: the merged text, or null where a person must settle it (merge policy) */
  merge?: (base: string, mine: string, theirs: string) => string | null;
  /** Three-way merge that always succeeds (live policy, and Undo of a merge) */
  mergeAll?: (base: string, mine: string, theirs: string) => string;
  /**
   * merge policy: what to save at once when a merge needs a person, so the clean part reaches
   * everyone without waiting (usually the merge with their side taken where it clashed)
   */
  partial?: (base: string, mine: string, theirs: string) => string;
  /**
   * Milliseconds before saving, for the policies that save as you type: after the last keystroke
   * (merge, default 1200), or at most this often while typing (live 300, lock 400).
   */
  debounce?: number;
  /** Network delay, ms. Default 250. */
  latency?: number;
}

const other = (s: Side): Side => (s === "you" ? "them" : "you");
const personOf = (s: Side) => (s === "you" ? AMARA : JONAS);
const first = (p: Collaborator) => p.name.split(" ")[0];

/**
 * One prototype's world. Not React state: a store with subscribe/get, so scripts and timers can
 * drive it and the UI reads it with useSim(). Everything on a timer stops on reset or dispose.
 */
export class Sim {
  readonly options: Required<Omit<SimOptions, "merge" | "mergeAll" | "partial">> & Pick<SimOptions, "merge" | "mergeAll" | "partial">;
  private state: SimState;
  private listeners = new Set<() => void>();
  private timers = new Set<ReturnType<typeof setTimeout>>();
  private pushTimer: Record<Side, ReturnType<typeof setTimeout> | undefined> = { you: undefined, them: undefined };
  private typingTimer: Record<Side, ReturnType<typeof setTimeout> | undefined> = { you: undefined, them: undefined };
  private epoch = 0;
  private logId = 0;
  /** A side whose autosave waits (a script needs the other's save to land first) */
  private held: Record<Side, boolean> = { you: false, them: false };
  /** Extra delay on what reaches you next: "a bad connection" */
  private slowToYou = 0;
  private nextNote: Record<Side, string | undefined> = { you: undefined, them: undefined };

  constructor(options: SimOptions) {
    this.options = { debounce: options.policy === "live" ? 300 : options.policy === "lock" ? 400 : 1200, latency: 250, ...options };
    this.state = this.initial();
  }

  private initial(): SimState {
    const v1: Revision = { version: 1, text: this.options.material.text, author: JONAS, at: 0 };
    const client = (side: Side): ClientState => ({
      side,
      person: personOf(side),
      text: v1.text,
      selection: null,
      external: 0,
      base: v1,
      online: true,
      pending: false,
      incoming: null,
      resolving: null,
      rejected: null,
      merged: null,
      editAnyway: false,
      focused: false,
      peer: null,
      savedAt: null,
      news: { text: "", n: 0 },
    });
    return { revisions: [v1], you: client("you"), them: client("them"), log: [], running: null };
  }

  // -------------------------------------------------------------------------------------------
  // Store

  subscribe = (l: () => void) => {
    this.listeners.add(l);
    return () => {
      this.listeners.delete(l);
    };
  };
  get = () => this.state;
  private emit() {
    for (const l of this.listeners) l();
  }
  private patch(side: Side, p: Partial<ClientState>) {
    this.state = { ...this.state, [side]: { ...this.state[side], ...p } };
    this.emit();
  }
  get head() {
    return this.state.revisions.at(-1)!;
  }
  get policy() {
    return this.options.policy;
  }

  private log(text: string) {
    const entry = { id: ++this.logId, at: Date.now(), text };
    this.state = { ...this.state, log: [entry, ...this.state.log].slice(0, 40) };
    this.emit();
  }
  private tell(side: Side, text: string) {
    const n = this.state[side].news.n + 1;
    this.patch(side, { news: { text, n } });
  }

  private later(fn: () => void, ms: number) {
    const epoch = this.epoch;
    const t = setTimeout(() => {
      this.timers.delete(t);
      if (epoch === this.epoch) fn();
    }, ms);
    this.timers.add(t);
    return t;
  }
  private clear(t: ReturnType<typeof setTimeout> | undefined) {
    if (t) {
      clearTimeout(t);
      this.timers.delete(t);
    }
  }
  /** Resolves true after `ms`, or false if the world was reset meanwhile */
  wait(ms: number): Promise<boolean> {
    const epoch = this.epoch;
    return new Promise((resolve) => {
      const done = (ok: boolean) => {
        this.waits.delete(done);
        resolve(ok && epoch === this.epoch);
      };
      this.waits.add(done);
      const t = setTimeout(() => {
        this.timers.delete(t);
        done(true);
      }, ms);
      this.timers.add(t);
    });
  }
  private waits = new Set<(ok: boolean) => void>();

  /** Stops every timer and script (a script waiting is told to give up); the world stays as it is */
  dispose() {
    this.epoch++;
    for (const t of this.timers) clearTimeout(t);
    this.timers.clear();
    for (const w of [...this.waits]) w(false);
    if (this.state.running) {
      this.state = { ...this.state, running: null };
      this.emit();
    }
  }

  /** Back to the start: version 1, both online, nothing typed */
  reset() {
    this.dispose();
    this.slowToYou = 0;
    this.held = { you: false, them: false };
    this.state = this.initial();
    this.log("Reset: version 1, both online, nothing changed.");
  }

  // -------------------------------------------------------------------------------------------
  // Network and server

  /** Something reaching `to` from the server after the network delay, if they are still online then */
  private send(to: Side, fn: () => void) {
    let ms = this.options.latency;
    if (to === "you" && this.slowToYou) ms += this.slowToYou;
    this.later(() => {
      if (this.state[to].online) fn();
    }, ms);
  }

  /** The server: a new version if `baseVersion` is the latest, else a refusal with the latest */
  private commit(side: Side, text: string, baseVersion: number): { ok: true; rev: Revision } | { ok: false; head: Revision } {
    const head = this.head;
    if (baseVersion !== head.version) {
      this.log(`Server refused ${first(personOf(side))}'s save: it was based on version ${baseVersion}, the latest is ${head.version}.`);
      return { ok: false, head };
    }
    const rev: Revision = { version: head.version + 1, text, author: personOf(side), at: Date.now(), note: this.nextNote[side] };
    this.nextNote[side] = undefined;
    this.state = { ...this.state, revisions: [...this.state.revisions, rev] };
    this.log(`${first(personOf(side))} saved version ${rev.version}${rev.note ? ` (${rev.note.toLowerCase()})` : ""}.`);
    const to = other(side);
    this.send(to, () => this.receive(to, rev, false));
    return { ok: true, rev };
  }

  private publish(side: Side) {
    const c = this.state[side];
    const to = other(side);
    if (!c.online) return;
    const p: PeerPresence = {
      person: c.person,
      online: true,
      focused: this.presence[side].focused,
      since: this.presence[side].since,
      typing: this.presence[side].typing,
      selection: this.presence[side].selection,
    };
    this.send(to, () => {
      const was = this.state[to].peer;
      // Whoever had the field to themselves gets it back when the other leaves it
      const left = was?.focused && !p.focused;
      this.patch(to, { peer: p, ...(left && this.state[to].editAnyway ? { editAnyway: false } : {}) });
    });
  }
  private presence: Record<Side, { focused: boolean; since: number; typing: boolean; selection: TextSelection | null }> = {
    you: { focused: false, since: 0, typing: false, selection: null },
    them: { focused: false, since: 0, typing: false, selection: null },
  };

  // -------------------------------------------------------------------------------------------
  // What the editors call

  /** This person typed: the new text and their selection after it */
  type(side: Side, text: string, selection: TextSelection | null) {
    const c = this.state[side];
    if (text === c.text) return this.select(side, selection);
    this.patch(side, { text, selection });
    this.presence[side] = { ...this.presence[side], focused: true, since: this.presence[side].since || Date.now(), typing: true, selection };
    this.publish(side);
    this.clear(this.typingTimer[side]);
    this.typingTimer[side] = this.later(() => {
      this.presence[side] = { ...this.presence[side], typing: false };
      this.publish(side);
    }, 1500);
    if (this.autosaves) this.schedulePush(side);
  }

  /** The caret moved */
  select(side: Side, selection: TextSelection | null) {
    const c = this.state[side];
    if (c.selection?.start === selection?.start && c.selection?.end === selection?.end) return;
    this.patch(side, { selection });
    this.presence[side] = { ...this.presence[side], selection };
    this.publish(side);
  }

  /** Into or out of the field */
  focus(side: Side, on: boolean) {
    if (this.presence[side].focused === on) return;
    this.presence[side] = { ...this.presence[side], focused: on, since: on ? Date.now() : 0, typing: on && this.presence[side].typing };
    this.patch(side, { focused: on });
    this.publish(side);
  }

  /** Sends while the person types, so others see it as it happens */
  private get streams() {
    return this.policy === "live" || this.policy === "lock";
  }

  private get autosaves() {
    return this.policy === "lock" || this.policy === "merge" || this.policy === "live";
  }

  /** For "lock": is this person's field read-only, because the other came into it first? */
  lockedFor(side: Side, state = this.state): boolean {
    const c = state[side];
    if (this.policy !== "lock" || !c.peer?.focused || !c.online || c.editAnyway) return false;
    const mine = this.presence[side];
    return !mine.focused || !mine.since || c.peer.since <= mine.since;
  }

  setEditAnyway(side: Side, on: boolean) {
    this.patch(side, { editAnyway: on });
    if (on) this.log(`${first(personOf(side))} pressed Edit anyway.`);
  }

  private schedulePush(side: Side, ms = this.options.debounce) {
    // Live editing sends while you type (at most every `debounce` ms); the others wait for a pause
    if (this.streams && this.pushTimer[side] && this.timers.has(this.pushTimer[side]!)) return;
    this.clear(this.pushTimer[side]);
    if (!this.state[side].pending) this.patch(side, { pending: true });
    this.pushTimer[side] = this.later(() => this.push(side), ms);
  }

  /** Autosave: send the text if it can go */
  private push(side: Side) {
    const c = this.state[side];
    this.clear(this.pushTimer[side]);
    if (!c.online || c.resolving || c.incoming || c.rejected || this.held[side]) return;
    if (c.text === c.base.text) {
      this.patch(side, { pending: false });
      return;
    }
    const r = this.commit(side, c.text, c.base.version);
    if (r.ok) this.patch(side, { base: r.rev, pending: false, savedAt: r.rev.at });
    else this.receive(side, r.head, false);
  }

  /** Save by hand (and, for the policies that save as you type, save now) */
  save(side: Side) {
    const c = this.state[side];
    if (this.autosaves) return this.push(side);
    if (!c.online) {
      this.patch(side, { pending: true });
      this.log(`${first(personOf(side))} is offline: the save waits for the connection.`);
      return;
    }
    if (c.text === c.base.text && !c.incoming) return;
    const r = this.commit(side, c.text, c.base.version);
    if (r.ok) {
      this.patch(side, { base: r.rev, pending: false, savedAt: r.rev.at, incoming: null });
      return;
    }
    if (this.policy === "warn") {
      this.patch(side, { pending: false, incoming: { rev: r.head, offline: false, blocked: true } });
      this.tell(side, `Not saved: ${first(r.head.author)} saved a newer version. Choose what to keep.`);
    } else {
      this.patch(side, { pending: false, rejected: { mine: c.text, base: c.base, theirs: r.head } });
      this.tell(side, `Not saved: ${first(r.head.author)} saved a newer version.`);
    }
  }

  /** Another version reached this client */
  private receive(side: Side, rev: Revision, offline: boolean) {
    const c = this.state[side];
    if (rev.version <= c.base.version || (this.theirs(side)?.version ?? 0) >= rev.version) return;
    const who = first(rev.author);
    const clean = c.text === c.base.text && !c.resolving && !c.incoming && !c.rejected;
    if (clean) {
      this.apply(side, rev.text, { base: rev });
      this.tell(side, `${who} changed ${this.options.material.name}.`);
      return;
    }
    switch (this.policy) {
      case "save":
        // An old-style form: it finds out when it saves
        this.log(`${first(personOf(side))}'s screen doesn't know about version ${rev.version} yet.`);
        return;
      case "lock":
      case "warn":
        this.patch(side, { incoming: { rev, offline, blocked: c.incoming?.blocked ?? false } });
        this.tell(side, `${who} changed ${this.options.material.name}${offline ? " while you were offline" : ""}. Your changes are kept for now.`);
        return;
      case "merge": {
        const merged = this.options.merge?.(c.base.text, c.text, rev.text) ?? null;
        if (merged == null) {
          const mine = c.resolving?.mine ?? c.text;
          const base = c.resolving?.base ?? c.base.text;
          this.patch(side, { resolving: { base, mine, theirs: rev, offline }, merged: null });
          this.log(`${first(personOf(side))}'s copy: merged what could be merged; a part both changed needs a choice.`);
          this.tell(side, `${who} changed the same words as you. Choose which to keep.`);
          const partial = this.options.partial?.(base, mine, rev.text);
          if (partial != null && partial !== rev.text && c.online) {
            const r = this.commit(side, partial, rev.version);
            if (r.ok) this.patch(side, { resolving: { ...this.state[side].resolving!, partial: r.rev } });
          }
          return;
        }
        this.mergedIn(side, c, rev, merged, offline);
        return;
      }
      case "live": {
        const merged = this.options.mergeAll?.(c.base.text, c.text, rev.text) ?? rev.text;
        this.mergedIn(side, c, rev, merged, offline);
        return;
      }
    }
  }

  private mergedIn(side: Side, c: ClientState, rev: Revision, merged: string, offline: boolean) {
    this.apply(side, merged, { base: rev, merged: { base: c.base.text, mine: c.text, result: merged, theirs: rev, offline, at: Date.now() } });
    this.log(`${first(personOf(side))}'s copy: merged ${first(rev.author)}'s version ${rev.version} in.`);
    this.tell(side, `Merged ${first(rev.author)}'s change.`);
    if (merged !== rev.text) this.schedulePush(side, 400);
  }

  /** New text that didn't come from this person's typing: keeps their caret on the same words */
  private apply(side: Side, text: string, p: Partial<ClientState> = {}) {
    const c = this.state[side];
    const selection = c.selection ? mapSelection(c.text, text, c.selection) : null;
    this.patch(side, { text, selection, external: c.external + 1, ...p });
    if (selection) this.presence[side] = { ...this.presence[side], selection };
  }

  /** The version this client is being asked about */
  private theirs(side: Side): Revision | null {
    const c = this.state[side];
    return c.incoming?.rev ?? c.rejected?.theirs ?? c.resolving?.partial ?? c.resolving?.theirs ?? null;
  }

  /** Throw away my changes and take theirs */
  takeTheirs(side: Side) {
    const rev = this.theirs(side) ?? this.head;
    this.clear(this.pushTimer[side]);
    this.apply(side, rev.text, { base: rev, incoming: null, rejected: null, resolving: null, merged: null, pending: false });
    this.log(`${first(personOf(side))} took ${first(rev.author)}'s version.`);
  }

  /** Keep my text, now knowingly on top of theirs; `save` saves it straight away */
  keepMine(side: Side, save = false) {
    const rev = this.theirs(side);
    if (rev) this.patch(side, { base: rev, incoming: null, rejected: null, resolving: null });
    this.log(`${first(personOf(side))} kept their own version.`);
    this.afterResolve(side, save);
  }

  /** Settle with this text, on top of their version */
  resolve(side: Side, text: string, save = false) {
    const rev = this.theirs(side);
    this.apply(side, text, { ...(rev ? { base: rev } : {}), incoming: null, rejected: null, resolving: null });
    this.log(`${first(personOf(side))} settled the conflict.`);
    this.afterResolve(side, save);
  }

  private afterResolve(side: Side, save: boolean) {
    if (this.autosaves) this.schedulePush(side, 300);
    else if (save) this.save(side);
  }

  /** Undo the last automatic merge: back to my text without their change (which then goes to the server as my edit) */
  undoMerge(side: Side) {
    const c = this.state[side];
    const m = c.merged;
    if (!m) return;
    // Their change out of what is there now, keeping anything typed since the merge
    const without = c.text === m.result ? m.mine : (this.options.mergeAll?.(m.result, c.text, m.mine) ?? m.mine);
    this.apply(side, without, { merged: null });
    this.log(`${first(personOf(side))} undid the merge of ${first(m.theirs.author)}'s change.`);
    this.schedulePush(side, 300);
  }

  dismissMerged(side: Side) {
    this.patch(side, { merged: null });
  }

  /** Close a refused save without choosing: the changes stay unsaved, and the next save is refused again */
  dismissRejected(side: Side) {
    this.patch(side, { rejected: null, pending: false });
    this.log(`${first(personOf(side))} closed the conflict without choosing: the changes stay on screen, unsaved.`);
  }

  /** Put an old version's text back, as a new edit that saves like any other */
  restore(side: Side, version: number) {
    const rev = this.state.revisions.find((r) => r.version === version);
    if (!rev) return;
    this.nextNote[side] = `Restored version ${version}`;
    this.apply(side, rev.text, { merged: null });
    this.log(`${first(personOf(side))} restored version ${version}.`);
    if (this.autosaves) this.schedulePush(side, 200);
  }

  setOnline(side: Side, on: boolean) {
    const c = this.state[side];
    if (c.online === on) return;
    const name = first(personOf(side));
    if (!on) {
      this.patch(side, { online: false, peer: null });
      // The server notices the dropped connection at once
      this.patch(other(side), { peer: this.state[other(side)].peer ? { ...this.state[other(side)].peer!, online: false, focused: false, typing: false } : null });
      this.log(`${name} went offline.`);
      return;
    }
    this.patch(side, { online: true });
    this.log(`${name} is back online.`);
    this.publish(side);
    this.publish(other(side));
    const head = this.head;
    if (head.version > c.base.version) this.receive(side, head, true);
    const now = this.state[side];
    if (this.autosaves && now.text !== now.base.text) this.schedulePush(side, 300);
    else if (!this.autosaves && now.pending) this.save(side);
  }

  // -------------------------------------------------------------------------------------------
  // Scripts

  /**
   * Types an edit as `side`: finds the text, selects what goes, then types what comes letter by
   * letter. For "you" it goes through the same path as a remote change, so a caret you have in
   * the field stays where it is.
   */
  private async typeEdit(side: Side, edit: ScriptedEdit, speed = 55): Promise<boolean> {
    const name = first(personOf(side));
    let text = this.state[side].text;
    let pos = text.indexOf(edit.find);
    if (pos < 0) {
      this.log(`${name}'s script couldn't find “${edit.find}” (already changed?), so skipped that edit.`);
      return false;
    }
    if (this.lockedFor(side)) {
      if (side === "you") {
        this.log(`Your edit was refused: the field is locked while Jonas has it. Press Edit anyway to change it.`);
        return false;
      }
      this.setEditAnyway(side, true);
    }
    /** The text may have changed under the script (a merge arrived): carry the position across */
    const follow = () => {
      const now = this.state[side].text;
      if (now !== text) {
        pos = mapSelection(text, now, { start: pos, end: pos }).start;
        text = now;
      }
    };
    const edit1 = (del: number, ins: string) => {
      follow();
      const next = text.slice(0, pos) + ins + text.slice(pos + del);
      const sel = { start: pos + ins.length, end: pos + ins.length };
      text = next;
      if (side === "them") this.type(side, next, sel);
      else this.scriptType(side, next, sel);
      pos += ins.length;
    };
    if (side === "them") this.focus(side, true);
    else {
      this.presence[side] = { ...this.presence[side], focused: true, since: this.presence[side].since || Date.now() };
      this.publish(side);
    }
    for (const part of diffChars(edit.find, edit.replace)) {
      if (this.state[side].resolving) return false;
      if (part.op === "equal") {
        follow();
        pos += part.text.length;
        continue;
      }
      if (part.op === "delete") {
        follow();
        const sel = { start: pos, end: pos + part.text.length };
        this.presence[side] = { ...this.presence[side], selection: sel };
        this.publish(side);
        if (side === "them") this.patch(side, { selection: sel });
        if (!(await this.wait(220))) return false;
        edit1(part.text.length, "");
        continue;
      }
      for (const ch of part.text) {
        if (!(await this.wait(speed))) return false;
        if (this.state[side].resolving) return false;
        edit1(0, ch);
      }
    }
    return true;
  }

  /** The script typing for you: your text changes, your own caret keeps its place */
  private scriptType(side: Side, text: string, caret: TextSelection) {
    this.apply(side, text);
    this.presence[side] = { ...this.presence[side], typing: true, selection: caret };
    this.publish(side);
    this.clear(this.typingTimer[side]);
    this.typingTimer[side] = this.later(() => {
      this.presence[side] = { ...this.presence[side], typing: false };
      this.publish(side);
    }, 1500);
    if (this.autosaves) this.schedulePush(side);
  }

  /** Jonas makes some edits and saves */
  private async jonasEdits(edits: ScriptedEdit[], onSaved?: () => void) {
    this.focus("them", true);
    if (!(await this.wait(300))) return false;
    for (const e of edits) {
      if (await this.typeEdit("them", e)) this.log(`Jonas ${e.says}.`);
      if (!(await this.wait(250))) return false;
    }
    if (this.autosaves) this.push("them");
    else this.save("them");
    onSaved?.();
    if (!(await this.wait(900))) return false;
    this.focus("them", false);
    return true;
  }

  private async yourEdits(edits: ScriptedEdit[]) {
    for (const e of edits) {
      if (await this.typeEdit("you", e)) this.log(`You ${e.says} (typed for you).`);
    }
    // Back to what your own focus says
    const focused = this.state.you.focused;
    this.presence.you = { ...this.presence.you, focused, since: focused ? this.presence.you.since : 0 };
    this.publish("you");
  }

  /** Plays a scenario. Ignored while another one is playing. */
  async run(id: ScenarioId) {
    if (this.state.running) return;
    const m = this.options.material;
    const epoch = this.epoch;
    this.state = { ...this.state, running: id };
    this.emit();
    const unchanged = () => this.state.you.text === this.state.you.base.text;
    // Jonas may have been left with a choice on his screen from your own typing: he takes the
    // latest and goes on, so his script starts from what the server has
    const j = this.state.them;
    if (j.incoming || j.rejected || j.resolving) {
      this.takeTheirs("them");
      this.log("Jonas took the latest version before going on.");
    }
    try {
      if (id === "other") {
        this.log("Jonas starts editing somewhere else.");
        await this.jonasEdits([m.theirsOther]);
      } else if (id === "same") {
        this.log("Jonas starts editing the words you are changing.");
        // Both type at once, but for the clash to land on your screen, his save has to reach the
        // server before yours: your autosave waits for it (live editing just races, as it does)
        const hold = this.autosaves && this.policy !== "live";
        if (hold) this.held.you = true;
        const release = () => {
          if (!this.held.you) return;
          this.held.you = false;
          // After his version has reached you, so it merges into your copy first
          this.later(() => {
            const c = this.state.you;
            if (c.text !== c.base.text) this.schedulePush("you", 300);
          }, this.options.latency + 100);
        };
        const jonas = this.jonasEdits([m.theirsSame], release);
        if (await this.wait(450)) await this.yourEdits([m.mine]);
        await jonas;
        release();
      } else if (id === "stale") {
        this.log("Jonas saves while his change is slow to reach you (a bad connection).");
        this.slowToYou = 2500;
        await this.jonasEdits([m.theirsOther]);
        if (epoch !== this.epoch) return;
        if (unchanged()) await this.yourEdits([m.mine]);
        this.log("You save, with the version you started from.");
        this.save("you");
        if (await this.wait(2600)) this.slowToYou = 0;
      } else if (id === "offline") {
        this.setOnline("you", false);
        if (!(await this.wait(400))) return;
        if (unchanged()) await this.yourEdits([m.mine, ...(m.mineMore ?? [])]);
        if (!(await this.wait(300))) return;
        await this.jonasEdits([m.theirsOther, m.theirsSame, ...(m.theirsMore ?? [])]);
        if (!(await this.wait(700))) return;
        this.setOnline("you", true);
        if (this.policy === "save") this.log("Back online. Your form doesn't know about Jonas's version: press Save to find out.");
      }
    } finally {
      if (epoch === this.epoch) {
        this.state = { ...this.state, running: null };
        this.emit();
      }
    }
  }
}

/**
 * A Sim for the lifetime of a component, and its current state. Not disposed on unmount: its
 * timers only touch its own state and run out within seconds, and in development React may
 * unmount and mount again while a scenario plays, which would cut it short.
 */
export function useSim(options: SimOptions): [Sim, SimState] {
  const [sim] = useState(() => new Sim(options));
  const state = useSyncExternalStore(sim.subscribe, sim.get, sim.get);
  return [sim, state];
}

// ---------------------------------------------------------------------------------------------
// Merges the prototypes use

/** Word-level three-way merge of plain text; null where both changed the same words */
export function mergeText(base: string, mine: string, theirs: string): string | null {
  const r = merge3(base, mine, theirs, "word");
  return r.conflicts ? null : mergedText(r);
}
/** Word-level merge keeping both where both changed the same words, as live editors end up doing */
export const mergeTextAll = (base: string, mine: string, theirs: string) => mergedText(merge3(base, mine, theirs, "word"), "both");

/** Block-level merge of Markdown (word-level inside blocks both changed); null where a block needs a person */
export function mergeDoc(base: string, mine: string, theirs: string): string | null {
  const r = mergeBlocks(base, mine, theirs);
  return r.conflicts ? null : mergedBlocks(r);
}
/** Block-level merge taking their side where both changed a block differently: what can be saved before a person settles it */
export const mergeDocTheirs = (base: string, mine: string, theirs: string) => mergedBlocks(mergeBlocks(base, mine, theirs), "theirs");
/** Live merge of Markdown: word-level everywhere, both kept where both typed in one spot */
export const mergeDocAll = mergeTextAll;
