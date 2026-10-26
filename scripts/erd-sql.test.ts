// Unit tests for registry/plainspoken/blocks/erd/sql.ts:   node --test scripts/erd-sql.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { parseDDL, quoteIdent, toDDL } from "../registry/plainspoken/blocks/erd/sql.ts";
import { ORDERS_MODEL, SHOP_MODEL } from "../registry/plainspoken/blocks/erd/data.ts";
import type { ErdModel } from "../registry/plainspoken/blocks/erd/model.ts";

/** The parts of a model that SQL carries (not colours, ids or the name) */
function shape(m: ErdModel) {
  return {
    schemas: m.schemas.map((s) => [s.name, s.comment ?? null]),
    tables: m.tables.map((t) => ({
      schema: t.schema,
      name: t.name,
      comment: t.comment ?? null,
      columns: t.columns.map((c) => ({
        name: c.name,
        type: c.type,
        pk: !!c.pk,
        notNull: !!(c.pk || c.notNull),
        unique: !!c.unique,
        default: c.default ?? null,
        identity: !!c.identity,
        comment: c.comment ?? null,
      })),
      indexes: t.indexes.map((i) => ({ name: i.name, columns: i.columns, unique: !!i.unique, using: i.using ?? null })),
    })),
    relations: m.relations.map((r) => ({ name: r.name, from: r.from, to: r.to, onDelete: r.onDelete, onUpdate: r.onUpdate })),
  };
}

test("the demo schema survives export and import unchanged", () => {
  const sql = toDDL(SHOP_MODEL);
  const back = parseDDL(sql);
  assert.deepEqual(back.errors, []);
  assert.deepEqual(back.notes, []);
  assert.deepEqual(shape(back.model), shape(SHOP_MODEL));
  // and once more, from its own output
  assert.equal(toDDL({ ...back.model, name: SHOP_MODEL.name }), sql);
});

test("a smaller model round-trips too", () => {
  const back = parseDDL(toDDL(ORDERS_MODEL));
  assert.deepEqual(back.errors, []);
  assert.deepEqual(shape(back.model), shape(ORDERS_MODEL));
});

test("inline constraints, table constraints and unqualified names", () => {
  const r = parseDDL(`
    -- a comment
    CREATE TABLE authors (
      id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      Email TEXT NOT NULL UNIQUE,
      "Display Name" varchar(80),
      born date NULL,
      created_at timestamp with time zone DEFAULT now() NOT NULL
    );
    create table books (
      id uuid default gen_random_uuid(),
      author_id bigint not null references authors on delete cascade,
      isbn char(13),
      title text not null default 'Untitled'::text,
      tags text[] DEFAULT '{}',
      constraint books_pk primary key (id),
      unique (isbn),
      check (char_length(title) > 0)
    );
    CREATE TABLE editions (
      book_id uuid, number int,
      PRIMARY KEY (book_id, number),
      CONSTRAINT editions_book FOREIGN KEY (book_id) REFERENCES public.books (id) ON UPDATE CASCADE ON DELETE RESTRICT
    );
    CREATE UNIQUE INDEX authors_lower_email ON authors (lower(email));
    CREATE INDEX books_title_idx ON books USING gin (title);
  `);
  assert.deepEqual(r.errors, []);
  const [authors, books, editions] = r.model.tables;
  assert.equal(authors.id, "public.authors");
  assert.deepEqual(
    authors.columns.map((c) => [c.name, c.type, !!c.pk, !!c.notNull, !!c.unique, c.default ?? null, !!c.identity]),
    [
      ["id", "bigint", true, true, false, null, true],
      ["email", "text", false, true, true, null, false],
      ["Display Name", "varchar(80)", false, false, false, null, false],
      ["born", "date", false, false, false, null, false],
      ["created_at", "timestamp with time zone", false, true, false, "now()", false],
    ],
  );
  assert.equal(books.columns.find((c) => c.name === "title")!.default, "'Untitled'::text");
  assert.equal(books.columns.find((c) => c.name === "tags")!.type, "text[]");
  assert.equal(books.columns.find((c) => c.name === "isbn")!.unique, true);
  assert.equal(books.columns.find((c) => c.name === "id")!.pk, true);
  assert.deepEqual(editions.columns.filter((c) => c.pk).map((c) => c.name), ["book_id", "number"]);
  assert.deepEqual(
    r.model.relations.map((x) => [x.name, x.from.table, x.from.columns, x.to.table, x.to.columns, x.onDelete, x.onUpdate]),
    [
      ["books_author_id_fkey", "public.books", ["author_id"], "public.authors", ["id"], "CASCADE", "NO ACTION"],
      ["editions_book", "public.editions", ["book_id"], "public.books", ["id"], "RESTRICT", "CASCADE"],
    ],
  );
  assert.deepEqual(authors.indexes, [{ name: "authors_lower_email", columns: ["lower(email)"], unique: true }]);
  assert.deepEqual(books.indexes, [{ name: "books_title_idx", columns: ["title"], using: "gin" }]);
});

