// A database schema as plain data, for the ERD blocks: tables with columns and indexes, foreign
// keys as relations between them, and the edits the diagram makes (each returns a new model, so
// undo is a stack of models).

/** What happens to the referencing rows when the referenced row is deleted or its key changes */
export type RefAction = "NO ACTION" | "RESTRICT" | "CASCADE" | "SET NULL" | "SET DEFAULT";

export const REF_ACTIONS: RefAction[] = ["NO ACTION", "RESTRICT", "CASCADE", "SET NULL", "SET DEFAULT"];

export interface ErdColumn {
  name: string;
  /** As Postgres writes it: uuid, text, numeric(10,2), timestamptz, text[] */
  type: string;
  /** Part of the primary key (which makes it NOT NULL too) */
  pk?: boolean;
  notNull?: boolean;
  unique?: boolean;
  /** The default, as SQL: now(), 'pending', 0 */
  default?: string;
  /** GENERATED ALWAYS AS IDENTITY */
  identity?: boolean;
  comment?: string;
}

export interface ErdIndex {
  name: string;
  columns: string[];
  unique?: boolean;
  /** Index method when not btree: gin, gist, hash, brin */
  using?: string;
}

export interface ErdTable {
  /** Stable while the table is renamed: positions and relations use it */
  id: string;
  schema: string;
  name: string;
  comment?: string;
  columns: ErdColumn[];
  indexes: ErdIndex[];
}

/** A foreign key: `from` columns (in the referencing table) point at `to` columns (a key of the referenced table) */
export interface ErdRelation {
  id: string;
  /** The constraint's name: orders_customer_id_fkey */
  name?: string;
  from: { table: string; columns: string[] };
  to: { table: string; columns: string[] };
  onDelete: RefAction;
  onUpdate: RefAction;
}

export interface ErdSchemaInfo {
  name: string;
  /** A CSS colour for its tables' headers: a chart token */
  color: string;
  comment?: string;
}

export interface ErdModel {
  /** The database's name, for titles and file names */
  name: string;
  schemas: ErdSchemaInfo[];
  tables: ErdTable[];
  relations: ErdRelation[];
}

export interface ErdPoint {
  x: number;
  y: number;
}

/** What the diagram saves and undoes: the schema and where each table sits */
export interface ErdDocument {
  model: ErdModel;
  positions: Record<string, ErdPoint>;
}

/** Chart tokens in order, for schemas */
export const SCHEMA_COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];

/** Common Postgres types, grouped, for a type picker */
export const PG_TYPES: { group: string; types: string[] }[] = [
  { group: "Numbers", types: ["smallint", "integer", "bigint", "numeric", "numeric(10,2)", "numeric(12,2)", "real", "double precision"] },
  { group: "Text", types: ["text", "varchar(255)", "char(2)", "char(3)", "citext"] },
  { group: "Date and time", types: ["timestamptz", "timestamp", "date", "time", "interval"] },
  { group: "Other", types: ["boolean", "uuid", "jsonb", "json", "bytea", "inet", "text[]"] },
];

// ---------------------------------------------------------------------------------------------
// Reading

export const qualified = (t: Pick<ErdTable, "schema" | "name">) => `${t.schema}.${t.name}`;

export const tableById = (m: ErdModel, id: string) => m.tables.find((t) => t.id === id);

export const schemaColor = (m: ErdModel, schema: string) => m.schemas.find((s) => s.name === schema)?.color ?? "var(--chart-5)";

/** Relations where the table is the referencing side (out) or the referenced side (in); a self-reference is both */
export function relationsOf(m: ErdModel, tableId: string) {
  return {
    out: m.relations.filter((r) => r.from.table === tableId),
    in: m.relations.filter((r) => r.to.table === tableId),
  };
}

/** How many relations touch a table (a self-reference counts once) */
export const relationCount = (m: ErdModel, tableId: string) => m.relations.filter((r) => r.from.table === tableId || r.to.table === tableId).length;

export interface ColumnFlags {
  pk: boolean;
  fk: boolean;
  unique: boolean;
  notNull: boolean;
  /** In an index that isn't the primary key or a single-column unique constraint */
  indexed: boolean;
  /** Referenced by another table's foreign key */
  referenced: boolean;
}

