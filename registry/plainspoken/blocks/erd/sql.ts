// Postgres DDL for an ERD model, both ways: write CREATE TABLE statements (foreign keys as ALTER
// TABLE at the end, so the order of tables never matters), and read them back with a small parser
// for the common subset. The parser knows CREATE SCHEMA, CREATE TABLE (columns with NOT NULL, NULL,
// DEFAULT, PRIMARY KEY, UNIQUE, REFERENCES and identity; PRIMARY KEY, UNIQUE and FOREIGN KEY
// constraints), CREATE INDEX, ALTER TABLE … ADD CONSTRAINT, and COMMENT ON. Other statements are
// skipped with a note; mistakes come back as errors with their line numbers.

import type { ErdColumn, ErdIndex, ErdModel, ErdRelation, ErdSchemaInfo, ErdTable, RefAction } from "@/registry/plainspoken/blocks/erd/model";

const COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];

// ---------------------------------------------------------------------------------------------
// Writing

/** Words that must be quoted to be used as a name */
const RESERVED = new Set(
  "all analyse analyze and any array as asc asymmetric both case cast check collate column constraint create current_catalog current_date current_role current_time current_timestamp current_user default deferrable desc distinct do else end except false fetch for foreign from grant group having in initially intersect into lateral leading limit localtime localtimestamp not null offset on only or order placing primary references returning select session_user some symmetric table then to trailing true union unique user using variadic when where window with".split(
    " ",
  ),
);

/** A name as SQL: bare when it can be, "quoted" otherwise */
export function quoteIdent(name: string): string {
  return /^[a-z_][a-z0-9_$]*$/.test(name) && !RESERVED.has(name) ? name : `"${name.replace(/"/g, '""')}"`;
}

const q = quoteIdent;
const qt = (t: { schema: string; name: string }) => `${q(t.schema)}.${q(t.name)}`;
const lit = (s: string) => `'${s.replace(/'/g, "''")}'`;
const list = (cols: string[]) => cols.map(q).join(", ");

/** The whole model as a script that creates it in an empty Postgres database */
export function toDDL(m: ErdModel): string {
  const out: string[] = [];
  const schemas = [...new Set([...m.schemas.map((s) => s.name), ...m.tables.map((t) => t.schema)])].filter((s) => m.tables.some((t) => t.schema === s));
  const byId = new Map(m.tables.map((t) => [t.id, t]));
  out.push(`-- ${m.name}: ${m.tables.length} tables in ${schemas.length} ${schemas.length === 1 ? "schema" : "schemas"}, ${m.relations.length} foreign keys`, "");
  for (const s of schemas) {
    if (s !== "public") out.push(`CREATE SCHEMA IF NOT EXISTS ${q(s)};`);
    const info = m.schemas.find((x) => x.name === s);
    if (info?.comment) out.push(`COMMENT ON SCHEMA ${q(s)} IS ${lit(info.comment)};`);
  }
  if (out.length > 2) out.push("");
  for (const s of schemas) {
    for (const t of m.tables.filter((x) => x.schema === s)) {
      const width = Math.max(...t.columns.map((c) => q(c.name).length));
      const lines = t.columns.map((c) => {
        let line = `  ${q(c.name).padEnd(width)} ${c.type}`;
        if (c.identity) line += " GENERATED ALWAYS AS IDENTITY";
        if (c.pk || c.notNull) line += " NOT NULL";
        if (c.default != null && c.default !== "") line += ` DEFAULT ${c.default}`;
        if (c.unique && !c.pk) line += " UNIQUE";
        return line;
      });
      const pk = t.columns.filter((c) => c.pk).map((c) => c.name);
      if (pk.length) lines.push(`  PRIMARY KEY (${list(pk)})`);
      out.push(`CREATE TABLE ${qt(t)} (`, lines.join(",\n"), ");");
      if (t.comment) out.push(`COMMENT ON TABLE ${qt(t)} IS ${lit(t.comment)};`);
      for (const c of t.columns) if (c.comment) out.push(`COMMENT ON COLUMN ${qt(t)}.${q(c.name)} IS ${lit(c.comment)};`);
      for (const i of t.indexes) out.push(`CREATE ${i.unique ? "UNIQUE " : ""}INDEX ${q(i.name)} ON ${qt(t)}${i.using ? ` USING ${i.using}` : ""} (${list(i.columns)});`);
      out.push("");
    }
  }
  if (m.relations.length) out.push("-- Foreign keys, once every table exists");
  for (const r of m.relations) {
    const from = byId.get(r.from.table);
    const to = byId.get(r.to.table);
    if (!from || !to) continue;
    let line = `ALTER TABLE ${qt(from)} ADD ${r.name ? `CONSTRAINT ${q(r.name)} ` : ""}FOREIGN KEY (${list(r.from.columns)}) REFERENCES ${qt(to)} (${list(r.to.columns)})`;
    if (r.onDelete !== "NO ACTION") line += ` ON DELETE ${r.onDelete}`;
    if (r.onUpdate !== "NO ACTION") line += ` ON UPDATE ${r.onUpdate}`;
    out.push(line + ";");
  }
  return out.join("\n").replace(/\n{3,}/g, "\n\n").trimEnd() + "\n";
}

