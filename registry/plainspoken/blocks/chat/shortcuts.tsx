"use client";

import { useSyncExternalStore } from "react";
import { Dialog } from "@/registry/plainspoken/ui/dialog";
import { Kbd } from "@/registry/plainspoken/ui/kbd";

/** A chat shortcut: "mod" is ⌘ on a Mac and Ctrl elsewhere */
export interface ChatShortcut {
  keys: string[];
  label: string;
}

/** The chat's shortcuts, as ChatApp binds them, then the message box's own keys */
export const CHAT_SHORTCUTS: { heading: string; items: ChatShortcut[] }[] = [
  {
    heading: "Anywhere",
    items: [
      { keys: ["mod", "Shift", "O"], label: "New chat" },
      { keys: ["mod", "K"], label: "Search conversations" },
      { keys: ["Shift", "Esc"], label: "Go to the message box" },
      { keys: ["mod", "Shift", "C"], label: "Copy the last answer" },
      { keys: ["mod", "/"], label: "These shortcuts" },
    ],
  },
  {
    heading: "In the message box",
    items: [
      { keys: ["Enter"], label: "Send" },
      { keys: ["Shift", "Enter"], label: "A new line" },
      { keys: ["/"], label: "Commands and saved prompts, at the start" },
      { keys: ["Esc"], label: "Stop the answer, or cancel an edit" },
    ],
  },
];

const subscribeNever = () => () => {};
const isMac = () => /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);

/** Whether a key event is the chat shortcut `keys` ("mod" for ⌘ or Ctrl) */
export function isShortcut(e: KeyboardEvent, keys: string[]): boolean {
  const mod = keys.includes("mod");
  const shift = keys.includes("Shift");
  const key = keys.filter((k) => k !== "mod" && k !== "Shift").at(-1) ?? "";
  const pressed = e.key === "Escape" ? "Esc" : e.key.length === 1 ? e.key.toUpperCase() : e.key;
  // Shift+/ is "?" on most layouts: match the key's place too
  const code = key === "/" ? e.code === "Slash" : key.length === 1 ? e.code === `Key${key}` : false;
  return (pressed === key.toUpperCase() || pressed === key || code) && (mod ? e.metaKey || e.ctrlKey : !e.metaKey && !e.ctrlKey) && shift === e.shiftKey && !e.altKey;
}

export interface ChatShortcutsDialogProps {
  open: boolean;
  onClose: () => void;
}

/** The keyboard shortcuts, in a small dialog: ⌘ on a Mac, Ctrl elsewhere */
export function ChatShortcutsDialog({ open, onClose }: ChatShortcutsDialogProps) {
  const mac = useSyncExternalStore(subscribeNever, isMac, () => false);
  return (
    <Dialog open={open} onClose={onClose} title="Keyboard shortcuts" size="sm">
      <div className="flex flex-col gap-4">
        {CHAT_SHORTCUTS.map((g) => (
          <section key={g.heading} className="flex flex-col gap-1.5">
            <h3 className="text-[12px] font-semibold text-muted-foreground">{g.heading}</h3>
            <dl className="flex flex-col">
              {g.items.map((s) => (
                <div key={s.label} className="flex items-center justify-between gap-4 border-b border-border py-1.5 last:border-b-0">
                  <dt>{s.label}</dt>
                  <dd>
                    <Kbd keys={s.keys.map((k) => (k === "mod" ? (mac ? "⌘" : "Ctrl") : k === "Shift" && mac ? "⇧" : k))} />
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        ))}
      </div>
    </Dialog>
  );
}