export function columnFlags(m: ErdModel, t: ErdTable, c: ErdColumn): ColumnFlags {
  return {
    pk: !!c.pk,
    fk: m.relations.some((r) => r.from.table === t.id && r.from.columns.includes(c.name)),
    unique: !!c.unique || t.indexes.some((i) => i.unique && i.columns.length === 1 && i.columns[0] === c.name),
    notNull: !!(c.pk || c.notNull),
    indexed: t.indexes.some((i) => i.columns.includes(c.name) && !(i.unique && i.columns.length === 1)),
    referenced: m.relations.some((r) => r.to.table === t.id && r.to.columns.includes(c.name)),
  };
}

/** The columns a collapsed table still shows: primary and foreign keys, and columns other tables point at */
export function keyColumns(m: ErdModel, t: ErdTable): ErdColumn[] {
  return t.columns.filter((c) => {
    const f = columnFlags(m, t, c);
    return f.pk || f.fk || f.referenced;
  });
}

/** Is this set of columns unique in the table: the whole primary key, a unique column, or a unique index? */
export function isUniqueSet(t: ErdTable, cols: string[]): boolean {
  const pk = t.columns.filter((c) => c.pk).map((c) => c.name);
  const same = (a: string[]) => a.length === cols.length && a.every((x) => cols.includes(x));
  if (pk.length && same(pk)) return true;
  if (cols.length === 1 && t.columns.find((c) => c.name === cols[0])?.unique) return true;
  return t.indexes.some((i) => i.unique && same(i.columns));
}

export type EndKind = "one" | "zero-or-one" | "many" | "zero-or-many";

/**
 * The two ends of a relation in crow's foot terms. The referenced (parent) end is "one" when every
 * foreign key column is NOT NULL, else "zero or one". The referencing (child) end is "zero or
 * many", or "zero or one" when the foreign key is itself unique (a one-to-one).
 */
export function cardinality(m: ErdModel, r: ErdRelation): { parent: EndKind; child: EndKind } {
  const from = tableById(m, r.from.table);
  const cols = from?.columns.filter((c) => r.from.columns.includes(c.name)) ?? [];
  const required = cols.length > 0 && cols.every((c) => c.pk || c.notNull);
  const unique = from ? isUniqueSet(from, r.from.columns) : false;
  return { parent: required ? "one" : "zero-or-one", child: unique ? "zero-or-one" : "zero-or-many" };
}

/** The cardinality in words: "A row in customers can have any number of rows in orders; each row in orders has exactly one in customers." */
export function describeRelation(m: ErdModel, r: ErdRelation): string {
  const from = tableById(m, r.from.table);
  const to = tableById(m, r.to.table);
  if (!from || !to) return "";
  const { parent, child } = cardinality(m, r);
  const lead = child === "zero-or-one" ? `A row in ${to.name} has at most one row in ${from.name}` : `A row in ${to.name} can have any number of rows in ${from.name}`;
  const back = parent === "one" ? `each row in ${from.name} has exactly one in ${to.name}` : `a row in ${from.name} may have none in ${to.name} (the key can be null)`;
  return `${lead}; ${back}.`;
}

/** The short label: 1:N, 1:1, 0..1:N */
export function cardinalityLabel(m: ErdModel, r: ErdRelation): string {
  const { parent, child } = cardinality(m, r);
  return `${parent === "one" ? "1" : "0..1"}:${child === "zero-or-one" ? "1" : "N"}`;
}

/** What screen readers hear for a table: "orders table, 9 columns, 3 relations" */
export function tableLabel(m: ErdModel, t: ErdTable): string {
  const n = relationCount(m, t.id);
  return `${t.name} table in ${t.schema}, ${t.columns.length} ${t.columns.length === 1 ? "column" : "columns"}, ${n} ${n === 1 ? "relation" : "relations"}`;
}

/** The referenced column list as SQL-ish text: customers.id, or inventory.(warehouse_id, variant_id) */
export function endText(m: ErdModel, end: { table: string; columns: string[] }): string {
  const t = tableById(m, end.table);
  const cols = end.columns.length === 1 ? end.columns[0] : `(${end.columns.join(", ")})`;
  return `${t ? qualified(t) : end.table}.${cols}`;
}

const IDENT = /^[a-z_][a-z0-9_$]*$/;

/** Why a table or column name won't do, or null: empty, too long, or (for plain names) odd characters */
export function nameProblem(name: string, taken: string[]): string | null {
  if (!name.trim()) return "Give it a name.";
  if (name.length > 63) return "Postgres cuts names at 63 characters.";
  if (taken.includes(name)) return `“${name}” is already taken.`;
  if (!IDENT.test(name)) return "Use lower-case letters, digits and _, starting with a letter.";
  return null;
}