// ---------------------------------------------------------------------------------------------
// Reading

export interface SqlProblem {
  line: number;
  message: string;
}

export interface ParseResult {
  model: ErdModel;
  /** Mistakes: the script can't be imported as it is */
  errors: SqlProblem[];
  /** Statements that were skipped, and other things worth knowing */
  notes: SqlProblem[];
}

type TokKind = "word" | "ident" | "string" | "number" | "punct" | "op";
interface Tok {
  k: TokKind;
  /** The word lower-cased, the quoted name or string unescaped, the punctuation as it is */
  v: string;
  start: number;
  end: number;
  line: number;
}

class SqlError extends Error {
  line: number;
  constructor(line: number, message: string) {
    super(message);
    this.line = line;
  }
}

function tokenize(src: string): { toks: Tok[]; errors: SqlProblem[] } {
  const toks: Tok[] = [];
  const errors: SqlProblem[] = [];
  let i = 0;
  let line = 1;
  const n = src.length;
  const advance = (to: number) => {
    for (let j = i; j < to; j++) if (src[j] === "\n") line++;
    i = to;
  };
  while (i < n) {
    const c = src[i];
    if (c === "\n" || c === " " || c === "\t" || c === "\r") {
      advance(i + 1);
    } else if (c === "-" && src[i + 1] === "-") {
      const e = src.indexOf("\n", i);
      advance(e < 0 ? n : e);
    } else if (c === "/" && src[i + 1] === "*") {
      const e = src.indexOf("*/", i + 2);
      if (e < 0) {
        errors.push({ line, message: "A /* comment is never closed." });
        advance(n);
      } else advance(e + 2);
    } else if (c === "'" || ((c === "E" || c === "e") && src[i + 1] === "'")) {
      const start = i;
      const at = line;
      let j = c === "'" ? i + 1 : i + 2;
      let v = "";
      for (;;) {
        if (j >= n) {
          errors.push({ line: at, message: "A quoted string is never closed: a ' is missing." });
          break;
        }
        if (src[j] === "'" && src[j + 1] === "'") {
          v += "'";
          j += 2;
        } else if (src[j] === "'") {
          j++;
          break;
        } else v += src[j++];
      }
      toks.push({ k: "string", v, start, end: j, line: at });
      advance(j);
    } else if (c === '"') {
      const start = i;
      const at = line;
      let j = i + 1;
      let v = "";
      for (;;) {
        if (j >= n) {
          errors.push({ line: at, message: 'A quoted name is never closed: a " is missing.' });
          break;
        }
        if (src[j] === '"' && src[j + 1] === '"') {
          v += '"';
          j += 2;
        } else if (src[j] === '"') {
          j++;
          break;
        } else v += src[j++];
      }
      toks.push({ k: "ident", v, start, end: j, line: at });
      advance(j);
    } else if (c === "$" && /^\$\w*\$/.test(src.slice(i))) {
      const tag = src.slice(i).match(/^\$\w*\$/)![0];
      const e = src.indexOf(tag, i + tag.length);
      const end = e < 0 ? n : e + tag.length;
      if (e < 0) errors.push({ line, message: `A ${tag} quoted string is never closed.` });
      toks.push({ k: "string", v: src.slice(i + tag.length, e < 0 ? n : e), start: i, end, line });
      advance(end);
    } else if (/[0-9]/.test(c) || (c === "." && /[0-9]/.test(src[i + 1] ?? ""))) {
      const m = src.slice(i).match(/^\d*\.?\d+(?:e[+-]?\d+)?/i)!;
      toks.push({ k: "number", v: m[0], start: i, end: i + m[0].length, line });
      advance(i + m[0].length);
    } else if (/[A-Za-z_\u0080-￿]/.test(c)) {
      const m = src.slice(i).match(/^[A-Za-z_\u0080-￿][A-Za-z0-9_$\u0080-￿]*/)!;
      toks.push({ k: "word", v: m[0].toLowerCase(), start: i, end: i + m[0].length, line });
      advance(i + m[0].length);
    } else if ("(),;.[]".includes(c)) {
      toks.push({ k: "punct", v: c, start: i, end: i + 1, line });
      advance(i + 1);
    } else if (c === ":" && src[i + 1] === ":") {
      toks.push({ k: "op", v: "::", start: i, end: i + 2, line });
      advance(i + 2);
    } else {
      const m = src.slice(i).match(/^[+\-*/<>=~!@#%^&|`?:]+/);
      if (m) {
        toks.push({ k: "op", v: m[0], start: i, end: i + m[0].length, line });
        advance(i + m[0].length);
      } else {
        errors.push({ line, message: `“${c}” makes no sense here.` });
        advance(i + 1);
      }
    }
  }
  return { toks, errors };
}

/** Statements: tokens up to each ; outside parentheses */
function statements(toks: Tok[]): Tok[][] {
  const out: Tok[][] = [];
  let cur: Tok[] = [];
  let depth = 0;
  for (const t of toks) {
    if (t.k === "punct" && t.v === "(") depth++;
    if (t.k === "punct" && t.v === ")") depth = Math.max(0, depth - 1);
    if (t.k === "punct" && t.v === ";" && depth === 0) {
      if (cur.length) out.push(cur);
      cur = [];
    } else cur.push(t);
  }
  if (cur.length) out.push(cur);
  return out;
}

/** Words that end a column's type or default */
const COLUMN_WORDS = new Set(["constraint", "not", "null", "primary", "unique", "default", "references", "check", "generated", "collate"]);

interface PendingFk {
  line: number;
  name?: string;
  from: { schema: string; name: string; columns: string[] };
  to: { schema?: string; name: string; columns?: string[] };
  onDelete: RefAction;
  onUpdate: RefAction;
}

interface Parsed {
  schemas: { name: string; comment?: string }[];
  tables: ErdTable[];
  fks: PendingFk[];
  comments: { line: number; target: "table" | "column"; path: string[]; text: string }[];
  indexes: { line: number; table: { schema?: string; name: string }; index: ErdIndex }[];
  pks: { line: number; table: { schema?: string; name: string }; columns: string[] }[];
  /** Tables whose CREATE TABLE had an error, by line, so references to them can say so */
  broken: { schema: string; name: string; line: number }[];
}

/** A cursor over one statement's tokens */
class Reader {
  i = 0;
  toks: Tok[];
  src: string;
  constructor(toks: Tok[], src: string) {
    this.toks = toks;
    this.src = src;
  }
  get done() {
    return this.i >= this.toks.length;
  }
  peek(o = 0): Tok | undefined {
    return this.toks[this.i + o];
  }
  get line() {
    return (this.peek() ?? this.toks[this.toks.length - 1])?.line ?? 1;
  }
  isWord(...ws: string[]) {
    const t = this.peek();
    return !!t && t.k === "word" && ws.includes(t.v);
  }
  isPunct(p: string) {
    const t = this.peek();
    return !!t && t.k === "punct" && t.v === p;
  }
  /** Take these words in order if they are next */
  accept(...ws: string[]): boolean {
    for (let j = 0; j < ws.length; j++) {
      const t = this.peek(j);
      if (!t || t.k !== "word" || t.v !== ws[j]) return false;
    }
    this.i += ws.length;
    return true;
  }
  expectWord(...ws: string[]) {
    if (!this.accept(...ws)) throw new SqlError(this.line, `Expected ${ws.join(" ").toUpperCase()}${this.near()}.`);
  }
  expectPunct(p: string) {
    if (!this.isPunct(p)) throw new SqlError(this.line, `Expected “${p}”${this.near()}.`);
    this.i++;
  }
  near() {
    const t = this.peek();
    return t ? ` but found “${this.src.slice(t.start, t.end)}”` : " but the statement ended";
  }
  /** A name: bare words fold to lower case, "quoted" ones keep theirs */
  name(what: string): string {
    const t = this.peek();
    if (!t || (t.k !== "word" && t.k !== "ident")) throw new SqlError(this.line, `Expected ${what}${this.near()}.`);
    this.i++;
    return t.v;
  }
  /** schema.name or name */
  qname(what: string): { schema?: string; name: string } {
    const a = this.name(what);
    if (this.isPunct(".")) {
      this.i++;
      return { schema: a, name: this.name(what) };
    }
    return { name: a };
  }
  /** ( a, b, c ) */
  nameList(what: string): string[] {
    this.expectPunct("(");
    const out = [this.name(what)];
    while (this.isPunct(",")) {
      this.i++;
      out.push(this.name(what));
    }
    this.expectPunct(")");
    return out;
  }
  /** Skip a balanced ( … ) */
  skipParens() {
    this.expectPunct("(");
    let depth = 1;
    while (!this.done && depth > 0) {
      const t = this.toks[this.i++];
      if (t.k === "punct" && t.v === "(") depth++;
      if (t.k === "punct" && t.v === ")") depth--;
    }
    if (depth > 0) throw new SqlError(this.line, "A “(” is never closed.");
  }
  /** Tokens up to (not including) a , or ) at this depth, or one of `stop` words; the source text between */
  until(stop: Set<string>, takeFirst = false): string {
    const from = this.i;
    let depth = 0;
    while (!this.done) {
      const t = this.peek()!;
      if (t.k === "punct" && t.v === "(") depth++;
      else if (t.k === "punct" && t.v === ")") {
        if (depth === 0) break;
        depth--;
      } else if (depth === 0 && t.k === "punct" && t.v === ",") break;
      else if (depth === 0 && t.k === "word" && stop.has(t.v) && !(takeFirst && this.i === from)) break;
      this.i++;
    }
    if (this.i === from) return "";
    return this.src.slice(this.toks[from].start, this.toks[this.i - 1].end).replace(/\s+/g, " ");
  }
  refAction(): RefAction {
    if (this.accept("no", "action")) return "NO ACTION";
    if (this.accept("restrict")) return "RESTRICT";
    if (this.accept("cascade")) return "CASCADE";
    if (this.accept("set", "null")) return "SET NULL";
    if (this.accept("set", "default")) return "SET DEFAULT";
    throw new SqlError(this.line, `Expected CASCADE, RESTRICT, SET NULL, SET DEFAULT or NO ACTION${this.near()}.`);
  }
  /** REFERENCES t [(cols)] [MATCH …] [ON DELETE x] [ON UPDATE y] [DEFERRABLE …] (REFERENCES already taken) */
  references(): Pick<PendingFk, "to" | "onDelete" | "onUpdate"> {
    const to: PendingFk["to"] = this.qname("the referenced table");
    if (this.isPunct("(")) to.columns = this.nameList("a referenced column");
    let onDelete: RefAction = "NO ACTION";
    let onUpdate: RefAction = "NO ACTION";
    for (;;) {
      if (this.accept("on", "delete")) onDelete = this.refAction();
      else if (this.accept("on", "update")) onUpdate = this.refAction();
      else if (this.accept("match")) this.name("FULL, PARTIAL or SIMPLE");
      else if (this.accept("not", "deferrable") || this.accept("deferrable")) continue;
      else if (this.accept("initially")) this.name("DEFERRED or IMMEDIATE");
      else break;
    }
    return { to, onDelete, onUpdate };
  }
}

const statementText = (toks: Tok[], n = 3) => toks.slice(0, n).map((t) => t.v.toUpperCase()).join(" ");

function parseCreateTable(r: Reader, p: Parsed, defaultSchema: string) {
  const line = r.line;
  r.accept("if", "not", "exists");
  const tn = r.qname("the table's name");
  const schema = tn.schema ?? defaultSchema;
  try {
    tableBody(r, p, tn, schema, line);
  } catch (e) {
    p.broken.push({ schema, name: tn.name, line });
    throw e;
  }
}

function tableBody(r: Reader, p: Parsed, tn: { name: string }, schema: string, line: number) {
  if (r.accept("partition", "of") || r.accept("of")) throw new SqlError(line, "Typed and partition tables (OF …) aren't supported.");
  r.expectPunct("(");
  const t: ErdTable = { id: `${schema}.${tn.name}`, schema, name: tn.name, columns: [], indexes: [] };
  const tableUnique = (cols: string[], at: number) => {
    if (cols.length === 1) {
      const c = t.columns.find((x) => x.name === cols[0]);
      if (!c) throw new SqlError(at, `UNIQUE (${cols[0]}): ${tn.name} has no column “${cols[0]}”.`);
      c.unique = true;
    } else t.indexes.push({ name: `${tn.name}_${cols.join("_")}_key`, columns: cols, unique: true });
  };
  for (;;) {
    if (r.isPunct(")")) break;
    const at = r.line;
    let cname: string | undefined;
    if (r.accept("constraint")) cname = r.name("the constraint's name");
    if (r.accept("primary", "key")) {
      const cols = r.nameList("a column");
      p.pks.push({ line: at, table: { schema, name: tn.name }, columns: cols });
      r.until(new Set());
    } else if (r.accept("unique")) {
      if (!r.accept("nulls", "not", "distinct")) r.accept("nulls", "distinct");
      tableUnique(r.nameList("a column"), at);
      r.until(new Set());
    } else if (r.accept("foreign", "key")) {
      const cols = r.nameList("a column");
      r.expectWord("references");
      p.fks.push({ line: at, name: cname, from: { schema, name: tn.name, columns: cols }, ...r.references() });
    } else if (r.accept("check")) {
      r.skipParens();
      r.until(new Set());
    } else if (r.accept("exclude") || r.accept("like")) {
      throw new SqlError(at, "EXCLUDE and LIKE in a table aren't supported.");
    } else if (cname) {
      throw new SqlError(at, `Expected PRIMARY KEY, UNIQUE, FOREIGN KEY or CHECK after CONSTRAINT ${cname}${r.near()}.`);
    } else {
      const name = r.name("a column name");
      if (t.columns.some((c) => c.name === name)) throw new SqlError(at, `${tn.name} has two columns called “${name}”.`);
      const type = r.until(COLUMN_WORDS);
      if (!type) throw new SqlError(at, `Column “${name}” needs a type${r.near()}.`);
      const c: ErdColumn = { name, type: /"/.test(type) ? type : type.toLowerCase() };
      for (;;) {
        if (r.isPunct(",") || r.isPunct(")") || r.done) break;
        let ccname: string | undefined;
        if (r.accept("constraint")) ccname = r.name("the constraint's name");
        if (r.accept("not", "null")) c.notNull = true;
        else if (r.accept("null")) c.notNull = false;
        else if (r.accept("primary", "key")) c.pk = true;
        else if (r.accept("unique")) {
          if (!r.accept("nulls", "not", "distinct")) r.accept("nulls", "distinct");
          c.unique = true;
        } else if (r.accept("default")) {
          const d = r.until(COLUMN_WORDS, true);
          if (!d) throw new SqlError(r.line, `DEFAULT of “${name}” needs a value${r.near()}.`);
          c.default = d;
        } else if (r.accept("references")) {
          p.fks.push({ line: r.line, name: ccname, from: { schema, name: tn.name, columns: [name] }, ...r.references() });
        } else if (r.accept("check")) r.skipParens();
        else if (r.accept("collate")) r.qname("a collation");
        else if (r.accept("generated")) {
          if (r.accept("always", "as", "identity") || r.accept("by", "default", "as", "identity")) {
            c.identity = true;
            c.notNull = true;
            if (r.isPunct("(")) r.skipParens();
          } else if (r.accept("always", "as")) {
            r.skipParens();
            r.accept("stored");
          } else throw new SqlError(r.line, `Expected ALWAYS AS IDENTITY after GENERATED${r.near()}.`);
        } else throw new SqlError(r.line, `Don't know what to do with “${r.src.slice(r.peek()!.start, r.peek()!.end)}” in column “${name}”.`);
      }
      if (c.pk) c.notNull = true;
      t.columns.push(c);
    }
    if (r.isPunct(",")) {
      r.i++;
      continue;
    }
    if (!r.isPunct(")")) throw new SqlError(r.line, `Expected “,” or “)”${r.near()}.`);
  }
  r.expectPunct(")");
  if (!t.columns.length) throw new SqlError(line, `${tn.name} has no columns.`);
  if (p.tables.some((x) => x.id === t.id)) throw new SqlError(line, `${schema}.${tn.name} is created twice.`);
  p.tables.push(t);
}

function parseIndex(r: Reader, p: Parsed, unique: boolean) {
  const line = r.line;
  r.accept("concurrently");
  r.accept("if", "not", "exists");
  let name: string | undefined;
  if (!r.isWord("on")) name = r.name("the index's name");
  r.expectWord("on");
  r.accept("only");
  const table = r.qname("the table's name");
  let using: string | undefined;
  if (r.accept("using")) using = r.name("an index method");
  r.expectPunct("(");
  const columns: string[] = [];
  for (;;) {
    const t = r.peek();
    // A plain column; an expression is kept as its text
    const text = r.until(new Set(["asc", "desc", "nulls", "collate"]));
    if (!text) throw new SqlError(r.line, `Expected a column in the index${r.near()}.`);
    columns.push(t && (t.k === "word" || t.k === "ident") && r.toks.indexOf(t) === r.i - 1 ? t.v : text);
    while (r.accept("asc") || r.accept("desc") || r.accept("nulls", "first") || r.accept("nulls", "last")) continue;
    if (r.isPunct(",")) {
      r.i++;
      continue;
    }
    break;
  }
  r.expectPunct(")");
  p.indexes.push({
    line,
    table,
    index: { name: name ?? `${table.name}_${columns.join("_")}_${unique ? "key" : "idx"}`, columns, ...(unique ? { unique } : {}), ...(using && using !== "btree" ? { using } : {}) },
  });
}

function parseAlter(r: Reader, p: Parsed, notes: SqlProblem[], defaultSchema: string) {
  const line = r.line;
  r.accept("if", "exists");
  r.accept("only");
  const tn = r.qname("the table's name");
  const schema = tn.schema ?? defaultSchema;
  if (!r.accept("add")) {
    notes.push({ line, message: `Skipped ALTER TABLE ${tn.name} ${r.peek()?.v.toUpperCase() ?? ""}: only ADD CONSTRAINT is read.` });
    return;
  }
  let cname: string | undefined;
  if (r.accept("constraint")) cname = r.name("the constraint's name");
  if (r.accept("foreign", "key")) {
    const cols = r.nameList("a column");
    r.expectWord("references");
    p.fks.push({ line, name: cname, from: { schema, name: tn.name, columns: cols }, ...r.references() });
  } else if (r.accept("primary", "key")) {
    p.pks.push({ line, table: { schema, name: tn.name }, columns: r.nameList("a column") });
  } else if (r.accept("unique")) {
    const cols = r.nameList("a column");
    p.indexes.push({ line, table: { schema, name: tn.name }, index: { name: cname ?? `${tn.name}_${cols.join("_")}_key`, columns: cols, unique: true } });
  } else notes.push({ line, message: `Skipped ALTER TABLE ${tn.name} ADD …: only constraints are read.` });
  if (!r.done) throw new SqlError(r.line, `Expected the end of the statement${r.near()}.`);
}

/**
 * Read CREATE TABLE statements and friends into a model. Unqualified names go in `public`. Every
 * problem is reported (each with its line), not just the first; `errors` empty means the model is
 * complete.
 */
export function parseDDL(src: string, defaultSchema = "public"): ParseResult {
  const { toks, errors } = tokenize(src);
  // A broken string or comment garbles the rest of its statement: one error for it is enough
  const lexed = new Set(errors.map((e) => e.line));
  const notes: SqlProblem[] = [];
  const p: Parsed = { schemas: [], tables: [], fks: [], comments: [], indexes: [], pks: [], broken: [] };
  for (const st of statements(toks)) {
    const r = new Reader(st, src);
    const line = st[0].line;
    try {
      if (r.accept("create")) {
        r.accept("or", "replace");
        if (!r.accept("unlogged") && !r.accept("temporary")) r.accept("temp");
        if (r.accept("schema")) {
          r.accept("if", "not", "exists");
          const name = r.name("the schema's name");
          if (!p.schemas.some((s) => s.name === name)) p.schemas.push({ name });
        } else if (r.accept("table")) parseCreateTable(r, p, defaultSchema);
        else if (r.accept("unique", "index")) parseIndex(r, p, true);
        else if (r.accept("index")) parseIndex(r, p, false);
        else notes.push({ line, message: `Skipped ${statementText(st)}: not part of a diagram.` });
      } else if (r.accept("alter", "table")) parseAlter(r, p, notes, defaultSchema);
      else if (r.accept("comment", "on")) {
        const what = r.name("TABLE, COLUMN or SCHEMA");
        const path = [r.name("a name")];
        while (r.isPunct(".")) {
          r.i++;
          path.push(r.name("a name"));
        }
        r.expectWord("is");
        const s = r.peek();
        if (s?.k === "string") r.i++;
        else r.expectWord("null");
        if (what === "schema") {
          const sc = p.schemas.find((x) => x.name === path[0]);
          if (sc && s?.k === "string") sc.comment = s.v;
        } else if (what === "table" || what === "column") p.comments.push({ line, target: what, path, text: s?.k === "string" ? s.v : "" });
        else notes.push({ line, message: `Skipped COMMENT ON ${what.toUpperCase()}.` });
      } else if (st[0].k === "word") notes.push({ line, message: `Skipped ${statementText(st, 2)}: not part of a diagram.` });
      else throw new SqlError(line, `A statement can't start with “${src.slice(st[0].start, st[0].end)}”.`);
    } catch (e) {
      if (!(e instanceof SqlError)) throw e;
      if (!lexed.has(e.line)) errors.push({ line: e.line, message: e.message });
    }
  }

  // Put the pieces together: tables are known now, so names can be checked
  const find = (t: { schema?: string; name: string }) => {
    if (t.schema) return p.tables.find((x) => x.schema === t.schema && x.name === t.name);
    const own = p.tables.find((x) => x.schema === defaultSchema && x.name === t.name);
    if (own) return own;
    const any = p.tables.filter((x) => x.name === t.name);
    return any.length === 1 ? any[0] : undefined;
  };
  const show = (t: { schema?: string; name: string }) => (t.schema ? `${t.schema}.${t.name}` : t.name);
  const missingCols = (t: ErdTable, cols: string[]) => cols.filter((c) => !t.columns.some((x) => x.name === c));

  for (const pk of p.pks) {
    const t = find(pk.table);
    if (!t) {
      errors.push({ line: pk.line, message: `PRIMARY KEY on ${show(pk.table)}: there is no such table.` });
      continue;
    }
    const missing = missingCols(t, pk.columns);
    if (missing.length) errors.push({ line: pk.line, message: `PRIMARY KEY (${pk.columns.join(", ")}): ${t.name} has no column “${missing[0]}”.` });
    for (const c of t.columns) if (pk.columns.includes(c.name)) Object.assign(c, { pk: true, notNull: true });
  }
  for (const ix of p.indexes) {
    const t = find(ix.table);
    if (!t) errors.push({ line: ix.line, message: `Index ${ix.index.name}: there is no table ${show(ix.table)}.` });
    else {
      const missing = missingCols(t, ix.index.columns.filter((c) => /^[^\s(]+$/.test(c)));
      if (missing.length) errors.push({ line: ix.line, message: `Index ${ix.index.name}: ${t.name} has no column “${missing[0]}”.` });
      else t.indexes.push(ix.index);
    }
  }
  for (const c of p.comments) {
    const [a, b, d] = c.path;
    const tableRef = c.target === "table" ? (b ? { schema: a, name: b } : { name: a }) : d ? { schema: a, name: b } : { name: a };
    const col = c.target === "column" ? (d ?? b) : undefined;
    const t = find(tableRef);
    if (!t) {
      errors.push({ line: c.line, message: `COMMENT ON ${c.target.toUpperCase()} ${c.path.join(".")}: there is no table ${show(tableRef)}.` });
      continue;
    }
    if (!col) t.comment = c.text || undefined;
    else {
      const cc = t.columns.find((x) => x.name === col);
      if (!cc) errors.push({ line: c.line, message: `COMMENT ON COLUMN ${c.path.join(".")}: ${t.name} has no column “${col}”.` });
      else cc.comment = c.text || undefined;
    }
  }

  const relations: ErdRelation[] = [];
  const used = new Set<string>();
  for (const fk of p.fks) {
    const from = find(fk.from);
    const to = find(fk.to);
    if (!from) {
      // Inside a CREATE TABLE that failed: that error is enough
      if (!p.broken.some((b) => b.name === fk.from.name && (!fk.from.schema || b.schema === fk.from.schema)))
        errors.push({ line: fk.line, message: `Foreign key on ${show(fk.from)}: there is no such table.` });
      continue;
    }
    if (!to) {
      const broken = p.broken.find((b) => b.name === fk.to.name && (!fk.to.schema || b.schema === fk.to.schema));
      errors.push({
        line: fk.line,
        message: broken
          ? `${from.name} (${fk.from.columns.join(", ")}) references ${show(fk.to)}, which couldn't be read (line ${broken.line}).`
          : `${from.name} (${fk.from.columns.join(", ")}) references ${show(fk.to)}, which isn't in the script.`,
      });
      continue;
    }
    const missing = missingCols(from, fk.from.columns);
    if (missing.length) {
      errors.push({ line: fk.line, message: `FOREIGN KEY (${fk.from.columns.join(", ")}): ${from.name} has no column “${missing[0]}”.` });
      continue;
    }
    const toCols = fk.to.columns ?? to.columns.filter((c) => c.pk).map((c) => c.name);
    if (!toCols.length) {
      errors.push({ line: fk.line, message: `${from.name} references ${to.name} without naming columns, and ${to.name} has no primary key.` });
      continue;
    }
    const missingTo = missingCols(to, toCols);
    if (missingTo.length) {
      errors.push({ line: fk.line, message: `${from.name} references ${to.name} (${toCols.join(", ")}), but ${to.name} has no column “${missingTo[0]}”.` });
      continue;
    }
    if (toCols.length !== fk.from.columns.length) {
      errors.push({ line: fk.line, message: `${from.name} (${fk.from.columns.join(", ")}) references ${toCols.length} columns of ${to.name}: the counts must match.` });
      continue;
    }
    let name = fk.name ?? `${from.name}_${fk.from.columns.join("_")}_fkey`;
    for (let k = 2; used.has(name); k++) name = `${fk.name ?? `${from.name}_${fk.from.columns.join("_")}_fkey`}${k}`;
    used.add(name);
    relations.push({ id: name, name, from: { table: from.id, columns: fk.from.columns }, to: { table: to.id, columns: toCols }, onDelete: fk.onDelete, onUpdate: fk.onUpdate });
  }

  const order = [...p.schemas.map((s) => s.name), ...p.tables.map((t) => t.schema)];
  const schemaNames = [...new Set(order)].filter((s) => p.tables.some((t) => t.schema === s));
  const schemas: ErdSchemaInfo[] = schemaNames.map((name, i) => {
    const comment = p.schemas.find((s) => s.name === name)?.comment;
    return { name, color: COLORS[i % COLORS.length], ...(comment ? { comment } : {}) };
  });
  const tables = p.tables;
  if (!tables.length && !errors.length) errors.push({ line: 1, message: "There is no CREATE TABLE in it." });
  errors.sort((a, b) => a.line - b.line);
  return { model: { name: "imported", schemas, tables, relations }, errors, notes };
}
