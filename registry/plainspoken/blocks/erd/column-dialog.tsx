"use client";

import { useId, useState } from "react";
import { Trash } from "@/registry/plainspoken/lib/icons";
import { nameProblem, PG_TYPES, tableById, type ErdColumn, type ErdModel } from "@/registry/plainspoken/blocks/erd/model";
import { Button } from "@/registry/plainspoken/ui/button";
import { Checkbox } from "@/registry/plainspoken/ui/checkbox";
import { Dialog } from "@/registry/plainspoken/ui/dialog";
import { Field } from "@/registry/plainspoken/ui/field";
import { Input } from "@/registry/plainspoken/ui/input";
import { Select, type SelectOptions } from "@/registry/plainspoken/ui/select";
import { Textarea } from "@/registry/plainspoken/ui/textarea";

/** The type picker's options: the common types, grouped, plus the column's own if it's another */
export function typeOptions(current?: string): SelectOptions {
  const groups: SelectOptions = PG_TYPES.map((g) => ({ group: g.group, options: g.types.map((t) => ({ value: t, label: t })) }));
  return current && !PG_TYPES.some((g) => g.types.includes(current)) ? [{ group: "This column", options: [{ value: current, label: current }] }, ...groups] : groups;
}

export interface ErdColumnDialogProps {
  open: boolean;
  onClose: () => void;
  model: ErdModel;
  tableId: string;
  /** The column to edit; null to add a new one */
  column: ErdColumn | null;
  /** Saved: the column as it is now, and its old name (null for a new one) */
  onSave: (column: ErdColumn, oldName: string | null) => void;
  /** Shows Delete for an existing column */
  onDelete?: (name: string) => void;
}

function ColumnForm({ model, tableId, column, onSave, onDelete, onClose, formId }: Omit<ErdColumnDialogProps, "open"> & { formId: string }) {
  const table = tableById(model, tableId);
  const [c, setC] = useState<ErdColumn>(column ?? { name: "", type: "text", notNull: true });
  const [tried, setTried] = useState(false);
  const taken = (table?.columns ?? []).map((x) => x.name).filter((n) => n !== column?.name);
  const problem = nameProblem(c.name, taken);
  const set = (patch: Partial<ErdColumn>) => setC((old) => ({ ...old, ...patch }));
  return (
    <form
      id={formId}
      noValidate
      className="flex flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        setTried(true);
        if (problem) return;
        const out: ErdColumn = { name: c.name, type: c.type };
        if (c.pk) out.pk = true;
        if (c.pk || c.notNull) out.notNull = true;
        if (c.unique && !c.pk) out.unique = true;
        if (c.identity) out.identity = true;
        else if (c.default?.trim()) out.default = c.default.trim();
        if (c.comment?.trim()) out.comment = c.comment.trim();
        onSave(out, column?.name ?? null);
        onClose();
      }}
    >
      <Field label="Name" required error={tried ? problem : undefined}>
        <Input value={c.name} onChange={(e) => set({ name: e.target.value })} autoComplete="off" spellCheck={false} inputClassName="font-mono" data-autofocus />
      </Field>
      <Field label="Type">
        <Select value={c.type} options={typeOptions(column?.type)} onChange={(e) => set({ type: e.target.value })} />
      </Field>
      <fieldset className="flex flex-col">
        <legend className="mb-0.5 text-[14px] font-medium">Constraints</legend>
        <Checkbox label="Primary key" description="Part of the table's primary key; never null" checked={!!c.pk} onChange={(e) => set({ pk: e.target.checked })} />
        <Checkbox label="Not null" checked={!!(c.pk || c.notNull)} disabled={!!c.pk} onChange={(e) => set({ notNull: e.target.checked })} />
        <Checkbox label="Unique" checked={!!(c.unique && !c.pk)} disabled={!!c.pk} onChange={(e) => set({ unique: e.target.checked })} />
        <Checkbox label="Identity" description="GENERATED ALWAYS AS IDENTITY: the database numbers new rows" checked={!!c.identity} onChange={(e) => set({ identity: e.target.checked })} />
      </fieldset>
      <Field label="Default" hint="As SQL: now(), 'pending', 0, gen_random_uuid()">
        <Input value={c.identity ? "" : (c.default ?? "")} disabled={!!c.identity} onChange={(e) => set({ default: e.target.value })} autoComplete="off" spellCheck={false} inputClassName="font-mono" />
      </Field>
      <Field label="Comment" hint="Shown when pointing at the column">
        <Textarea rows={2} value={c.comment ?? ""} onChange={(e) => set({ comment: e.target.value })} />
      </Field>
      {column && onDelete && (
        <div className="border-t border-border pt-3">
          <Button
            variant="destructive"
            icon={Trash}
            onClick={() => {
              onDelete(column.name);
              onClose();
            }}
          >
            Delete column
          </Button>
        </div>
      )}
    </form>
  );
}

/**
 * Add or change a column: name (checked for clashes and odd characters), a type from the common
 * Postgres types, primary key, NOT NULL, UNIQUE, identity, a default and a comment, and Delete
 * for an existing one. A new name follows into the table's indexes and relations.
 */
export function ErdColumnDialog({ open, onClose, model, tableId, column, onSave, onDelete }: ErdColumnDialogProps) {
  const formId = useId();
  const table = tableById(model, tableId);
  return (
    <Dialog
      open={open}
      onClose={onClose}
      size="sm"
      title={column ? `Column ${column.name}` : `New column in ${table?.name ?? "table"}`}
      dismissOnBackdrop={false}
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" type="submit" form={formId}>
            {column ? "Save" : "Add column"}
          </Button>
        </>
      }
    >
      <ColumnForm model={model} tableId={tableId} column={column} onSave={onSave} onDelete={onDelete} onClose={onClose} formId={formId} />
    </Dialog>
  );
}