// ---------------------------------------------------------------------------------------------
// Editing: each returns a new model

const rand = () => Math.random().toString(36).slice(2, 8);

/** A fresh id for a table or relation made in the browser */
export const newId = (prefix: string) => `${prefix}-${rand()}`;

const mapTable = (m: ErdModel, id: string, f: (t: ErdTable) => ErdTable): ErdModel => ({ ...m, tables: m.tables.map((t) => (t.id === id ? f(t) : t)) });

export function addTable(m: ErdModel, table: ErdTable): ErdModel {
  const schemas = m.schemas.some((s) => s.name === table.schema)
    ? m.schemas
    : [...m.schemas, { name: table.schema, color: SCHEMA_COLORS[m.schemas.length % SCHEMA_COLORS.length] }];
  return { ...m, schemas, tables: [...m.tables, table] };
}

export function updateTable(m: ErdModel, id: string, patch: Partial<Pick<ErdTable, "name" | "schema" | "comment">>): ErdModel {
  const next = mapTable(m, id, (t) => ({ ...t, ...patch }));
  if (!patch.schema || next.schemas.some((s) => s.name === patch.schema)) return next;
  return { ...next, schemas: [...next.schemas, { name: patch.schema, color: SCHEMA_COLORS[next.schemas.length % SCHEMA_COLORS.length] }] };
}

export function deleteTables(m: ErdModel, ids: string[]): ErdModel {
  return {
    ...m,
    tables: m.tables.filter((t) => !ids.includes(t.id)),
    relations: m.relations.filter((r) => !ids.includes(r.from.table) && !ids.includes(r.to.table)),
  };
}

export function addColumn(m: ErdModel, tableId: string, column: ErdColumn, at?: number): ErdModel {
  return mapTable(m, tableId, (t) => {
    const cols = [...t.columns];
    cols.splice(at ?? cols.length, 0, column);
    return { ...t, columns: cols };
  });
}

/** Change a column; a new name follows into indexes and relations */
export function updateColumn(m: ErdModel, tableId: string, name: string, column: ErdColumn): ErdModel {
  const rename = (cols: string[]) => cols.map((c) => (c === name ? column.name : c));
  const next = mapTable(m, tableId, (t) => ({
    ...t,
    columns: t.columns.map((c) => (c.name === name ? column : c)),
    indexes: t.indexes.map((i) => ({ ...i, columns: rename(i.columns) })),
  }));
  if (column.name === name) return next;
  return {
    ...next,
    relations: next.relations.map((r) => ({
      ...r,
      from: r.from.table === tableId ? { ...r.from, columns: rename(r.from.columns) } : r.from,
      to: r.to.table === tableId ? { ...r.to, columns: rename(r.to.columns) } : r.to,
    })),
  };
}

/** Remove a column, with the relations that use it; indexes lose it, and go when nothing is left */
export function deleteColumn(m: ErdModel, tableId: string, name: string): ErdModel {
  const next = mapTable(m, tableId, (t) => ({
    ...t,
    columns: t.columns.filter((c) => c.name !== name),
    indexes: t.indexes.map((i) => ({ ...i, columns: i.columns.filter((c) => c !== name) })).filter((i) => i.columns.length > 0),
  }));
  return {
    ...next,
    relations: next.relations.filter(
      (r) => !(r.from.table === tableId && r.from.columns.includes(name)) && !(r.to.table === tableId && r.to.columns.includes(name)),
    ),
  };
}

/** Move a column up or down the table */
export function moveColumn(m: ErdModel, tableId: string, name: string, by: -1 | 1): ErdModel {
  return mapTable(m, tableId, (t) => {
    const i = t.columns.findIndex((c) => c.name === name);
    const j = i + by;
    if (i < 0 || j < 0 || j >= t.columns.length) return t;
    const cols = [...t.columns];
    [cols[i], cols[j]] = [cols[j], cols[i]];
    return { ...t, columns: cols };
  });
}

export const addRelation = (m: ErdModel, r: ErdRelation): ErdModel => ({ ...m, relations: [...m.relations, r] });

export const updateRelation = (m: ErdModel, id: string, patch: Partial<ErdRelation>): ErdModel => ({
  ...m,
  relations: m.relations.map((r) => (r.id === id ? { ...r, ...patch } : r)),
});

