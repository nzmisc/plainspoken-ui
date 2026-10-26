"use client";

import { useState } from "react";
import { Pencil, Plus, Trash } from "@/registry/plainspoken/lib/icons";
import type { ChatPrompt } from "@/registry/plainspoken/blocks/chat/data";
import { Button, IconButton } from "@/registry/plainspoken/ui/button";
import { Dialog } from "@/registry/plainspoken/ui/dialog";
import { Field } from "@/registry/plainspoken/ui/field";
import { Input } from "@/registry/plainspoken/ui/input";
import { Kbd } from "@/registry/plainspoken/ui/kbd";
import { Textarea } from "@/registry/plainspoken/ui/textarea";
import { cn } from "@/lib/utils";

/** The blanks in a prompt, {{like this}}, each once, in order */
export function promptBlanks(text: string): string[] {
  return [...new Set([...text.matchAll(/\{\{\s*([^{}]+?)\s*\}\}/g)].map((m) => m[1]))];
}

/** A prompt with its blanks filled in */
export function fillPrompt(text: string, values: Record<string, string>): string {
  return text.replace(/\{\{\s*([^{}]+?)\s*\}\}/g, (all, name: string) => values[name] ?? all);
}

const COMMAND = /^[a-z0-9][a-z0-9-]{0,23}$/;

// ---------------------------------------------------------------------------------------------
// The slash menu

/** One entry of the menu that / opens: something to do, or a saved prompt */
export interface ChatSlashItem {
  key: string;
  /** Typed after the slash */
  command: string;
  title: string;
  description?: string;
  group: "Actions" | "Prompts";
}

/** The entries that match what was typed after the slash: commands that start with it first, then titles that contain it */
export function matchSlash(items: ChatSlashItem[], query: string): ChatSlashItem[] {
  const q = query.toLowerCase();
  const starts = items.filter((i) => i.command.startsWith(q));
  const rest = items.filter((i) => !starts.includes(i) && (i.command.includes(q) || i.title.toLowerCase().includes(q)));
  return [...starts, ...rest];
}

export interface ChatSlashMenuProps {
  id: string;
  items: ChatSlashItem[];
  /** The highlighted one, moved with ↑ and ↓ from the text box (which keeps focus) */
  active: number;
  onPick: (item: ChatSlashItem) => void;
  onHover?: (index: number) => void;
  className?: string;
}

/**
 * The list that opens above the message box when a message starts with /: actions (new chat,
 * compare, export…) and saved prompts, filtered as you type. Focus stays in the box: ↑ and ↓ move
 * the highlight (the box points at it with aria-activedescendant), Enter or Tab picks it, Escape
 * closes the list.
 */
export function ChatSlashMenu({ id, items, active, onPick, onHover, className }: ChatSlashMenuProps) {
  return (
    <div data-slot="chat-slash-menu" className={cn("max-h-72 overflow-y-auto border border-border bg-background shadow-md", className)}>
      {items.length === 0 ? (
        <p className="px-3 py-2 text-[13px] text-muted-foreground">No command or prompt by that name.</p>
      ) : (
        <ul id={id} role="listbox" aria-label="Commands and prompts" className="py-1">
          {items.map((item, i) => {
            const first = i === 0 || items[i - 1].group !== item.group;
            return (
              <li key={item.key} role="presentation">
                {first && (
                  <div role="presentation" className="px-3 pt-1 pb-0.5 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
                    {item.group}
                  </div>
                )}
                <div
                  id={`${id}-${i}`}
                  role="option"
                  aria-selected={i === active}
                  onPointerDown={(e) => e.preventDefault()}
                  onClick={() => onPick(item)}
                  onPointerMove={() => onHover?.(i)}
                  className={cn("flex cursor-pointer items-baseline gap-2 px-3 py-1 text-[13px]", i === active && "bg-accent")}
                >
                  <span className="shrink-0 font-mono font-semibold">/{item.command}</span>
                  <span className="min-w-0 truncate">{item.title}</span>
                  {item.description && <span className="ml-auto min-w-0 truncate text-[12px] text-muted-foreground">{item.description}</span>}
                </div>
              </li>
            );
          })}
        </ul>
      )}
      <p className="border-t border-border px-3 py-1 text-[11px] text-muted-foreground">
        <Kbd keys={["↑"]} /> <Kbd keys={["↓"]} /> to choose, <Kbd keys={["Enter"]} /> to use, <Kbd keys={["Esc"]} /> to close
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------------------------
// Filling in a prompt's blanks

export interface ChatPromptFillProps {
  /** The prompt being used; null when closed */
  prompt: ChatPrompt | null;
  onClose: () => void;
  /** Called with the prompt's text, its blanks filled */
  onUse: (text: string) => void;
}

/** A small form with a box for each blank in a prompt ({{recipient}}, {{topic}}); Use puts the finished text in the message box. */
export function ChatPromptFill({ prompt, onClose, onUse }: ChatPromptFillProps) {
  return (
    <Dialog open={prompt != null} onClose={onClose} title={prompt ? `/${prompt.command}: ${prompt.title}` : ""} dismissOnBackdrop={false}>
      {prompt && <FillForm prompt={prompt} onClose={onClose} onUse={onUse} />}
    </Dialog>
  );
}

function FillForm({ prompt, onClose, onUse }: { prompt: ChatPrompt; onClose: () => void; onUse: (text: string) => void }) {
  const blanks = promptBlanks(prompt.text);
  const [values, setValues] = useState<Record<string, string>>({});
  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        onUse(fillPrompt(prompt.text, values));
        onClose();
      }}
    >
      {blanks.map((b, i) => {
        const long = /code|text|notes|draft/i.test(b);
        return (
          <Field key={b} label={b[0].toUpperCase() + b.slice(1)}>
            {long ? (
              <Textarea value={values[b] ?? ""} onChange={(e) => setValues((v) => ({ ...v, [b]: e.target.value }))} rows={5} data-autofocus={i === 0 || undefined} />
            ) : (
              <Input value={values[b] ?? ""} onChange={(e) => setValues((v) => ({ ...v, [b]: e.target.value }))} data-autofocus={i === 0 || undefined} />
            )}
          </Field>
        );
      })}
      <p className="border-l-2 border-border pl-2 text-[13px] whitespace-pre-wrap text-muted-foreground">{fillPrompt(prompt.text, values)}</p>
      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" variant="primary">
          Use
        </Button>
      </div>
    </form>
  );
}