test("composite foreign keys and ALTER TABLE", () => {
  const r = parseDDL(`
    CREATE SCHEMA stock;
    CREATE TABLE stock.levels (site int, sku text, qty int NOT NULL DEFAULT 0, PRIMARY KEY (site, sku));
    CREATE TABLE stock.moves (id serial PRIMARY KEY, site int NOT NULL, sku text NOT NULL);
    ALTER TABLE ONLY stock.moves ADD CONSTRAINT moves_level_fkey FOREIGN KEY (site, sku) REFERENCES stock.levels (site, sku);
    COMMENT ON TABLE stock.levels IS 'Stock per site';
    COMMENT ON COLUMN stock.moves.sku IS 'It''s the SKU';
  `);
  assert.deepEqual(r.errors, []);
  assert.deepEqual(r.model.relations[0].from.columns, ["site", "sku"]);
  assert.deepEqual(r.model.relations[0].to.columns, ["site", "sku"]);
  assert.equal(r.model.tables[0].comment, "Stock per site");
  assert.equal(r.model.tables[1].columns[2].comment, "It's the SKU");
  assert.deepEqual(r.model.schemas.map((s) => s.name), ["stock"]);
});

test("other statements are skipped with a note", () => {
  const r = parseDDL(`
    CREATE EXTENSION IF NOT EXISTS citext;
    SET search_path = public;
    CREATE TYPE mood AS ENUM ('sad', 'ok');
    CREATE TABLE t (id int PRIMARY KEY);
    CREATE OR REPLACE FUNCTION f() RETURNS int AS $$ SELECT 1; $$ LANGUAGE sql;
  `);
  assert.deepEqual(r.errors, []);
  assert.equal(r.model.tables.length, 1);
  assert.deepEqual(
    r.notes.map((n) => n.line),
    [2, 3, 4, 6],
  );
});

test("mistakes come back with their lines", () => {
  const r = parseDDL(`CREATE TABLE a (
  id int PRIMARY KEY,
  name
);
CREATE TABLE b (
  id int PRIMARY KEY,
  a_id int REFERENCES nowhere (id),
  c_id int REFERENCES a (id),
  e_id int REFERENCES e (missing)
);
CREATE TABLE e (id int PRIMARY KEY);
CREATE TABLE c (id int PRIMARY KEY, id text);
CREATE TABLE d (id int PRIMARY KEY, note text DEFAULT 'oops);
`);
  assert.deepEqual(
    r.errors.map((e) => e.line),
    [3, 7, 8, 9, 12, 13],
  );
  assert.match(r.errors[0].message, /“name” needs a type/);
  assert.match(r.errors[1].message, /references nowhere, which isn't in the script/);
  assert.match(r.errors[2].message, /references a, which couldn't be read \(line 1\)/);
  assert.match(r.errors[3].message, /e has no column “missing”/);
  assert.match(r.errors[4].message, /two columns called “id”/);
  assert.match(r.errors[5].message, /never closed/);
});

test("an empty script says so", () => {
  assert.match(parseDDL("-- nothing here\n").errors[0].message, /no CREATE TABLE/);
  assert.match(parseDDL("CREATE TABLE x (").errors[0].message, /Expected a column name/);
});

test("names are quoted only when they must be", () => {
  assert.equal(quoteIdent("orders"), "orders");
  assert.equal(quoteIdent("user"), '"user"');
  assert.equal(quoteIdent("Display Name"), '"Display Name"');
  assert.equal(quoteIdent('a"b'), '"a""b"');
});
