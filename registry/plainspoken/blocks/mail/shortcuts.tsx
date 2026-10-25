"use client";

import { Button } from "@/registry/plainspoken/ui/button";
import { Dialog } from "@/registry/plainspoken/ui/dialog";
import { Kbd } from "@/registry/plainspoken/ui/kbd";

/** The mail app's shortcuts, in the order the help dialog lists them */
export const MAIL_SHORTCUTS: { group: string; items: { keys: string[]; label: string }[] }[] = [
  {
    group: "Moving around",
    items: [
      { keys: ["j"], label: "Next (older) conversation" },
      { keys: ["k"], label: "Previous (newer) conversation" },
      { keys: ["Enter"], label: "Open the conversation" },
      { keys: ["o"], label: "Open the conversation" },
      { keys: ["Esc"], label: "Back to the list" },
      { keys: ["/"], label: "Search" },
      { keys: ["?"], label: "Show these shortcuts" },
    ],
  },
  {
    group: "Acting on conversations",
    items: [
      { keys: ["x"], label: "Tick or untick the conversation" },
      { keys: ["e"], label: "Archive" },
      { keys: ["#"], label: "Delete" },
      { keys: ["s"], label: "Star or unstar" },
      { keys: ["Shift", "u"], label: "Mark as unread" },
    ],
  },
  {
    group: "Writing",
    items: [
      { keys: ["c"], label: "Compose a new message" },
      { keys: ["r"], label: "Reply" },
      { keys: ["a"], label: "Reply all" },
      { keys: ["f"], label: "Forward" },
      { keys: ["Ctrl", "Enter"], label: "Send (⌘+Enter on a Mac)" },
    ],
  },
];

export interface MailShortcutsDialogProps {
  open: boolean;
  onClose: () => void;
}

/** The list of keyboard shortcuts, in a dialog: what "?" opens. */
export function MailShortcutsDialog({ open, onClose }: MailShortcutsDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} title="Keyboard shortcuts" description="Single keys, not counted while you are typing in a field." footer={<Button onClick={onClose}>Close</Button>}>
      <div className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
        {MAIL_SHORTCUTS.map((g) => (
          <section key={g.group} className={g.group === "Moving around" ? "sm:row-span-2" : undefined}>
            <h3 className="mb-1 text-[13px] font-bold">{g.group}</h3>
            <table className="w-full text-[14px]">
              <tbody>
                {g.items.map((s) => (
                  <tr key={s.label + s.keys.join()} className="border-b border-border last:border-b-0">
                    <td className="w-24 py-1 pr-3 align-top whitespace-nowrap">
                      <Kbd keys={s.keys} />
                    </td>
                    <td className="py-1">{s.label}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        ))}
      </div>
    </Dialog>
  );
}
