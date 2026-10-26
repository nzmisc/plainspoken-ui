"use client";

import { useSyncExternalStore, type ReactNode } from "react";
import { ALargeSmall } from "@/registry/plainspoken/lib/icons";
import type { ControlSize } from "@/registry/plainspoken/lib/controls";
import { Button } from "@/registry/plainspoken/ui/button";
import { Popover } from "@/registry/plainspoken/ui/popover";
import { SegmentedControl } from "@/registry/plainspoken/ui/segmented-control";
import { Switch } from "@/registry/plainspoken/ui/switch";

export type BibleTextSize = "sm" | "md" | "lg" | "xl";

export interface BibleReaderPrefs {
  size: BibleTextSize;
  font: "sans" | "serif";
  /** Verse numbers shown */
  numbers: boolean;
  /** Verses run on in paragraphs, or each starts a new line */
  layout: "paragraphs" | "lines";
}

export const DEFAULT_READER_PREFS: BibleReaderPrefs = { size: "md", font: "sans", numbers: true, layout: "paragraphs" };

/** Writes the settings onto <html> as data-bible-size, -font, -numbers and -layout, which BibleChapter's styles follow */
function apply(p: BibleReaderPrefs) {
  const d = document.documentElement.dataset;
  d.bibleSize = p.size;
  d.bibleFont = p.font;
  d.bibleNumbers = p.numbers ? "on" : "off";
  d.bibleLayout = p.layout;
}

// The settings live on <html>; every BibleReaderSettings on the page reads them from there and is
// told when one of them changes them.
const listeners = new Set<() => void>();
const subscribe = (onChange: () => void) => {
  listeners.add(onChange);
  return () => {
    listeners.delete(onChange);
  };
};
const snapshot = () => {
  const d = document.documentElement.dataset;
  return [d.bibleSize, d.bibleFont, d.bibleNumbers, d.bibleLayout].join("|");
};

/** The settings as they are on <html> now (set by an earlier chapter, or by your own script) */
function parse(key: string): BibleReaderPrefs {
  const [size, font, numbers, layout] = key.split("|");
  return {
    size: (["sm", "md", "lg", "xl"].includes(size) ? size : DEFAULT_READER_PREFS.size) as BibleTextSize,
    font: font === "serif" ? "serif" : "sans",
    numbers: numbers !== "off",
    layout: layout === "lines" ? "lines" : "paragraphs",
  };
}

export interface BibleReaderSettingsProps {
  /** Trigger and controls size. Default: the surrounding size. */
  size?: ControlSize;
  /** Start open (stories, screenshots) */
  defaultOpen?: boolean;
}

function Setting({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span aria-hidden className="text-[13px] font-medium">
        {label}
      </span>
      {children}
    </div>
  );
}

/**
 * The reader's display settings in a popover: text size, typeface, paragraphs or one verse per
 * line, and verse numbers on or off. They show at once: they are data attributes on <html>, which
 * BibleChapter's styles follow, so they also hold from one chapter to the next. To remember them
 * between visits, save them (in localStorage, say) and set the same attributes from an inline
 * script in <head>, so the text never paints in the wrong size first.
 */
export function BibleReaderSettings({ size, defaultOpen }: BibleReaderSettingsProps) {
  // The server can't know what an earlier chapter set, so it (and hydration) see the defaults
  const p = parse(useSyncExternalStore(subscribe, snapshot, () => ""));
  const change = (patch: Partial<BibleReaderPrefs>) => {
    apply({ ...p, ...patch });
    listeners.forEach((l) => l());
  };
  return (
    <Popover
      title="Reader settings"
      size={size}
      defaultOpen={defaultOpen}
      align="end"
      trigger={(props) => (
        <Button {...props} icon={ALargeSmall} size={size}>
          Display
        </Button>
      )}
      className="w-[20rem]"
    >
      <div data-slot="bible-reader-settings" className="flex flex-col gap-3">
        <Setting label="Text size">
          <SegmentedControl
            label="Text size"
            value={p.size}
            onChange={(v) => change({ size: v })}
            options={[
              { value: "sm", label: "Small" },
              { value: "md", label: "Normal" },
              { value: "lg", label: "Large" },
              { value: "xl", label: "Larger" },
            ]}
          />
        </Setting>
        <Setting label="Typeface">
          <SegmentedControl
            label="Typeface"
            value={p.font}
            onChange={(v) => change({ font: v })}
            options={[
              { value: "sans", label: "Sans-serif" },
              { value: "serif", label: "Serif" },
            ]}
          />
        </Setting>
        <Setting label="Layout">
          <SegmentedControl
            label="Layout"
            value={p.layout}
            onChange={(v) => change({ layout: v })}
            options={[
              { value: "paragraphs", label: "Paragraphs" },
              { value: "lines", label: "Verse per line" },
            ]}
          />
        </Setting>
        <Switch checked={p.numbers} onChange={(v) => change({ numbers: v })} label="Verse numbers" />
        <div className="border-t border-border pt-2">
          <Button variant="link" size="sm" onClick={() => change(DEFAULT_READER_PREFS)}>
            Back to the defaults
          </Button>
        </div>
      </div>
    </Popover>
  );
}
