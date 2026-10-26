"use client";

import { useDeferredValue, useId, useRef, useState } from "react";
import { Download, FileCode, Upload } from "@/registry/plainspoken/lib/icons";
import { download, parseJson } from "@/registry/plainspoken/blocks/erd/export";
import type { ErdModel, ErdPoint } from "@/registry/plainspoken/blocks/erd/model";
import { parseDDL, toDDL, type SqlProblem } from "@/registry/plainspoken/blocks/erd/sql";
import { Alert } from "@/registry/plainspoken/ui/alert";
import { Button } from "@/registry/plainspoken/ui/button";
import { CopyButton } from "@/registry/plainspoken/ui/copy-button";
import { Dialog } from "@/registry/plainspoken/ui/dialog";
import { Label } from "@/registry/plainspoken/ui/field";
import { Textarea } from "@/registry/plainspoken/ui/textarea";

export interface ErdExportDialogProps {
  open: boolean;
  onClose: () => void;
  model: ErdModel;
}

/** The schema as Postgres DDL, to read, copy or download as a .sql file. */
export function ErdExportDialog({ open, onClose, model }: ErdExportDialogProps) {
  const sql = open ? toDDL(model) : "";
  const lines = sql.split("\n").length;
  return (
    <Dialog
      open={open}
      onClose={onClose}
      size="lg"
      title="Export SQL"
      description={`Postgres DDL for ${model.name}: ${model.tables.length} tables, ${model.relations.length} foreign keys, ${lines} lines. Foreign keys come last, so the tables can be created in any order.`}
      bodyClassName="p-0"
      footer={
        <>
          <CopyButton text={sql} label="Copy" size="md" variant="default" />
          <Button variant="primary" icon={Download} onClick={() => download(`${model.name}.sql`, sql, "application/sql")}>
            Download {model.name}.sql
          </Button>
        </>
      }
    >
      <pre tabIndex={0} aria-label="SQL" className="min-h-full overflow-auto p-3 font-mono text-[12px] leading-[1.5] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring">
        {sql}
      </pre>
    </Dialog>
  );
}

const EXAMPLE = `-- A small library, to try the import with
CREATE TABLE members (
  id         bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  card_no    text NOT NULL UNIQUE,
  name       text NOT NULL,
  joined_on  date NOT NULL DEFAULT current_date
);

CREATE TABLE books (
  isbn       char(13) PRIMARY KEY,
  title      text NOT NULL,
  published  smallint
);

CREATE TABLE loans (
  id         bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  member_id  bigint NOT NULL REFERENCES members ON DELETE RESTRICT,
  isbn       char(13) NOT NULL,
  lent_on    date NOT NULL DEFAULT current_date,
  due_on     date NOT NULL,
  returned_on date,
  FOREIGN KEY (isbn) REFERENCES books (isbn)
);
CREATE INDEX loans_member_id_idx ON loans (member_id);
`;

export interface ErdImport {
  model: ErdModel;
  /** From a JSON file: where the tables were. Leave the layout to the caller otherwise. */
  positions?: Record<string, ErdPoint>;
}

export interface ErdImportDialogProps {
  open: boolean;
  onClose: () => void;
  /** Called with what was read; the dialog closes after */
  onImport: (result: ErdImport) => void;
  /** Text to start with */
  defaultText?: string;
}

