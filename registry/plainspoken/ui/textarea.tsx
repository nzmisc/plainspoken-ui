"use client";

import type { Ref, TextareaHTMLAttributes } from "react";
import { FOCUS_RING } from "@/registry/plainspoken/lib/controls";
import { useFieldProps } from "@/registry/plainspoken/ui/field";
import { cn } from "@/lib/utils";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
  /** Show "12 / 500" under the box when maxLength is set and the value is controlled */
  showCount?: boolean;
  ref?: Ref<HTMLTextAreaElement>;
}

/** Multi-line text, three rows tall to start with. Resizes vertically only. Wired to a surrounding Field like Input. */
export function Textarea({ invalid, className, id, required, showCount, maxLength, value, rows = 3, ...rest }: TextareaProps) {
  const f = useFieldProps({ id, invalid, required });
  const len = typeof value === "string" ? value.length : undefined;
  return (
    <>
      <textarea
        data-slot="textarea"
        id={f.id}
        aria-describedby={f["aria-describedby"]}
        aria-invalid={f["aria-invalid"]}
        required={f.required}
        maxLength={maxLength}
        value={value}
        rows={rows}
        className={cn(
          "block w-full min-w-0 resize-y border bg-background px-2 py-1.5 text-[14px] leading-snug placeholder:text-muted-foreground",
          "disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground",
          f.invalid ? "border-destructive" : "border-input",
          FOCUS_RING,
          className,
        )}
        {...rest}
      />
      {showCount && maxLength != null && len != null && (
        <span className={cn("self-end text-[12px] tabular-nums", len >= maxLength ? "text-warning" : "text-muted-foreground")}>
          {len} / {maxLength}
        </span>
      )}
    </>
  );
}
