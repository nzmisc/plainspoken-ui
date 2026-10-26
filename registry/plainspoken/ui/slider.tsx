"use client";

import { useId, useState, type CSSProperties, type InputHTMLAttributes, type ReactNode, type Ref } from "react";
import { controlSize, type ControlSize } from "@/registry/plainspoken/lib/controls";
import { cn } from "@/lib/utils";

export interface SliderProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "value" | "defaultValue" | "onChange" | "size" | "min" | "max" | "step"> {
  /** Visible label above the track, with the value at the right of the same line. Leave out for a bare track (then give it an aria-label). */
  label?: ReactNode;
  value?: number;
  defaultValue?: number;
  /** Every step while dragging or pressing keys */
  onChange?: (value: number) => void;
  /** Once, when the reader lets go (pointer up, or a key released): seek here, save this */
  onCommit?: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  /** How to print a value, for the readout and for screen readers: (v) => `${v}%`, a time "1:23" */
  format?: (value: number) => string;
  /** Print the value after the label (or after the track, when there is no label). Default: true with a label. */
  showValue?: boolean;
  /** Values to mark under the track, labelled with `format` */
  marks?: number[];
  /** Height of the track's box, from the shared scale, so it lines up with controls beside it */
  size?: ControlSize;
  /** Classes for the outer box: width */
  className?: string;
  ref?: Ref<HTMLInputElement>;
}

// The native range input with its track and thumb redrawn: a 4px track filled in the main colour up
// to the value (the --fill variable; WebKit has no "progress" part of its own) and a square thumb.
const RANGE = cn(
  "block h-(--ctl-h) w-full min-w-0 cursor-pointer appearance-none bg-transparent disabled:cursor-not-allowed disabled:opacity-50",
  "focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring",
  "[--thumb:calc(var(--ctl-icon)-2px)] [--track:4px]",
  "[&::-webkit-slider-runnable-track]:h-(--track) [&::-webkit-slider-runnable-track]:bg-[linear-gradient(to_right,var(--color-primary)_var(--fill),var(--color-accent)_var(--fill))]",
  "[&::-webkit-slider-thumb]:mt-[calc((var(--track)-var(--thumb))/2)] [&::-webkit-slider-thumb]:size-(--thumb) [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:border-0 [&::-webkit-slider-thumb]:bg-primary",
  "[&::-moz-range-track]:h-(--track) [&::-moz-range-track]:bg-accent",
  "[&::-moz-range-progress]:h-(--track) [&::-moz-range-progress]:bg-primary",
  "[&::-moz-range-thumb]:size-(--thumb) [&::-moz-range-thumb]:[border-radius:0] [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-primary",
);

/**
 * A native range input, redrawn thin: a 4px track filled in the main colour, a square thumb, in a
 * box as tall as a control so it lines up with buttons beside it (a player's seek and volume bars).
 * The browser's keyboard handling is kept (←/→ and ↑/↓ step, Page Up/Down jump, Home/End go to
 * the ends), and screen readers hear the formatted value ("1:23", "80%") through aria-valuetext.
 * With a `label` it shows the label and the value on one line above the track.
 */
export function Slider({
  label,
  value,
  defaultValue,
  onChange,
  onCommit,
  min = 0,
  max = 100,
  step = 1,
  format = String,
  showValue,
  marks,
  size,
  disabled,
  className,
  id: ownId,
  ref,
  ...rest
}: SliderProps) {
  const autoId = useId();
  const id = ownId ?? autoId;
  const [own, setOwn] = useState(defaultValue ?? min);
  const current = value ?? own;
  const fill = max > min ? ((current - min) / (max - min)) * 100 : 0;
  const readout = showValue ?? label != null;
  const commit = (el: HTMLInputElement) => onCommit?.(Number(el.value));
  const input = (
    <input
      ref={ref}
      id={id}
      type="range"
      data-measure
      min={min}
      max={max}
      step={step}
      value={current}
      disabled={disabled}
      aria-valuetext={format(current)}
      list={marks ? `${id}-marks` : undefined}
      onChange={(e) => {
        const v = Number(e.target.value);
        setOwn(v);
        onChange?.(v);
      }}
      onPointerUp={(e) => commit(e.currentTarget)}
      onKeyUp={(e) => {
        if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End"].includes(e.key)) commit(e.currentTarget);
      }}
      className={RANGE}
      style={{ "--fill": `${fill}%` } as CSSProperties}
      {...rest}
    />
  );
  return (
    <div data-slot="slider" className={cn("flex min-w-0 flex-col text-[14px]", disabled && "text-muted-foreground", controlSize(size), className)}>
      {label != null && (
        <div className="flex items-baseline justify-between gap-2">
          <label htmlFor={id}>{label}</label>
          {readout && (
            <output htmlFor={id} className="font-medium tabular-nums">
              {format(current)}
            </output>
          )}
        </div>
      )}
      {label == null && readout ? (
        <div className="flex items-center gap-2">
          {input}
          <output htmlFor={id} className="shrink-0 text-[13px] text-muted-foreground tabular-nums">
            {format(current)}
          </output>
        </div>
      ) : (
        input
      )}
      {marks && (
        <>
          <datalist id={`${id}-marks`}>
            {marks.map((m) => (
              <option key={m} value={m} />
            ))}
          </datalist>
          <div aria-hidden className="relative -mt-1 h-4 text-[12px] text-muted-foreground tabular-nums">
            {marks.map((m) => {
              const p = ((m - min) / (max - min)) * 100;
              return (
                <span key={m} className="absolute top-0 whitespace-nowrap" style={{ left: `${p}%`, transform: `translateX(-${p}%)` }}>
                  {format(m)}
                </span>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
