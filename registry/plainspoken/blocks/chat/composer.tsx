"use client";

import { useId, useLayoutEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { ArrowUp, Square } from "@/registry/plainspoken/lib/icons";
import { Button } from "@/registry/plainspoken/ui/button";
import { Kbd } from "@/registry/plainspoken/ui/kbd";
import { Textarea } from "@/registry/plainspoken/ui/textarea";
import { cn } from "@/lib/utils";

export interface ChatComposerProps {
  /** The text, controlled; or leave out and use defaultValue */
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  /** Called with the text (trimmed) on Enter or the send button. The box empties itself when uncontrolled. */
  onSend: (text: string) => void;
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
  className?: string;
}

/**
 * The box a message is written in: a text area that grows with what is typed (up to `maxRows`,
 * then it scrolls), with tools on the left under it and the send button on the right. Enter sends,
 * Shift+Enter starts a new line, and while a character is being composed (Japanese, Chinese input)
 * Enter goes to the input method. While an answer streams the button turns into Stop, in place,
 * so focus stays on it; pressing Stop puts focus back in the box.
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
  className,
}: ChatComposerProps) {
  const [own, setOwn] = useState(defaultValue);
  const value = valueProp ?? own;
  const box = useRef<HTMLTextAreaElement>(null);
  const hintId = useId();

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

  const set = (v: string) => {
    if (valueProp == null) setOwn(v);
    onValueChange?.(v);
  };

  const send = () => {
    const text = value.trim();
    if (!text || disabled || streaming) return;
    onSend(text);
    if (valueProp == null) setOwn("");
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Escape" && onCancel) {
      e.preventDefault();
      onCancel();
    } else if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      send();
    }
  };

  const empty = value.trim() === "";
  return (
    <form
      data-slot="chat-composer"
      className={cn("@container flex flex-col gap-1.5", className)}
      onSubmit={(e) => {
        e.preventDefault();
        send();
      }}
    >
      <Textarea
        ref={box}
        aria-label={label}
        aria-describedby={hint === null ? undefined : hintId}
        value={value}
        onChange={(e) => set(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        autoFocus={autoFocus}
        enterKeyHint="send"
        rows={1}
        className="resize-none py-2 text-[14px] leading-[20px]"
      />
      <div className="flex items-end gap-2">
        {/* Tools wrap among themselves on a narrow screen; the send button stays at the right */}
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-1.5">{tools}</div>
        {hint !== null && (
          <span id={hintId} className="self-center text-[12px] whitespace-nowrap text-muted-foreground @max-2xl:sr-only">
            {hint ?? (
              <>
                <Kbd keys={["Shift", "Enter"]} /> for a new line
              </>
            )}
          </span>
        )}
        {/* One button that changes, rather than two, so keyboard focus survives the switch */}
        <Button
          type={streaming ? "button" : "submit"}
          variant={streaming ? "default" : "primary"}
          icon={streaming ? Square : ArrowUp}
          disabled={streaming ? !onStop : disabled || empty}
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
    </form>
  );
}
