"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState, useSyncExternalStore, type ClipboardEvent, type KeyboardEvent, type ReactNode } from "react";
import { ArrowUp, Mic, MicOff, Paperclip, Square } from "@/registry/plainspoken/lib/icons";
import { CHAT_LIMITS } from "@/registry/plainspoken/blocks/chat/models";
import { ATTACHMENT_ACCEPT, readAttachment, type ChatAttachment } from "@/registry/plainspoken/blocks/chat/attachments";
import { ChatAttachmentChips } from "@/registry/plainspoken/blocks/chat/attachment-chips";
import { ChatSlashMenu, matchSlash, type ChatSlashItem } from "@/registry/plainspoken/blocks/chat/prompt-library";
import { Button, IconButton } from "@/registry/plainspoken/ui/button";
import { Kbd } from "@/registry/plainspoken/ui/kbd";
import { Textarea } from "@/registry/plainspoken/ui/textarea";
import { cn } from "@/lib/utils";

// The Web Speech API's recognition, where the browser has it (Chrome and Safari, prefixed)
type Recognition = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((e: { resultIndex: number; results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }> }) => void) | null;
  onend: (() => void) | null;
  onerror: ((e: { error: string }) => void) | null;
};
const recognitionClass = (): (new () => Recognition) | undefined =>
  typeof window === "undefined" ? undefined : ((window as unknown as Record<string, unknown>).SpeechRecognition ?? (window as unknown as Record<string, unknown>).webkitSpeechRecognition) as (new () => Recognition) | undefined;
const subscribeNever = () => () => {};

/**
 * Adds files to a list of attachments: each is read (pictures made smaller) and checked, at most
 * CHAT_LIMITS.maxFiles in all; the ones over the limit come back refused.
 */
export async function addAttachments(current: ChatAttachment[], files: File[], update: (next: (list: ChatAttachment[]) => ChatAttachment[]) => void) {
  const room = CHAT_LIMITS.maxFiles - current.length;
  const taken = files.slice(0, Math.max(0, room));
  const refused = files.slice(Math.max(0, room)).map(
    (f, i): ChatAttachment => ({ id: `over-${Date.now()}-${i}`, name: f.name || "file", mediaType: f.type, size: f.size, status: "error", error: `One too many: a message can have ${CHAT_LIMITS.maxFiles} files.` }),
  );
  const placeholders = taken.map((f, i): ChatAttachment => ({ id: `reading-${Date.now()}-${i}`, name: f.name || "file", mediaType: f.type, size: f.size, status: "reading" }));
  update((list) => [...list, ...placeholders, ...refused]);
  await Promise.all(
    taken.map(async (f, i) => {
      const read = await readAttachment(f);
      update((list) => list.map((a) => (a.id === placeholders[i].id ? read : a)));
    }),
  );
}

export interface ChatComposerProps {
  /** The text, controlled; or leave out and use defaultValue */
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  /**
   * Called with the text (trimmed) and the files ready to go, on Enter or the send button. The
   * box (and the files, when the composer keeps them) empties itself when uncontrolled.
   */
  onSend: (text: string, attachments: ChatAttachment[]) => void;
  /** An answer is coming in: the send button becomes Stop, and Enter does nothing */
  streaming?: boolean;
  /** Stop the answer */
  onStop?: () => void;
  disabled?: boolean;
  /** The text box's accessible name. Default "Message". */
  label?: string;
  placeholder?: string;
  /** Words on the send button. Default "Send". */
  sendLabel?: string;
  /** Escape in the box: cancel an edit */
  onCancel?: () => void;
  /** Controls on the left under the box: a model picker, a toggle */
  tools?: ReactNode;
  /** Small print before the button. Default: Shift+Enter for a new line (hidden when the box is narrow). null for none. */
  hint?: ReactNode;
  /** Most lines the box grows to before it scrolls. Default 10. */
  maxRows?: number;
  autoFocus?: boolean;
  /** Offer attaching files (the paperclip, pasting and dropping files on the box) */
  attach?: boolean;
  /** The files, controlled; leave out to let the composer keep them */
  attachments?: ChatAttachment[];
  onAttachmentsChange?: (next: ChatAttachment[]) => void;
  /** A line under the files: what the model will make of them */
  attachmentNote?: ReactNode;
  /** What / opens: actions and prompts */
  slash?: ChatSlashItem[];
  /** One was picked from the / list; the box is cleared first */
  onSlash?: (item: ChatSlashItem) => void;
  /** Offer speaking instead of typing, where the browser can listen (Chrome, Safari) */
  voice?: boolean;
  className?: string;
}

/**
 * The box a message is written in: a text area that grows with what is typed (up to `maxRows`,
 * then it scrolls), with tools on the left under it and the send button on the right. Enter sends,
 * Shift+Enter starts a new line, and while a character is being composed (Japanese, Chinese input)
 * Enter goes to the input method. While an answer streams the button turns into Stop, in place,
 * so focus stays on it; pressing Stop puts focus back in the box.
 *
 * With `attach`, files come from the paperclip, from pasting (a screenshot) or from dropping them
 * on the box, and wait above it as chips with a thumbnail, name and size, and × to remove one.
 * With `slash`, a / at the start opens a list of actions and prompts to pick from with the arrow
 * keys. With `voice`, the microphone turns speech into text in the box (the browser's own speech
 * recognition; Chrome sends the audio to Google to do it).
 */
