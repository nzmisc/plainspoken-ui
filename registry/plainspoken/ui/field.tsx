"use client";

import { createContext, useContext, useId, type LabelHTMLAttributes, type ReactNode } from "react";
import { CircleX } from "@/registry/plainspoken/lib/icons";
import { Icon } from "@/registry/plainspoken/ui/icon";
import { cn } from "@/lib/utils";

export interface FieldState {
  id: string;
  /** id of the field's label, for popups that need a name (a combobox's list) */
  labelId: string;
  describedBy?: string;
  invalid: boolean;
  required: boolean;
}

const FieldContext = createContext<FieldState | null>(null);

/** Wiring from the surrounding <Field>, if any: ids, aria-describedby, invalid, required. */
export function useField(): FieldState | null {
  return useContext(FieldContext);
}

/**
 * Props a field control takes from the surrounding Field, with its own props winning: the id, the
 * hint and error to read out, and the invalid and required flags.
 */
export function useFieldProps(own: { id?: string; invalid?: boolean; required?: boolean }) {
  const field = useField();
  const invalid = own.invalid ?? field?.invalid ?? false;
  return {
    id: own.id ?? field?.id,
    "aria-describedby": field?.describedBy,
    "aria-invalid": invalid || undefined,
    required: own.required ?? field?.required,
    invalid,
  };
}

export interface FieldProps {
  label: ReactNode;
  /** Help text under the control */
  hint?: ReactNode;
  /** Error under the control. Its presence marks the control invalid. */
  error?: ReactNode;
  required?: boolean;
  /** Put the label to the left of the control on wide screens */
  inline?: boolean;
  children: ReactNode;
  className?: string;
  /** id for the control; generated when left out. Set it to link to the field, e.g. from an error summary. */
  id?: string;
}

/**
 * Label + control + hint + error, wired together: the label points at the control, and the hint and
 * error are read out with it. Works with Input, Textarea, Select, NumberField, Combobox and
 * DatePicker; for a group of checkboxes or radios use their own legend instead.
 */
export function Field({ label, hint, error, required = false, inline, children, className, id: ownId }: FieldProps) {
  const autoId = useId();
  const id = ownId ?? autoId;
  const labelId = `${id}-label`;
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [errorId, hintId].filter(Boolean).join(" ") || undefined;
  return (
    <div data-slot="field" className={cn(inline ? "grid gap-x-3 gap-y-1 sm:grid-cols-[10rem_1fr]" : "flex flex-col gap-1", className)}>
      <Label id={labelId} htmlFor={id} required={required} className={cn(inline && "sm:pt-1.5")}>
        {label}
      </Label>
      <div className="flex min-w-0 flex-col gap-1">
        <FieldContext value={{ id, labelId, describedBy, invalid: !!error, required }}>{children}</FieldContext>
        {error && (
          <p id={errorId} className="text-[13px] text-destructive">
            <Icon icon={CircleX} className="mr-1" />
            {error}
          </p>
        )}
        {hint && (
          <p id={hintId} className="text-[13px] text-muted-foreground">
            {hint}
          </p>
        )}
      </div>
    </div>
  );
}

export interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
  /** Adds a red asterisk with the title "required" */
  required?: boolean;
}

/** A form label in the house type: medium weight, the control text size. */
export function Label({ required, className, children, ...rest }: LabelProps) {
  return (
    <label data-slot="label" className={cn("text-[14px] font-medium", className)} {...rest}>
      {children}
      {required && (
        <span className="text-destructive" title="required">
          {" "}*
        </span>
      )}
    </label>
  );
}
