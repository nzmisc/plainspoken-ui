"use client";

import { useState, type Ref, type SelectHTMLAttributes } from "react";
import { ChevronDown } from "@/registry/plainspoken/lib/icons";
import { FOCUS_WITHIN_RING, controlSize, type ControlSize } from "@/registry/plainspoken/lib/controls";
import { Icon } from "@/registry/plainspoken/ui/icon";
import { useFieldProps } from "@/registry/plainspoken/ui/field";
import { cn } from "@/lib/utils";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export type SelectOptions = (string | SelectOption | { group: string; options: SelectOption[] })[];

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "size" | "children"> {
  /** Height from the shared scale. Leave out to take the surrounding size (md at the root). */
  size?: ControlSize;
  /** Plain strings, options, or groups of options (drawn as <optgroup>) */
  options: SelectOptions;
  invalid?: boolean;
  /** First, empty choice, e.g. "Choose…" (disabled when the field is required) */
  placeholder?: string;
  ref?: Ref<HTMLSelectElement>;
}

/**
 * The browser's own <select> (the system picker on phones, type-to-jump, every screen reader knows
 * it), made invisible and laid over a label drawn like a button's. Chrome ignores line-height on a
 * select and puts its text 1-2px above centre, so a styled native select can't line up with a
 * button's label; this one is centred the same way a button is. The box is as wide as the longest
 * option, like a native select, so it doesn't change width when the choice changes. Inside a Field
 * it is wired like Input.
 */
export function Select({ size, options, invalid, placeholder, className, id, required, value, defaultValue, onChange, disabled, ref, ...rest }: SelectProps) {
  const f = useFieldProps({ id, invalid, required });
  const flat = options.flatMap((o) => (typeof o === "string" ? [{ value: o, label: o }] : "group" in o ? o.options : [o]));
  const all = placeholder != null ? [{ value: "", label: placeholder }, ...flat] : flat;
  const [own, setOwn] = useState(String(defaultValue ?? all[0]?.value ?? ""));
  const current = value != null ? String(value) : own;
  const label = all.find((o) => o.value === current)?.label ?? "";
  const stack = "col-start-1 row-start-1 whitespace-nowrap";
  const option = (o: SelectOption) => (
    <option key={o.value} value={o.value} disabled={o.disabled}>
      {o.label}
    </option>
  );
  return (
    <span
      data-slot="select"
      className={cn(
        "relative inline-grid h-(--ctl-h) max-w-full items-center border pl-(--ctl-px) align-baseline text-(length:--ctl-text) leading-none [&_svg]:size-(--ctl-icon)",
        // room for the chevron: its width plus its inset on both sides
        "pr-[calc(var(--ctl-icon)+var(--ctl-inset)*2)]",
        f.invalid ? "border-destructive" : "border-input",
        disabled ? "bg-muted text-muted-foreground" : "bg-secondary text-secondary-foreground hover:bg-accent",
        controlSize(size),
        FOCUS_WITHIN_RING,
        className,
      )}
    >
      {all.map((o) => (
        <span key={o.value} aria-hidden className={cn(stack, "invisible")}>
          {o.label}
        </span>
      ))}
      <span aria-hidden className={cn(stack, "overflow-hidden text-ellipsis", current === "" && placeholder != null && "text-muted-foreground")}>
        {label}
      </span>
      <span aria-hidden className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-(--ctl-inset) text-muted-foreground">
        <Icon icon={ChevronDown} />
      </span>
      <select
        ref={ref}
        id={f.id}
        aria-describedby={f["aria-describedby"]}
        aria-invalid={f["aria-invalid"]}
        required={f.required}
        value={current}
        disabled={disabled}
        onChange={(e) => {
          setOwn(e.target.value);
          onChange?.(e);
        }}
        className="absolute inset-0 size-full cursor-pointer appearance-none opacity-0 focus-visible:outline-none disabled:cursor-not-allowed"
        {...rest}
      >
        {placeholder != null && (
          <option value="" disabled={f.required}>
            {placeholder}
          </option>
        )}
        {options.map((o) =>
          typeof o === "string" ? (
            option({ value: o, label: o })
          ) : "group" in o ? (
            <optgroup key={o.group} label={o.group}>
              {o.options.map(option)}
            </optgroup>
          ) : (
            option(o)
          ),
        )}
      </select>
    </span>
  );
}