export function ChatComposer({
  value: valueProp,
  defaultValue = "",
  onValueChange,
  onSend,
  streaming = false,
  onStop,
  disabled = false,
  label = "Message",
  placeholder,
  sendLabel = "Send",
  onCancel,
  tools,
  hint,
  maxRows = 10,
  autoFocus,
  attach = false,
  attachments: attachmentsProp,
  onAttachmentsChange,
  attachmentNote,
  slash,
  onSlash,
  voice = false,
  className,
}: ChatComposerProps) {
  const [own, setOwn] = useState(defaultValue);
  const value = valueProp ?? own;
  const [ownFiles, setOwnFiles] = useState<ChatAttachment[]>([]);
  const files = attachmentsProp ?? ownFiles;
  const filesRef = useRef(files);
  useEffect(() => {
    filesRef.current = files;
  }, [files]);
  const box = useRef<HTMLTextAreaElement>(null);
  const picker = useRef<HTMLInputElement>(null);
  const hintId = useId();
  const menuId = useId();
  const [active, setActive] = useState(0);
  const [dismissed, setDismissed] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [listening, setListening] = useState(false);
  const recognition = useRef<Recognition | null>(null);
  const canListen = useSyncExternalStore(subscribeNever, () => !!recognitionClass(), () => false);

  // Grow to fit: measure from one row each time, so it shrinks again too
  useLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    const cs = getComputedStyle(el);
    const line = parseFloat(cs.lineHeight) || 20;
    const border = parseFloat(cs.borderTopWidth) + parseFloat(cs.borderBottomWidth);
    const max = line * maxRows + parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom) + border;
    el.style.height = "auto";
    // scrollHeight has the padding but not the border; the box is border-box
    const needed = el.scrollHeight + border;
    el.style.height = `${Math.min(needed, max)}px`;
    el.style.overflowY = needed > max ? "auto" : "hidden";
  }, [value, maxRows]);

  useEffect(() => () => recognition.current?.stop(), []);

  const set = (v: string) => {
    if (valueProp == null) setOwn(v);
    onValueChange?.(v);
  };
  const setFiles = (change: (list: ChatAttachment[]) => ChatAttachment[]) => {
    const next = change(filesRef.current);
    filesRef.current = next;
    if (attachmentsProp == null) setOwnFiles(next);
    onAttachmentsChange?.(next);
  };
  const add = (list: File[]) => {
    if (!attach || !list.length) return;
    void addAttachments(filesRef.current, list, setFiles);
  };

  // The / list: open while the box holds only "/word" at its start
  const query = slash && /^\/([\w-]*)$/.exec(value)?.[1];
  const matches = query != null && slash && dismissed !== value ? matchSlash(slash, query) : null;
  const open = !!matches;
  const pick = (item: ChatSlashItem) => {
    set("");
    setActive(0);
    onSlash?.(item);
  };

  const reading = files.some((f) => f.status === "reading");
  const ready = files.filter((f) => f.status === "ready");
  const send = () => {
    const text = value.trim();
    if ((!text && !ready.length) || disabled || streaming || reading) return;
    onSend(text, ready);
    if (valueProp == null) setOwn("");
    if (attachmentsProp == null) setOwnFiles([]);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (open && matches) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        const n = matches.length || 1;
        setActive((a) => (a + (e.key === "ArrowDown" ? 1 : n - 1)) % n);
        return;
      }
      if ((e.key === "Enter" || e.key === "Tab") && !e.shiftKey && matches[active]) {
        e.preventDefault();
        pick(matches[active]);
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        setDismissed(value);
        return;
      }
    }
    if (e.key === "Escape" && onCancel) {
      e.preventDefault();
      onCancel();
    } else if (e.key === "Escape" && streaming && onStop) {
      e.preventDefault();
      onStop();
    } else if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      send();
    }
  };

  const onPaste = (e: ClipboardEvent<HTMLTextAreaElement>) => {
    if (!attach) return;
    const pasted = Array.from(e.clipboardData.files);
    // A screenshot comes as a file alone; text copied from a page may carry a picture of itself too
    if (pasted.length && !e.clipboardData.getData("text/plain")) {
      e.preventDefault();
      add(pasted);
    }
  };

  const toggleVoice = () => {
    if (listening) {
      recognition.current?.stop();
      return;
    }
    const R = recognitionClass();
    if (!R) return;
    const r = new R();
    r.lang = document.documentElement.lang || navigator.language || "en";
    r.interimResults = false;
    r.continuous = true;
    const start = value;
    let heard = "";
    r.onresult = (e) => {
      for (let i = e.resultIndex; i < e.results.length; i++) if (e.results[i].isFinal) heard += e.results[i][0].transcript;
      set(`${start}${start && heard && !/\s$/.test(start) ? " " : ""}${heard.trim()}`);
    };
    r.onend = () => {
      setListening(false);
      recognition.current = null;
      box.current?.focus();
    };
    r.onerror = () => r.stop();
    recognition.current = r;
    setListening(true);
    r.start();
  };

  const empty = value.trim() === "" && ready.length === 0;
  return (
    <form
      data-slot="chat-composer"
      className={cn("@container relative flex flex-col gap-1.5", className)}
      onSubmit={(e) => {
        e.preventDefault();
        send();
      }}
      onDragEnter={(e) => attach && e.dataTransfer.types.includes("Files") && setDragging(true)}
      onDragOver={(e) => {
        if (!attach || !e.dataTransfer.types.includes("Files")) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = "copy";
      }}
      onDragLeave={(e) => !e.currentTarget.contains(e.relatedTarget as Node | null) && setDragging(false)}
      onDrop={(e) => {
        if (!attach || !e.dataTransfer.files.length) return;
        e.preventDefault();
        // The page's own drop zone mustn't take these as well
        e.stopPropagation();
        setDragging(false);
        add(Array.from(e.dataTransfer.files));
      }}
    >
      {open && matches && (
        <ChatSlashMenu
          id={menuId}
          items={matches}
          active={Math.min(active, Math.max(0, matches.length - 1))}
          onPick={pick}
          onHover={setActive}
          className="absolute inset-x-0 bottom-full z-20 mb-1"
        />
      )}
      {(files.length > 0 || attachmentNote) && (
        <div className="flex flex-col gap-1">
          <ChatAttachmentChips attachments={files} onRemove={(id) => setFiles((list) => list.filter((a) => a.id !== id))} />
          {attachmentNote && files.length > 0 && <p className="text-[12px] text-muted-foreground">{attachmentNote}</p>}
        </div>
      )}
      <Textarea
        ref={box}
        aria-label={label}
        aria-describedby={hint === null ? undefined : hintId}
        aria-autocomplete={slash ? "list" : undefined}
        aria-expanded={slash ? open : undefined}
        aria-controls={open ? menuId : undefined}
        aria-activedescendant={open && matches?.length ? `${menuId}-${Math.min(active, matches.length - 1)}` : undefined}
        value={value}
        onChange={(e) => {
          set(e.target.value);
          setActive(0);
        }}
        onKeyDown={onKeyDown}
        onPaste={onPaste}
        placeholder={placeholder}
        disabled={disabled}
        autoFocus={autoFocus}
        enterKeyHint="send"
        rows={1}
        className={cn("resize-none py-2 text-[14px] leading-[20px]", dragging && "border-primary outline-2 outline-primary")}
      />
      {dragging && (
        <div aria-hidden className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center border-2 border-dashed border-primary bg-background/85 text-[13px] font-medium">
          Drop to attach
        </div>
      )}
      <div className="flex items-end gap-2">
        {/* Tools wrap among themselves on a narrow screen; the send button stays at the right */}
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-1.5">
          {attach && (
            <>
              <IconButton
                variant="ghost"
                icon={Paperclip}
                label={`Attach files (pictures, PDFs, text; up to ${CHAT_LIMITS.maxFiles}, ${CHAT_LIMITS.maxFileBytes / 1024 / 1024} MB each)`}
                disabled={disabled || files.length >= CHAT_LIMITS.maxFiles}
                onClick={() => picker.current?.click()}
              />
              <input
                ref={picker}
                type="file"
                multiple
                accept={ATTACHMENT_ACCEPT}
                tabIndex={-1}
                aria-hidden
                className="hidden"
                onChange={(e) => {
                  add(Array.from(e.target.files ?? []));
                  e.target.value = "";
                }}
              />
            </>
          )}
          {voice && canListen && (
            <IconButton
              variant="ghost"
              icon={listening ? MicOff : Mic}
              label={listening ? "Stop listening" : "Speak instead of typing"}
              aria-pressed={listening}
              disabled={disabled}
              onClick={toggleVoice}
              className={cn(listening && "text-destructive")}
            />
          )}
          {tools}
        </div>
        {hint !== null && (
          <span id={hintId} className="self-center text-[12px] whitespace-nowrap text-muted-foreground @max-5xl:sr-only">
            {hint ?? (
              <>
                <Kbd keys={["Shift", "Enter"]} /> for a new line{slash ? ", / for commands" : ""}
              </>
            )}
          </span>
        )}
        {/* One button that changes, rather than two, so keyboard focus survives the switch */}
        <Button
          type={streaming ? "button" : "submit"}
          variant={streaming ? "default" : "primary"}
          icon={streaming ? Square : ArrowUp}
          disabled={streaming ? !onStop : disabled || empty || reading}
          onClick={
            streaming
              ? () => {
                  onStop?.();
                  // Send is disabled with an empty box, which would drop focus: the box is where it goes next
                  box.current?.focus();
                }
              : undefined
          }
          className="shrink-0"
        >
          {streaming ? "Stop" : sendLabel}
        </Button>
      </div>
      {listening && (
        <p role="status" className="text-[12px] text-destructive">
          Listening… speak, then press the microphone again to stop.
        </p>
      )}
    </form>
  );
}
