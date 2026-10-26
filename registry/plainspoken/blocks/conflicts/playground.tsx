"use client";

import { useEffect, useId, useState, type ReactNode } from "react";
import { LoaderCircle, RotateCcw } from "@/registry/plainspoken/lib/icons";
import { Badge } from "@/registry/plainspoken/ui/badge";
import { Button } from "@/registry/plainspoken/ui/button";
import { Icon } from "@/registry/plainspoken/ui/icon";
import { Switch } from "@/registry/plainspoken/ui/switch";
import { PresenceAvatar } from "@/registry/plainspoken/ui/presence";
import { AMARA, JONAS } from "@/registry/plainspoken/blocks/conflicts/content";
import type { ScenarioId, Side, Sim, SimState } from "@/registry/plainspoken/blocks/conflicts/sim";
import { cn } from "@/lib/utils";

/** What the page says about an approach */
export interface ApproachInfo {
  /** "A" */
  letter: string;
  /** "Presence + soft lock" */
  name: string;
  /** One line: when it suits */
  suits: string;
  /** What it does well */
  pro: string;
  /** What it costs */
  con: string;
  /** One line on how to try it here */
  howTo: ReactNode;
}

const SCENARIOS: Record<"text" | "doc", { id: ScenarioId; label: string }[]> = {
  text: [
    { id: "other", label: "Jonas edits a different sentence" },
    { id: "same", label: "Jonas edits the same sentence" },
    { id: "stale", label: "Save with an old version" },
    { id: "offline", label: "Go offline, edit, reconnect" },
  ],
  doc: [
    { id: "other", label: "Jonas edits a different paragraph" },
    { id: "same", label: "Jonas edits the same sentence" },
    { id: "stale", label: "Save with an old version" },
    { id: "offline", label: "Go offline, edit, reconnect" },
  ],
};

export interface ConflictPlaygroundProps {
  sim: Sim;
  state: SimState;
  info: ApproachInfo;
  /** Which words the scenario buttons use: sentences in a text box, paragraphs in a document */
  kind?: "text" | "doc";
  /** Draws one person's screen */
  renderSide: (side: Side) => ReactNode;
  /** Show Jonas's screen next to yours from the start */
  defaultSplit?: boolean;
  /** Leave out the name, fit and trade-offs (when the page shows them itself) */
  hideInfo?: boolean;
  /** Play a scenario as soon as it's on screen: for stories and screenshots */
  autoplay?: ScenarioId;
  className?: string;
}

/**
 * The frame every edit-conflict prototype sits in: the approach's name, when it suits and what
 * it costs; buttons that play the scenarios (Jonas editing elsewhere, the same words, a save
 * based on an old version, an offline spell); your screen, and Jonas's next to it if you want to
 * play both; and a log of what happened, newest first.
 */
export function ConflictPlayground({ sim, state, info, kind = "text", renderSide, defaultSplit = false, hideInfo = false, autoplay, className }: ConflictPlaygroundProps) {
  const id = useId();
  useEffect(() => {
    if (!autoplay) return;
    const t = setTimeout(() => void sim.run(autoplay), 400);
    return () => clearTimeout(t);
  }, [sim, autoplay]);
  const [split, setSplit] = useState(defaultSplit);
  const running = state.running;
  const scenarios = SCENARIOS[kind];
  return (
    <section aria-labelledby={`${id}-name`} data-slot="conflict-playground" className={cn("flex min-w-0 flex-col gap-3 text-[14px]", className)}>
      <header className={cn("flex flex-col gap-1", hideInfo && "sr-only")}>
        <h3 id={`${id}-name`} className="text-[15px] font-bold">
          {info.letter}. {info.name}
        </h3>
        <p>
          <span className="font-semibold">Suits:</span> {info.suits}
        </p>
        <p className="text-[13px] text-muted-foreground">
          <span className="font-semibold text-foreground">+</span> {info.pro} <span className="ml-2 font-semibold text-foreground">−</span> {info.con}
        </p>
      </header>

      <div className="flex flex-col gap-2 border border-border bg-muted px-2 py-2">
        <p className="text-[13px]">
          <span className="font-semibold">Try it:</span> {info.howTo}
        </p>
        <div role="group" aria-label="Simulate" className="ctl-sm flex flex-wrap items-center gap-1.5">
          <span className="mr-0.5 text-[13px] text-muted-foreground">Simulate:</span>
          {scenarios.map((s) => (
            <Button
              key={s.id}
              disabled={!!running}
              icon={running === s.id ? <Icon icon={LoaderCircle} className="animate-spin motion-reduce:animate-none" /> : undefined}
              onClick={() => void sim.run(s.id)}
            >
              {s.label}
            </Button>
          ))}
          <Button variant="ghost" icon={RotateCcw} onClick={() => sim.reset()}>
            Reset
          </Button>
          <Switch className="ml-auto" checked={split} onChange={setSplit} label="Show Jonas's screen too" showState={false} />
        </div>
      </div>

      <div className={cn("grid gap-3", split && "lg:grid-cols-2")}>
        <Screen sim={sim} state={state} side="you">
          {renderSide("you")}
        </Screen>
        {split && (
          <Screen sim={sim} state={state} side="them">
            {renderSide("them")}
          </Screen>
        )}
      </div>

      <SimLog state={state} />
    </section>
  );
}

/** One person's screen: who it is, their connection, and the prototype */
function Screen({ sim, state, side, children }: { sim: Sim; state: SimState; side: Side; children: ReactNode }) {
  const c = state[side];
  const person = side === "you" ? AMARA : JONAS;
  return (
    <section aria-label={side === "you" ? "Your screen" : "Jonas's screen"} className="min-w-0 border border-border">
      <div className="ctl-sm flex min-h-[29px] flex-wrap items-center gap-x-2 gap-y-1 border-b border-border bg-muted px-2 py-0.5 text-[13px]">
        <PresenceAvatar person={person} size={18} />
        <span className="font-semibold">{side === "you" ? `${person.name} (you)` : `${person.name}'s screen`}</span>
        {!c.online && (
          <Badge variant="warning">Offline</Badge>
        )}
        <span className="text-muted-foreground">
          version {c.base.version}
          {c.text !== c.base.text && ", changed"}
        </span>
        <Switch className="ml-auto" checked={c.online} onChange={(on) => sim.setOnline(side, on)} label="Online" showState={false} />
      </div>
      <div className="p-3">{children}</div>
    </section>
  );
}

const time = (ms: number) => new Date(ms).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });

/** What happened, newest first: saves, refusals, merges, the network */
export function SimLog({ state, className }: { state: SimState; className?: string }) {
  return (
    <details className={cn("border border-border text-[13px]", className)} open>
      <summary className="cursor-pointer bg-muted px-2 py-0.5 font-semibold">
        What happened <span className="font-normal text-muted-foreground">(newest first; the server has {state.revisions.length} {state.revisions.length === 1 ? "version" : "versions"})</span>
      </summary>
      {state.log.length === 0 ? (
        <p className="px-2 py-1 text-muted-foreground">Nothing yet. Type in the box, or press a Simulate button.</p>
      ) : (
        <ol className="max-h-32 overflow-y-auto px-2 py-1">
          {state.log.map((e) => (
            <li key={e.id} className="flex gap-2">
              <span className="shrink-0 font-mono text-[12px] text-muted-foreground tabular-nums">{time(e.at)}</span>
              <span>{e.text}</span>
            </li>
          ))}
        </ol>
      )}
    </details>
  );
}
