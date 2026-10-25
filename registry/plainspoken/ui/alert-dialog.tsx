"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { CircleX } from "@/registry/plainspoken/lib/icons";
import { Button } from "@/registry/plainspoken/ui/button";
import { Dialog } from "@/registry/plainspoken/ui/dialog";
import { Icon } from "@/registry/plainspoken/ui/icon";
import { Input } from "@/registry/plainspoken/ui/input";

export interface AlertDialogProps {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  /** What will happen, in a sentence or two */
  description: ReactNode;
  /** The button that goes ahead: a verb for what it does ("Delete project"), not "OK" */
  confirmLabel: string;
  cancelLabel?: string;
  /** The confirm button in the destructive style, for things that delete or can't be undone */
  destructive?: boolean;
  /** If this returns a promise, the dialog stays open and busy until it settles; a rejection is shown in place. */
  onConfirm: () => void | Promise<void>;
  /** Require typing this exact text (a project's name, say) before the confirm button enables */
  typeToConfirm?: string;
  /** More detail under the description: what else goes with it, a list of affected things */
  children?: ReactNode;
}

/**
 * A confirmation that interrupts: role="alertdialog", focus starts on Cancel (the safe choice; with
 * `typeToConfirm`, on the text box), and a click on the backdrop does nothing (Escape still
 * cancels). An async confirm keeps the dialog open with a spinner on the button, and shows the
 * error if it fails, so the person can try again or cancel.
 */
export function AlertDialog({
  open,
  onClose,
  title,
  description,
  confirmLabel,
  cancelLabel = "Cancel",
  destructive = false,
  onConfirm,
  typeToConfirm,
  children,
}: AlertDialogProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [typed, setTyped] = useState("");
  const id = useId();
  // Each opening starts clean: nothing typed, no old error.
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setTyped("");
      setError(null);
    }
  }

  // The confirm button was disabled while busy, which drops focus; after a failure, put it back
  // there so Enter tries again (the error itself is announced as an alert).
  const confirmButton = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (error && !busy) confirmButton.current?.focus();
  }, [error, busy]);

  const confirm = async () => {
    setError(null);
    const r = onConfirm();
    if (!(r instanceof Promise)) return onClose();
    setBusy(true);
    try {
      await r;
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };
  const blocked = typeToConfirm != null && typed !== typeToConfirm;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      role="alertdialog"
      size="sm"
      busy={busy}
      dismissOnBackdrop={false}
      title={title}
      description={description}
      footer={
        <>
          <Button data-autofocus={typeToConfirm == null || undefined} disabled={busy} onClick={onClose}>
            {cancelLabel}
          </Button>
          <Button ref={confirmButton} variant={destructive ? "destructive" : "primary"} loading={busy} disabled={blocked} onClick={confirm}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      {(children != null || typeToConfirm != null || error) && (
        <div className="flex flex-col gap-3">
          {children}
          {typeToConfirm != null && (
            <div className="flex flex-col gap-1">
              <label htmlFor={`${id}-confirm`}>
                Type <code className="bg-muted px-1 font-mono text-[13px]">{typeToConfirm}</code> to confirm
              </label>
              <Input
                id={`${id}-confirm`}
                data-autofocus
                value={typed}
                onChange={(e) => setTyped(e.target.value)}
                autoComplete="off"
                autoCapitalize="off"
                spellCheck={false}
                disabled={busy}
                className="w-full"
                inputClassName="font-mono"
              />
            </div>
          )}
          {error && (
            <p role="alert" className="border border-destructive px-2 py-1 text-destructive">
              <Icon icon={CircleX} className="mr-1" />
              {error}
            </p>
          )}
        </div>
      )}
    </Dialog>
  );
}