// ---------------------------------------------------------------------------------------------
// The library

export interface ChatPromptLibraryProps {
  open: boolean;
  onClose: () => void;
  prompts: ChatPrompt[];
  onChange: (prompts: ChatPrompt[]) => void;
  /** Use one now: put it in the message box (its blanks are asked for first) */
  onUse?: (prompt: ChatPrompt) => void;
  /** Commands taken by the built-in actions, which a prompt can't use */
  reserved?: string[];
}

type Draft = { id: string | null; command: string; title: string; text: string };

/**
 * The saved prompts: each has a /command to call it from the message box, a title, and its text,
 * where {{blanks}} are filled in each time it is used. Add, edit, delete and use them here.
 */
export function ChatPromptLibrary({ open, onClose, prompts, onChange, onUse, reserved = [] }: ChatPromptLibraryProps) {
  const [draft, setDraft] = useState<Draft | null>(null);
  const taken = (cmd: string, id: string | null) => reserved.includes(cmd) || prompts.some((p) => p.command === cmd && p.id !== id);
  const error = draft && (!COMMAND.test(draft.command) ? "Lowercase letters, digits and dashes, up to 24." : taken(draft.command, draft.id) ? `/${draft.command} is taken.` : null);
  const close = () => {
    setDraft(null);
    onClose();
  };
  return (
    <Dialog open={open} onClose={close} title="Prompt library" description="Type / in the message box to use one." size="lg" dismissOnBackdrop={!draft}>
      {draft ? (
        <form
          className="flex flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (error || !draft.text.trim()) return;
            const p: ChatPrompt = { id: draft.id ?? `p-${Date.now().toString(36)}`, command: draft.command, title: draft.title.trim() || draft.command, text: draft.text.trim() };
            onChange(draft.id ? prompts.map((x) => (x.id === draft.id ? p : x)) : [...prompts, p]);
            setDraft(null);
          }}
        >
          <div className="grid gap-3 sm:grid-cols-[12rem_1fr]">
            <Field label="Command" error={draft.command ? error : undefined} hint="Used as /command">
              <Input prefix="/" value={draft.command} onChange={(e) => setDraft({ ...draft, command: e.target.value.toLowerCase().replace(/\s+/g, "-") })} data-autofocus />
            </Field>
            <Field label="Title">
              <Input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} maxLength={60} />
            </Field>
          </div>
          <Field label="Text" hint="Put a blank to fill in each time in double braces: {{topic}}">
            <Textarea value={draft.text} onChange={(e) => setDraft({ ...draft, text: e.target.value })} rows={6} />
          </Field>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setDraft(null)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={!!error || !draft.text.trim()}>
              Save prompt
            </Button>
          </div>
        </form>
      ) : (
        <div className="flex flex-col gap-3">
          {prompts.length === 0 ? (
            <p className="text-muted-foreground">No prompts yet.</p>
          ) : (
            <ul className="divide-y divide-border border border-border">
              {prompts.map((p) => {
                const blanks = promptBlanks(p.text);
                return (
                  <li key={p.id} className="ctl-sm flex items-start gap-3 px-3 py-2">
                    <div className="min-w-0 flex-1">
                      <p>
                        <span className="font-mono font-semibold">/{p.command}</span> <span className="font-semibold">{p.title}</span>
                        {blanks.length > 0 && <span className="text-[12px] text-muted-foreground"> · asks for {blanks.join(", ")}</span>}
                      </p>
                      <p className="line-clamp-2 text-[13px] text-muted-foreground">{p.text}</p>
                    </div>
                    {onUse && (
                      <Button
                        onClick={() => {
                          close();
                          onUse(p);
                        }}
                      >
                        Use
                      </Button>
                    )}
                    <IconButton variant="ghost" icon={Pencil} label={`Edit /${p.command}`} onClick={() => setDraft({ id: p.id, command: p.command, title: p.title, text: p.text })} />
                    <IconButton variant="ghost" icon={Trash} label={`Delete /${p.command}`} onClick={() => onChange(prompts.filter((x) => x.id !== p.id))} />
                  </li>
                );
              })}
            </ul>
          )}
          <div>
            <Button icon={Plus} onClick={() => setDraft({ id: null, command: "", title: "", text: "" })}>
              New prompt
            </Button>
          </div>
        </div>
      )}
    </Dialog>
  );
}