function ImportForm({ onImport, onClose, defaultText = "", formId }: Omit<ErdImportDialogProps, "open"> & { formId: string }) {
  const [text, setText] = useState(defaultText);
  const box = useRef<HTMLTextAreaElement>(null);
  const file = useRef<HTMLInputElement>(null);
  const deferred = useDeferredValue(text);
  const json = deferred.trimStart().startsWith("{");
  const sql = !json && deferred.trim() ? parseDDL(deferred) : null;
  const fromJson = json ? parseJson(deferred) : null;
  const errors: SqlProblem[] = sql?.errors ?? (fromJson && "error" in fromJson ? [{ line: 1, message: fromJson.error }] : []);
  const model = sql ? sql.model : fromJson && "doc" in fromJson ? fromJson.doc.model : null;
  const ready = !!model && model.tables.length > 0 && errors.length === 0 && deferred === text;

  /** Select a line of the text, to show where a problem is */
  const goTo = (line: number) => {
    const el = box.current;
    if (!el) return;
    const lines = text.split("\n");
    const start = lines.slice(0, line - 1).reduce((n, l) => n + l.length + 1, 0);
    el.focus();
    el.setSelectionRange(start, start + (lines[line - 1]?.length ?? 0));
    // Scroll the line into view: about one line height each
    el.scrollTop = Math.max(0, (line - 4) * 18);
  };

  return (
    <form
      id={formId}
      className="flex flex-col gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        if (!ready || !model) {
          if (errors.length) goTo(errors[0].line);
          else box.current?.focus();
          return;
        }
        onImport({ model, positions: fromJson && "doc" in fromJson ? fromJson.doc.positions : undefined });
        onClose();
      }}
    >
      <div className="flex flex-wrap items-center gap-2 ctl-sm">
        <Label htmlFor={`${formId}-text`} className="mr-auto">
          CREATE TABLE statements, or a JSON export
        </Label>
        <Button icon={FileCode} onClick={() => setText(EXAMPLE)}>
          Paste an example
        </Button>
        <Button icon={Upload} onClick={() => file.current?.click()}>
          Open a file…
        </Button>
        <input
          ref={file}
          type="file"
          accept=".sql,.txt,.json,application/sql,application/json,text/plain"
          className="hidden"
          onChange={async (e) => {
            const f = e.target.files?.[0];
            if (f) setText(await f.text());
            e.target.value = "";
          }}
        />
      </div>
      <Textarea
        ref={box}
        id={`${formId}-text`}
        rows={14}
        value={text}
        onChange={(e) => setText(e.target.value)}
        spellCheck={false}
        placeholder={"CREATE TABLE customers (\n  id uuid PRIMARY KEY,\n  email text NOT NULL UNIQUE\n);"}
        className="font-mono text-[12px] leading-[18px]"
        aria-describedby={`${formId}-status`}
      />
      <div id={`${formId}-status`} aria-live="polite" className="flex flex-col gap-2">
        {errors.length > 0 && (
          <Alert variant="destructive" title={errors.length === 1 ? "1 problem:" : `${errors.length} problems:`} announce={false}>
            <ul className="mt-1 flex max-h-40 flex-col gap-0.5 overflow-y-auto">
              {errors.map((e, i) => (
                <li key={i}>
                  <button type="button" onClick={() => goTo(e.line)} className="cursor-pointer text-left underline decoration-1 underline-offset-2 focus-visible:outline-2 focus-visible:outline-ring">
                    Line {e.line}
                  </button>
                  : {e.message}
                </li>
              ))}
            </ul>
          </Alert>
        )}
        {model && errors.length === 0 && model.tables.length > 0 && (
          <p className="text-[13px]">
            Found {model.tables.length} {model.tables.length === 1 ? "table" : "tables"} in {model.schemas.length} {model.schemas.length === 1 ? "schema" : "schemas"}, with {model.relations.length}{" "}
            {model.relations.length === 1 ? "foreign key" : "foreign keys"}. Importing replaces the diagram; Undo brings it back.
          </p>
        )}
        {sql && sql.notes.length > 0 && (
          <details className="text-[13px] text-muted-foreground">
            <summary className="cursor-pointer">
              {sql.notes.length} {sql.notes.length === 1 ? "statement" : "statements"} skipped
            </summary>
            <ul className="mt-1 flex flex-col gap-0.5">
              {sql.notes.map((n, i) => (
                <li key={i}>
                  Line {n.line}: {n.message}
                </li>
              ))}
            </ul>
          </details>
        )}
      </div>
    </form>
  );
}

/**
 * Import a schema: paste CREATE TABLE statements (or open a .sql file, or a JSON export of the
 * diagram) and see straight away what was found, or each problem with its line (a click selects
 * the line). The parser reads the common subset of Postgres DDL: columns, PRIMARY KEY, REFERENCES
 * and FOREIGN KEY, UNIQUE, NOT NULL, DEFAULT, identity, indexes and comments.
 */
export function ErdImportDialog({ open, onClose, onImport, defaultText }: ErdImportDialogProps) {
  const formId = useId();
  return (
    <Dialog
      open={open}
      onClose={onClose}
      size="lg"
      title="Import SQL"
      dismissOnBackdrop={false}
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" type="submit" form={formId}>
            Import
          </Button>
        </>
      }
    >
      <ImportForm onImport={onImport} onClose={onClose} defaultText={defaultText} formId={formId} />
    </Dialog>
  );
}