export const deleteRelation = (m: ErdModel, id: string): ErdModel => ({ ...m, relations: m.relations.filter((r) => r.id !== id) });

/** The usual constraint name: orders_customer_id_fkey */
export const fkName = (table: string, cols: string[]) => `${table}_${cols.join("_")}_fkey`.slice(0, 63);

/** The columns of a table that can be referenced on their own: the primary key (if it's one column) and unique columns */
export const referenceableColumns = (t: ErdTable) => t.columns.filter((c) => isUniqueSet(t, [c.name]));

/**
 * A foreign key from `child.column` to `parent.column`, or why it can't be made: the referenced
 * column must be a key, and the pair mustn't exist already. When the types differ, `retype` is the
 * referencing column with the referenced column's type (serial types become their integers).
 */
export function referenceTo(
  m: ErdModel,
  child: { table: string; column: string },
  parent: { table: string; column: string },
  actions: { onDelete?: RefAction; onUpdate?: RefAction } = {},
): { relation: ErdRelation; retype?: { table: string; column: ErdColumn } } | { error: string } {
  const ct = tableById(m, child.table);
  const pt = tableById(m, parent.table);
  const cc = ct?.columns.find((c) => c.name === child.column);
  const pc = pt?.columns.find((c) => c.name === parent.column);
  if (!ct || !pt || !cc || !pc) return { error: "That column is gone." };
  if (ct.id === pt.id && cc.name === pc.name) return { error: "A column can't reference itself." };
  if (!isUniqueSet(pt, [pc.name])) return { error: `${pt.name}.${pc.name} is neither a primary key nor unique, so it can't be referenced.` };
  if (m.relations.some((r) => r.from.table === ct.id && r.from.columns.join() === cc.name && r.to.table === pt.id && r.to.columns.join() === pc.name))
    return { error: `${ct.name}.${cc.name} already references ${pt.name}.${pc.name}.` };
  const relation: ErdRelation = {
    id: newId("fk"),
    name: fkName(ct.name, [cc.name]),
    from: { table: ct.id, columns: [cc.name] },
    to: { table: pt.id, columns: [pc.name] },
    onDelete: actions.onDelete ?? "NO ACTION",
    onUpdate: actions.onUpdate ?? "NO ACTION",
  };
  const norm = (t: string) => t.replace(/\s+/g, " ").toLowerCase();
  const want = pc.type === "bigserial" ? "bigint" : pc.type === "serial" ? "integer" : pc.type === "smallserial" ? "smallint" : pc.type;
  return norm(cc.type) === norm(want) ? { relation } : { relation, retype: { table: ct.id, column: { ...cc, type: want } } };
}

/**
 * Connect two columns the way a drag between rows does: the side whose column is a key (primary or
 * unique) is the referenced one, whichever end the drag started from.
 */
export function connectColumns(m: ErdModel, a: { table: string; column: string }, b: { table: string; column: string }) {
  const ta = tableById(m, a.table);
  const tb = tableById(m, b.table);
  if (!ta || !tb) return { error: "That table is gone." };
  const aKey = isUniqueSet(ta, [a.column]);
  const bKey = isUniqueSet(tb, [b.column]);
  if (!aKey && !bKey) return { error: `Neither ${ta.name}.${a.column} nor ${tb.name}.${b.column} is a primary key or unique, so neither can be referenced.` };
  return bKey ? referenceTo(m, a, b) : referenceTo(m, b, a);
}

// ---------------------------------------------------------------------------------------------
// Display

/** How the diagram is drawn; kept apart from the model, since it isn't part of the schema */
export interface ErdDisplay {
  /** Crow's foot marks at the line ends, or plain 1 and N labels */
  notation: "crow" | "labels";
  /** Right angles with rounded corners, or smooth curves */
  lines: "orthogonal" | "curved";
  /** Column types in the tables */
  types: boolean;
  /** NULL marks on nullable columns */
  nullability: boolean;
  /** A frame round each schema's tables */
  frames: boolean;
  minimap: boolean;
  legend: boolean;
  /** Snap dragged tables to the grid */
  snap: boolean;
  /** What dragging the background does */
  tool: "pan" | "select";
}

export const DEFAULT_DISPLAY: ErdDisplay = {
  notation: "crow",
  lines: "orthogonal",
  types: true,
  nullability: true,
  frames: true,
  minimap: true,
  legend: false,
  snap: true,
  tool: "pan",
};
