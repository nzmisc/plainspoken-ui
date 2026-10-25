"use client";

import { useState, type ReactNode, type Ref } from "react";
import { ArrowDown, ArrowUp, Ellipsis, Key, Link, Pencil, Plus, Spline, Trash, X } from "@/registry/plainspoken/lib/icons";
import { ErdColumnDialog } from "@/registry/plainspoken/blocks/erd/column-dialog";
import { ErdRelationDialog } from "@/registry/plainspoken/blocks/erd/relation-dialog";
import {
  addColumn,
  addRelation,
  columnFlags,
  deleteColumn,
  deleteTables,
  endText,
  moveColumn,
  nameProblem,
  relationsOf,
  tableById,
  updateColumn,
  updateTable,
  type ErdColumn,
  type ErdModel,
  type ErdRelation,
} from "@/registry/plainspoken/blocks/erd/model";
import { Button, IconButton } from "@/registry/plainspoken/ui/button";
import { DropdownMenu } from "@/registry/plainspoken/ui/dropdown-menu";
import { Field } from "@/registry/plainspoken/ui/field";
import { Icon } from "@/registry/plainspoken/ui/icon";
import { Input } from "@/registry/plainspoken/ui/input";
import { Swatch } from "@/registry/plainspoken/ui/legend";
import { Select } from "@/registry/plainspoken/ui/select";
import { SimpleTable, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/registry/plainspoken/ui/table";
import { Textarea } from "@/registry/plainspoken/ui/textarea";
import { cn } from "@/lib/utils";

const LINK_BUTTON = "cursor-pointer text-left text-link underline decoration-1 underline-offset-2 hover:decoration-2 focus-visible:outline-2 focus-visible:outline-ring";

function Section({ title, meta, actions, children }: { title: string; meta?: ReactNode; actions?: ReactNode; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-1.5 border-t border-border px-3 pt-2 pb-3">
      <div className="flex min-h-6 items-center gap-2">
        <h3 className="text-[14px] font-bold">{title}</h3>
        {meta != null && <span className="text-[13px] text-muted-foreground tabular-nums">{meta}</span>}
        {actions && <div className="ml-auto flex items-center gap-1 ctl-sm">{actions}</div>}
      </div>
      {children}
    </section>
  );
}

/** A name field that saves on Enter or when it loses focus, and says what's wrong until it's fixed */
function NameField({ label, value, taken, onSave }: { label: string; value: string; taken: string[]; onSave: (name: string) => void }) {
  const [draft, setDraft] = useState(value);
  const [prev, setPrev] = useState(value);
  if (prev !== value) {
    setPrev(value);
    setDraft(value);
  }
  const problem = draft === value ? null : nameProblem(draft, taken);
  const save = () => {
    if (draft !== value && !problem) onSave(draft);
  };
  return (
    <Field label={label} error={problem}>
      <Input
        size="sm"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={save}
        onKeyDown={(e) => {
          if (e.key === "Enter") save();
          if (e.key === "Escape" && draft !== value) {
            e.preventDefault();
            setDraft(value);
          }
        }}
        spellCheck={false}
        autoComplete="off"
        inputClassName="font-mono"
      />
    </Field>
  );
}

export interface ErdTableDetailsProps {
  model: ErdModel;
  tableId: string;
  /** An edit was made: the new model, and what happened in words ("Renamed orders to purchases"). Leave out for a read-only panel. */
  onModelChange?: (next: ErdModel, message: string) => void;
  /** A relation in the lists was picked: show it (on the canvas, or in a popover at `from`) */
  onShowRelation?: (id: string, from: HTMLElement) => void;
  /** Another table was picked */
  onSelectTable?: (id: string) => void;
  /** Shows a × in the header */
  onClose?: () => void;
  /** The heading, to move focus to when the panel opens from the keyboard */
  headingRef?: Ref<HTMLHeadingElement>;
  className?: string;
}

/**
 * Everything about one table, without the canvas: its name, schema and comment; its columns in a
 * table (keys, type, "null" when nullable, the default) with a menu each to edit, move or delete them; its indexes;
 * the relations it makes ("References") and the ones that point at it ("Referenced by"). With
 * `onModelChange` it edits too: rename, add and change columns in a dialog, add a relationship
 * from a menu, delete the table.
 */
export function ErdTableDetails({ model, tableId, onModelChange, onShowRelation, onSelectTable, onClose, headingRef, className }: ErdTableDetailsProps) {
  const t = tableById(model, tableId);
  const [columnDialog, setColumnDialog] = useState<{ column: ErdColumn | null } | null>(null);
  const [relationDialog, setRelationDialog] = useState<{ column?: string } | null>(null);
  if (!t) return null;
  const edit = onModelChange;
  const rels = relationsOf(model, t.id);
  const pk = t.columns.filter((c) => c.pk).map((c) => c.name);
  const relationItem = (r: ErdRelation, dir: "out" | "in") => {
    const near = dir === "out" ? r.from : r.to;
    const far = dir === "out" ? r.to : r.from;
    return (
      <li key={r.id} className="flex flex-col py-1">
        <span className="flex flex-wrap items-baseline gap-x-1.5 font-mono text-[12px]">
          <span>{near.columns.join(", ")}</span>
          <span aria-hidden>{dir === "out" ? "→" : "←"}</span>
          <span className="sr-only">{dir === "out" ? "references" : "is referenced by"}</span>
          {onShowRelation ? (
            <button type="button" className={LINK_BUTTON} onClick={(e) => onShowRelation(r.id, e.currentTarget)}>
              {endText(model, far)}
            </button>
          ) : (
            <span>{endText(model, far)}</span>
          )}
        </span>
        <span className="text-[12px] text-muted-foreground">
          {r.onDelete !== "NO ACTION" ? `On delete ${r.onDelete.toLowerCase()}` : "On delete no action"}
          {r.onUpdate !== "NO ACTION" && `, on update ${r.onUpdate.toLowerCase()}`}
          {onSelectTable && far.table !== t.id && (
            <>
              {" · "}
              <button type="button" className={LINK_BUTTON} onClick={() => onSelectTable(far.table)}>
                go to {tableById(model, far.table)?.name}
              </button>
            </>
          )}
        </span>
      </li>
    );
  };

  return (
    <div data-slot="erd-table-details" className={cn("flex min-h-0 flex-col text-[14px]", className)}>
      <div className="flex items-start gap-2 bg-muted py-1.5 pr-1 pl-3">
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
            <Swatch color={model.schemas.find((s) => s.name === t.schema)?.color ?? "var(--chart-5)"} />
            {t.schema}
          </p>
          <h2 ref={headingRef} tabIndex={-1} className="truncate text-[16px] font-bold focus-visible:outline-2 focus-visible:outline-ring">
            {t.name}
          </h2>
          {t.comment && <p className="text-[13px] text-muted-foreground">{t.comment}</p>}
        </div>
        {onClose && <IconButton size="sm" variant="ghost" icon={X} label="Close the details" onClick={onClose} className="hover:bg-accent" />}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {edit && (
          <Section title="Table">
            <div className="grid grid-cols-[1fr_auto] items-start gap-2 ctl-sm">
              <NameField
                label="Name"
                value={t.name}
                taken={model.tables.filter((x) => x.schema === t.schema && x.id !== t.id).map((x) => x.name)}
                onSave={(name) => edit(updateTable(model, t.id, { name }), `Renamed ${t.name} to ${name}`)}
              />
              <Field label="Schema">
                <Select
                  size="sm"
                  value={t.schema}
                  options={model.schemas.map((s) => s.name)}
                  onChange={(e) => edit(updateTable(model, t.id, { schema: e.target.value }), `Moved ${t.name} to ${e.target.value}`)}
                />
              </Field>
            </div>
            <Field label="Comment">
              <Textarea
                key={t.id}
                rows={2}
                defaultValue={t.comment ?? ""}
                onBlur={(e) => {
                  const v = e.target.value.trim();
                  if (v !== (t.comment ?? "")) edit(updateTable(model, t.id, { comment: v || undefined }), `Changed the comment of ${t.name}`);
                }}
              />
            </Field>
          </Section>
        )}

        <Section
          title="Columns"
          meta={t.columns.length}
          actions={
            edit && (
              <Button icon={Plus} onClick={() => setColumnDialog({ column: null })}>
                Add column
              </Button>
            )
          }
        >
          <Table density="compact">
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type and default</TableHead>
                {edit && (
                  <TableHead>
                    <span className="sr-only">Actions</span>
                  </TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {t.columns.map((c, i) => {
                const f = columnFlags(model, t, c);
                return (
                  <TableRow key={c.name}>
                    <TableCell className="whitespace-nowrap" title={c.comment}>
                      <span className="inline-flex w-[26px] justify-end gap-px align-[-1px] [&_svg]:size-3">
                        {f.pk && <Icon icon={Key} label="Primary key" className="text-warning" />}
                        {f.fk && <Icon icon={Link} label="Foreign key" className="text-muted-foreground" />}
                      </span>{" "}
                      <span className={cn("font-mono text-[12px]", f.pk && "font-bold")}>{c.name}</span>
                      {f.unique && !f.pk && (
                        <abbr title="Unique" className="ml-1 font-sans text-[10px] text-muted-foreground no-underline">
                          UQ
                        </abbr>
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-[12px] text-muted-foreground">
                      <span className="whitespace-nowrap">
                        {c.type}
                        {!f.notNull && <span className="ml-1 font-sans text-[11px] text-foreground">null</span>}
                      </span>
                      {(c.identity || c.default != null) && (
                        <span className="block max-w-44 truncate text-[11px]" title={c.identity ? "generated always as identity" : c.default}>
                          {c.identity ? "identity" : `= ${c.default}`}
                        </span>
                      )}
                    </TableCell>
                    {edit && (
                      <TableCell className="w-0 p-0">
                        <DropdownMenu
                          size="xs"
                          align="end"
                          label={`Column ${c.name}`}
                          trigger={Ellipsis}
                          triggerVariant="ghost"
                          items={[
                            { label: "Edit…", icon: Pencil, onSelect: () => setColumnDialog({ column: c }) },
                            { label: "Add relationship…", icon: Spline, onSelect: () => setRelationDialog({ column: c.name }) },
                            { type: "separator" },
                            { label: "Move up", icon: ArrowUp, disabled: i === 0, onSelect: () => edit(moveColumn(model, t.id, c.name, -1), `Moved ${c.name} up`) },
                            { label: "Move down", icon: ArrowDown, disabled: i === t.columns.length - 1, onSelect: () => edit(moveColumn(model, t.id, c.name, 1), `Moved ${c.name} down`) },
                            { type: "separator" },
                            { label: "Delete", icon: Trash, destructive: true, onSelect: () => edit(deleteColumn(model, t.id, c.name), `Deleted column ${c.name} of ${t.name}`) },
                          ]}
                        />
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Section>

        <Section title="Indexes" meta={t.indexes.length + (pk.length ? 1 : 0)}>
          <SimpleTable
            density="compact"
            rows={[...(pk.length ? [{ name: `${t.name}_pkey`, columns: pk, kind: "primary key" }] : []), ...t.indexes.map((i) => ({ name: i.name, columns: i.columns, kind: [i.unique ? "unique" : "", i.using ?? "btree"].filter(Boolean).join(", ") }))]}
            rowKey={(r) => r.name}
            empty="No indexes."
            columns={[
              { key: "name", header: "Name", cell: (r) => <span className="font-mono text-[12px] break-all">{r.name}</span> },
              { key: "cols", header: "Columns", cell: (r) => <span className="font-mono text-[12px]">{r.columns.join(", ")}</span> },
              { key: "kind", header: "Kind", cell: (r) => <span className="text-[12px] whitespace-nowrap">{r.kind}</span> },
            ]}
          />
        </Section>

        <Section
          title="References"
          meta={rels.out.length}
          actions={
            edit && (
              <Button icon={Plus} onClick={() => setRelationDialog({})}>
                Add relationship
              </Button>
            )
          }
        >
          {rels.out.length ? <ul className="divide-y divide-border">{rels.out.map((r) => relationItem(r, "out"))}</ul> : <p className="text-[13px] text-muted-foreground">No foreign keys.</p>}
        </Section>

        <Section title="Referenced by" meta={rels.in.length}>
          {rels.in.length ? <ul className="divide-y divide-border">{rels.in.map((r) => relationItem(r, "in"))}</ul> : <p className="text-[13px] text-muted-foreground">No table points here.</p>}
        </Section>

        {edit && (
          <div className="border-t border-border px-3 py-3">
            <Button variant="destructive" icon={Trash} onClick={() => edit(deleteTables(model, [t.id]), `Deleted table ${t.name}`)}>
              Delete table
            </Button>
          </div>
        )}
      </div>

      {edit && (
        <>
          <ErdColumnDialog
            open={columnDialog != null}
            onClose={() => setColumnDialog(null)}
            model={model}
            tableId={t.id}
            column={columnDialog?.column ?? null}
            onSave={(c, old) =>
              edit(
                old == null ? addColumn(model, t.id, c) : updateColumn(model, t.id, old, c),
                old == null ? `Added column ${c.name} to ${t.name}` : old !== c.name ? `Renamed column ${old} to ${c.name}` : `Changed column ${c.name}`,
              )
            }
            onDelete={(name) => edit(deleteColumn(model, t.id, name), `Deleted column ${name} of ${t.name}`)}
          />
          <ErdRelationDialog
            open={relationDialog != null}
            onClose={() => setRelationDialog(null)}
            model={model}
            tableId={t.id}
            defaultColumn={relationDialog?.column}
            onSave={(r, retype) => {
              let next = addRelation(model, r);
              if (retype) next = updateColumn(next, retype.table, retype.column.name, retype.column);
              edit(next, `${t.name}.${r.from.columns[0]} now references ${endText(model, r.to)}`);
            }}
          />
        </>
      )}
    </div>
  );
}
