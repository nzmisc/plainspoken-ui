"use client";

import { useId, useState } from "react";
import { qualified, REF_ACTIONS, referenceableColumns, referenceTo, tableById, type ErdColumn, type ErdModel, type ErdRelation, type RefAction } from "@/registry/plainspoken/blocks/erd/model";
import { Alert } from "@/registry/plainspoken/ui/alert";
import { Button } from "@/registry/plainspoken/ui/button";
import { Dialog } from "@/registry/plainspoken/ui/dialog";
import { Field } from "@/registry/plainspoken/ui/field";
import { Select } from "@/registry/plainspoken/ui/select";

export interface ErdRelationDialogProps {
  open: boolean;
  onClose: () => void;
  model: ErdModel;
  /** The referencing table: the one that gets the foreign key */
  tableId: string;
  /** The column to start with */
  defaultColumn?: string;
  /** Saved: the new relation, and the referencing column retyped to match when it had to be */
  onSave: (relation: ErdRelation, retype?: { table: string; column: ErdColumn }) => void;
}

function RelationForm({ model, tableId, defaultColumn, onSave, onClose, formId }: Omit<ErdRelationDialogProps, "open"> & { formId: string }) {
  const table = tableById(model, tableId)!;
  const targets = model.tables.filter((t) => referenceableColumns(t).length > 0);
  const [column, setColumn] = useState(defaultColumn ?? table.columns.find((c) => !c.pk)?.name ?? table.columns[0]?.name ?? "");
  const [target, setTarget] = useState(targets.find((t) => t.id !== tableId)?.id ?? targets[0]?.id ?? "");
  const targetTable = tableById(model, target);
  const keys = targetTable ? referenceableColumns(targetTable) : [];
  const [targetColumn, setTargetColumn] = useState(keys.find((c) => c.pk)?.name ?? keys[0]?.name ?? "");
  const [onDelete, setOnDelete] = useState<RefAction>("NO ACTION");
  const [onUpdate, setOnUpdate] = useState<RefAction>("NO ACTION");
  const result = target && targetColumn && column ? referenceTo(model, { table: tableId, column }, { table: target, column: targetColumn }, { onDelete, onUpdate }) : null;
  const pickTarget = (id: string) => {
    setTarget(id);
    const k = referenceableColumns(tableById(model, id)!);
    setTargetColumn(k.find((c) => c.pk)?.name ?? k[0]?.name ?? "");
  };
  return (
    <form
      id={formId}
      className="flex flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (!result || "error" in result) return;
        onSave(result.relation, result.retype);
        onClose();
      }}
    >
      <Field label={`Column of ${table.name}`} hint="The column that holds the reference">
        <Select value={column} options={table.columns.map((c) => ({ value: c.name, label: `${c.name} (${c.type})` }))} onChange={(e) => setColumn(e.target.value)} />
      </Field>
      <Field label="References table">
        <Select
          value={target}
          options={model.schemas
            .map((s) => ({ group: s.name, options: targets.filter((t) => t.schema === s.name).map((t) => ({ value: t.id, label: qualified(t) })) }))
            .filter((g) => g.options.length)}
          onChange={(e) => pickTarget(e.target.value)}
        />
      </Field>
      <Field label="Its key" hint="Only the primary key and unique columns can be referenced">
        <Select value={targetColumn} options={keys.map((c) => ({ value: c.name, label: `${c.name} (${c.type})${c.pk ? ", primary key" : ", unique"}` }))} onChange={(e) => setTargetColumn(e.target.value)} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="On delete">
          <Select value={onDelete} options={REF_ACTIONS} onChange={(e) => setOnDelete(e.target.value as RefAction)} />
        </Field>
        <Field label="On update">
          <Select value={onUpdate} options={REF_ACTIONS} onChange={(e) => setOnUpdate(e.target.value as RefAction)} />
        </Field>
      </div>
      {result && "error" in result && <Alert variant="destructive">{result.error}</Alert>}
      {result && "retype" in result && result.retype && (
        <Alert variant="info">
          {table.name}.{column} will become <code className="font-mono">{result.retype.column.type}</code>, to match the column it references.
        </Alert>
      )}
    </form>
  );
}

/**
 * Add a foreign key without dragging: pick the column, the table it points at and that table's
 * key (only primary keys and unique columns are offered), and what happens on delete and update.
 * It says when the column's type will change to match, and why a choice can't be made.
 */
export function ErdRelationDialog({ open, onClose, model, tableId, defaultColumn, onSave }: ErdRelationDialogProps) {
  const formId = useId();
  const table = tableById(model, tableId);
  return (
    <Dialog
      open={open && !!table}
      onClose={onClose}
      size="sm"
      title={`Add a relationship from ${table?.name ?? "table"}`}
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" type="submit" form={formId}>
            Add relationship
          </Button>
        </>
      }
    >
      {table && <RelationForm model={model} tableId={tableId} defaultColumn={defaultColumn} onSave={onSave} onClose={onClose} formId={formId} />}
    </Dialog>
  );
}
