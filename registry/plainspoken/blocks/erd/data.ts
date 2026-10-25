// The demo database: harbour_goods, an invented online shop for kitchen and household goods.
// 28 tables in four schemas (accounts, the catalogue, sales and fulfilment), with the foreign keys,
// unique columns, defaults, indexes and comments a real one would have.

import type { ErdColumn, ErdIndex, ErdModel, ErdRelation, ErdTable, RefAction } from "@/registry/plainspoken/blocks/erd/model";

const col = (name: string, type: string, more: Partial<ErdColumn> = {}): ErdColumn => ({ name, type, notNull: true, ...more });
const opt = (name: string, type: string, more: Partial<ErdColumn> = {}): ErdColumn => ({ name, type, notNull: false, ...more });
const uuidKey = (name = "id"): ErdColumn => ({ name, type: "uuid", pk: true, notNull: true, default: "gen_random_uuid()" });
const serialKey = (type = "integer"): ErdColumn => ({ name: "id", type, pk: true, notNull: true, identity: true });
const createdAt = () => col("created_at", "timestamptz", { default: "now()" });

function idx(table: string, columns: string[], more: Partial<ErdIndex> = {}): ErdIndex {
  return { name: `${table}_${columns.join("_")}_${more.unique ? "key" : "idx"}`, columns, ...more };
}

function table(schema: string, name: string, columns: ErdColumn[], more: { comment?: string; indexes?: (t: string) => ErdIndex[] } = {}): ErdTable {
  return { id: `${schema}.${name}`, schema, name, comment: more.comment, columns, indexes: more.indexes?.(name) ?? [] };
}

/** "sales.orders.customer_id" or "fulfilment.inventory.(warehouse_id,variant_id)" */
function end(path: string) {
  const m = path.match(/^(\w+\.\w+)\.(?:\((.+)\)|(\w+))$/)!;
  return { table: m[1], columns: (m[2] ?? m[3]).split(",") };
}

function fk(from: string, to: string, onDelete: RefAction = "NO ACTION", onUpdate: RefAction = "NO ACTION"): ErdRelation {
  const f = end(from);
  const name = `${f.table.split(".")[1]}_${f.columns.join("_")}_fkey`;
  return { id: name, name, from: f, to: end(to), onDelete, onUpdate };
}

const AUTH: ErdTable[] = [
  table(
    "auth",
    "users",
    [
      uuidKey(),
      col("email", "citext", { unique: true, comment: "The login name; compared without regard to case" }),
      opt("password_hash", "text", { comment: "argon2id; null for accounts that sign in with a provider" }),
      col("display_name", "text"),
      opt("email_verified_at", "timestamptz"),
      col("mfa_enabled", "boolean", { default: "false" }),
      createdAt(),
      opt("last_login_at", "timestamptz"),
      opt("disabled_at", "timestamptz", { comment: "Set by support to lock an account without deleting it" }),
    ],
    { comment: "Everyone who can sign in: customers with an account, and staff", indexes: (t) => [idx(t, ["created_at"])] },
  ),
  table(
    "auth",
    "sessions",
    [uuidKey(), col("user_id", "uuid"), createdAt(), col("expires_at", "timestamptz"), opt("ip", "inet"), opt("user_agent", "text")],
    { comment: "Signed-in browsers and apps; a nightly job deletes expired rows", indexes: (t) => [idx(t, ["user_id"]), idx(t, ["expires_at"])] },
  ),
  table("auth", "roles", [serialKey("smallint"), col("name", "text", { unique: true }), opt("description", "text")], {
    comment: "admin, support, warehouse and marketing",
  }),
  table("auth", "user_roles", [
    col("user_id", "uuid", { pk: true }),
    col("role_id", "smallint", { pk: true }),
    col("granted_at", "timestamptz", { default: "now()" }),
    opt("granted_by", "uuid", { comment: "Null when granted by a migration" }),
  ]),
  table(
    "auth",
    "audit_events",
    [
      serialKey("bigint"),
      opt("actor_id", "uuid", { comment: "Null for jobs and webhooks" }),
      col("action", "text", { comment: "Verb and noun: order.refund, product.update" }),
      col("entity", "text"),
      col("entity_id", "text"),
      opt("ip", "inet"),
      col("data", "jsonb", { default: "'{}'::jsonb" }),
      createdAt(),
    ],
    {
      comment: "Append-only record of what staff and systems changed",
      indexes: (t) => [idx(t, ["entity", "entity_id"]), idx(t, ["created_at"]), idx(t, ["data"], { using: "gin" })],
    },
  ),
];

const CATALOG: ErdTable[] = [
  table(
    "catalog",
    "categories",
    [serialKey(), opt("parent_id", "integer", { comment: "Null at the top of the tree" }), col("name", "text"), col("slug", "text", { unique: true }), col("position", "smallint", { default: "0" })],
    { comment: "A tree of categories: Kitchen › Knives › Bread knives", indexes: (t) => [idx(t, ["parent_id", "position"])] },
  ),
  table("catalog", "brands", [serialKey(), col("name", "text", { unique: true }), col("slug", "text", { unique: true }), opt("country", "char(2)")]),
  table(
    "catalog",
    "products",
    [
      uuidKey(),
      opt("brand_id", "integer"),
      col("category_id", "integer"),
      col("name", "text"),
      col("slug", "text", { unique: true }),
      opt("description", "text", { comment: "Markdown" }),
      col("status", "text", { default: "'draft'", comment: "draft, active or archived" }),
      createdAt(),
      col("updated_at", "timestamptz", { default: "now()" }),
    ],
    { comment: "What the shop sells; prices and stock are per variant", indexes: (t) => [idx(t, ["category_id"]), idx(t, ["brand_id"]), idx(t, ["status"])] },
  ),
  table(
    "catalog",
    "product_variants",
    [
      uuidKey(),
      col("product_id", "uuid"),
      col("sku", "text", { unique: true, comment: "Stock keeping unit, printed on the shelf label" }),
      col("name", "text", { comment: "Size and colour: “28 cm, slate”" }),
      col("price", "numeric(10,2)"),
      opt("compare_at_price", "numeric(10,2)", { comment: "The old price, shown struck through" }),
      col("weight_grams", "integer"),
      opt("barcode", "text", { unique: true }),
    ],
    { comment: "One sellable item: a size or colour of a product", indexes: (t) => [idx(t, ["product_id"])] },
  ),
  table("catalog", "product_images", [uuidKey(), col("product_id", "uuid"), col("url", "text"), col("alt_text", "text"), col("position", "smallint", { default: "0" })], {
    indexes: (t) => [idx(t, ["product_id", "position"])],
  }),
  table("catalog", "tags", [serialKey(), col("name", "text", { unique: true })]),
  table("catalog", "product_tags", [col("product_id", "uuid", { pk: true }), col("tag_id", "integer", { pk: true })], {
    indexes: (t) => [idx(t, ["tag_id"])],
  }),
];

const SALES: ErdTable[] = [
  table(
    "sales",
    "customers",
    [
      uuidKey(),
      opt("user_id", "uuid", { unique: true, comment: "Null for guest checkouts" }),
      col("email", "citext"),
      col("first_name", "text"),
      col("last_name", "text"),
      opt("phone", "text"),
      col("marketing_opt_in", "boolean", { default: "false" }),
      createdAt(),
    ],
    { comment: "People who have ordered, with or without an account", indexes: (t) => [idx(t, ["email"])] },
  ),
  table(
    "sales",
    "addresses",
    [uuidKey(), col("customer_id", "uuid"), col("line1", "text"), opt("line2", "text"), col("city", "text"), col("postcode", "text"), col("country", "char(2)"), col("is_default", "boolean", { default: "false" })],
    { indexes: (t) => [idx(t, ["customer_id"])] },
  ),
  table("sales", "carts", [uuidKey(), opt("customer_id", "uuid"), createdAt(), col("updated_at", "timestamptz", { default: "now()" }), col("expires_at", "timestamptz")], {
    comment: "Shopping carts, guests' too; swept a week after the last change",
    indexes: (t) => [idx(t, ["customer_id"]), idx(t, ["expires_at"])],
  }),
  table("sales", "cart_items", [col("cart_id", "uuid", { pk: true }), col("variant_id", "uuid", { pk: true }), col("quantity", "integer", { default: "1" }), col("added_at", "timestamptz", { default: "now()" })]),
  table("sales", "discounts", [
    serialKey(),
    col("code", "text", { unique: true, comment: "What the customer types at checkout" }),
    col("kind", "text", { comment: "percent or amount" }),
    col("value", "numeric(10,2)"),
    col("starts_at", "timestamptz"),
    opt("ends_at", "timestamptz"),
    opt("usage_limit", "integer"),
  ]),
  table(
    "sales",
    "orders",
    [
      uuidKey(),
      col("number", "text", { unique: true, comment: "What the customer sees: HG-104233" }),
      col("customer_id", "uuid"),
      col("billing_address_id", "uuid"),
      opt("shipping_address_id", "uuid", { comment: "Null for collection in store" }),
      opt("discount_id", "integer"),
      col("status", "text", { default: "'pending'", comment: "pending, paid, packed, shipped, delivered or cancelled" }),
      col("currency", "char(3)", { default: "'EUR'" }),
      col("subtotal", "numeric(12,2)"),
      col("tax_total", "numeric(12,2)"),
      col("shipping_total", "numeric(12,2)", { default: "0" }),
      col("grand_total", "numeric(12,2)"),
      col("placed_at", "timestamptz", { default: "now()" }),
    ],
    { comment: "One checkout; amounts are copied in so later price changes don't touch it", indexes: (t) => [idx(t, ["customer_id"]), idx(t, ["status", "placed_at"])] },
  ),
  table(
    "sales",
    "order_items",
    [
      uuidKey(),
      col("order_id", "uuid"),
      col("variant_id", "uuid"),
      col("quantity", "integer"),
      col("unit_price", "numeric(10,2)", { comment: "The price when ordered" }),
      col("tax_rate", "numeric(5,4)"),
    ],
    { indexes: (t) => [idx(t, ["order_id"]), idx(t, ["variant_id"])] },
  ),
  table(
    "sales",
    "payments",
    [
      uuidKey(),
      col("order_id", "uuid"),
      col("provider", "text", { comment: "card, paypal or klarna" }),
      col("provider_ref", "text", { unique: true, comment: "The payment provider's own id" }),
      col("amount", "numeric(12,2)"),
      col("currency", "char(3)"),
      col("status", "text", { default: "'pending'" }),
      opt("captured_at", "timestamptz"),
      createdAt(),
    ],
    { indexes: (t) => [idx(t, ["order_id"])] },
  ),
  table("sales", "refunds", [uuidKey(), col("payment_id", "uuid"), col("amount", "numeric(12,2)"), opt("reason", "text"), opt("created_by", "uuid"), createdAt()], {
    indexes: (t) => [idx(t, ["payment_id"])],
  }),
  table(
    "sales",
    "order_events",
    [
      serialKey("bigint"),
      col("order_id", "uuid"),
      col("kind", "text", { comment: "status_changed, note_added or email_sent" }),
      col("data", "jsonb", { default: "'{}'::jsonb" }),
      opt("actor_id", "uuid", { comment: "Null when the system did it" }),
      createdAt(),
    ],
    { comment: "An order's history, as the back office shows it", indexes: (t) => [idx(t, ["order_id", "created_at"])] },
  ),
];

const FULFILMENT: ErdTable[] = [
  table("fulfilment", "warehouses", [
    serialKey("smallint"),
    col("code", "text", { unique: true, comment: "The short code on labels: RTM1" }),
    col("name", "text"),
    col("country", "char(2)"),
    col("timezone", "text", { default: "'Europe/Amsterdam'" }),
  ]),
  table(
    "fulfilment",
    "inventory",
    [
      col("warehouse_id", "smallint", { pk: true }),
      col("variant_id", "uuid", { pk: true }),
      col("on_hand", "integer", { default: "0" }),
      col("reserved", "integer", { default: "0", comment: "Held for paid orders that aren't packed yet" }),
      opt("reorder_level", "integer"),
      col("updated_at", "timestamptz", { default: "now()" }),
    ],
    { comment: "Stock of each variant in each warehouse", indexes: (t) => [idx(t, ["variant_id"])] },
  ),
  table(
    "fulfilment",
    "stock_movements",
    [
      serialKey("bigint"),
      col("warehouse_id", "smallint"),
      col("variant_id", "uuid"),
      col("quantity", "integer", { comment: "Positive in, negative out" }),
      col("reason", "text", { comment: "received, sold, returned, counted or damaged" }),
      opt("reference", "text", { comment: "A delivery note or an order number" }),
      opt("created_by", "uuid"),
      createdAt(),
    ],
    { comment: "Every change to stock; inventory is their running total", indexes: (t) => [idx(t, ["warehouse_id", "variant_id", "created_at"])] },
  ),
  table(
    "fulfilment",
    "shipments",
    [
      uuidKey(),
      col("order_id", "uuid"),
      col("warehouse_id", "smallint"),
      col("carrier", "text"),
      opt("tracking_number", "text", { unique: true }),
      col("status", "text", { default: "'preparing'" }),
      opt("shipped_at", "timestamptz"),
      opt("delivered_at", "timestamptz"),
    ],
    { comment: "A parcel; a big order can go out in several", indexes: (t) => [idx(t, ["order_id"]), idx(t, ["status"])] },
  ),
  table("fulfilment", "shipment_items", [col("shipment_id", "uuid", { pk: true }), col("order_item_id", "uuid", { pk: true }), col("quantity", "integer")]),
  table(
    "fulfilment",
    "returns",
    [
      uuidKey(),
      col("order_id", "uuid"),
      opt("shipment_id", "uuid"),
      opt("refund_id", "uuid", { unique: true, comment: "Set once the money has gone back" }),
      col("status", "text", { default: "'requested'" }),
      col("reason", "text"),
      opt("received_at", "timestamptz"),
      createdAt(),
    ],
    { indexes: (t) => [idx(t, ["order_id"])] },
  ),
];

const RELATIONS: ErdRelation[] = [
  fk("auth.sessions.user_id", "auth.users.id", "CASCADE"),
  fk("auth.user_roles.user_id", "auth.users.id", "CASCADE"),
  fk("auth.user_roles.role_id", "auth.roles.id", "CASCADE"),
  fk("auth.user_roles.granted_by", "auth.users.id", "SET NULL"),
  fk("auth.audit_events.actor_id", "auth.users.id", "SET NULL"),

  fk("catalog.categories.parent_id", "catalog.categories.id", "SET NULL"),
  fk("catalog.products.brand_id", "catalog.brands.id", "SET NULL"),
  fk("catalog.products.category_id", "catalog.categories.id", "RESTRICT"),
  fk("catalog.product_variants.product_id", "catalog.products.id", "CASCADE"),
  fk("catalog.product_images.product_id", "catalog.products.id", "CASCADE"),
  fk("catalog.product_tags.product_id", "catalog.products.id", "CASCADE"),
  fk("catalog.product_tags.tag_id", "catalog.tags.id", "CASCADE"),

  fk("sales.customers.user_id", "auth.users.id", "SET NULL"),
  fk("sales.addresses.customer_id", "sales.customers.id", "CASCADE"),
  fk("sales.carts.customer_id", "sales.customers.id", "CASCADE"),
  fk("sales.cart_items.cart_id", "sales.carts.id", "CASCADE"),
  fk("sales.cart_items.variant_id", "catalog.product_variants.id", "CASCADE"),
  fk("sales.orders.customer_id", "sales.customers.id", "RESTRICT"),
  fk("sales.orders.billing_address_id", "sales.addresses.id", "RESTRICT"),
  fk("sales.orders.shipping_address_id", "sales.addresses.id", "RESTRICT"),
  fk("sales.orders.discount_id", "sales.discounts.id", "SET NULL"),
  fk("sales.order_items.order_id", "sales.orders.id", "CASCADE"),
  fk("sales.order_items.variant_id", "catalog.product_variants.id", "RESTRICT"),
  fk("sales.payments.order_id", "sales.orders.id", "RESTRICT"),
  fk("sales.refunds.payment_id", "sales.payments.id", "RESTRICT"),
  fk("sales.refunds.created_by", "auth.users.id", "SET NULL"),
  fk("sales.order_events.order_id", "sales.orders.id", "CASCADE"),
  fk("sales.order_events.actor_id", "auth.users.id", "SET NULL"),

  fk("fulfilment.inventory.warehouse_id", "fulfilment.warehouses.id", "CASCADE"),
  fk("fulfilment.inventory.variant_id", "catalog.product_variants.id", "CASCADE"),
  fk("fulfilment.stock_movements.(warehouse_id,variant_id)", "fulfilment.inventory.(warehouse_id,variant_id)", "RESTRICT"),
  fk("fulfilment.stock_movements.created_by", "auth.users.id", "SET NULL"),
  fk("fulfilment.shipments.order_id", "sales.orders.id", "RESTRICT"),
  fk("fulfilment.shipments.warehouse_id", "fulfilment.warehouses.id", "RESTRICT"),
  fk("fulfilment.shipment_items.shipment_id", "fulfilment.shipments.id", "CASCADE"),
  fk("fulfilment.shipment_items.order_item_id", "sales.order_items.id", "RESTRICT"),
  fk("fulfilment.returns.order_id", "sales.orders.id", "RESTRICT"),
  fk("fulfilment.returns.shipment_id", "fulfilment.shipments.id", "SET NULL"),
  fk("fulfilment.returns.refund_id", "sales.refunds.id", "SET NULL"),
];

/** harbour_goods: the demo shop's database */
export const SHOP_MODEL: ErdModel = {
  name: "harbour_goods",
  schemas: [
    { name: "auth", color: "var(--chart-4)", comment: "Accounts, sessions and permissions" },
    { name: "catalog", color: "var(--chart-1)", comment: "What the shop sells" },
    { name: "sales", color: "var(--chart-2)", comment: "Customers, carts, orders and money" },
    { name: "fulfilment", color: "var(--chart-3)", comment: "Stock, warehouses and parcels" },
  ],
  tables: [...AUTH, ...CATALOG, ...SALES, ...FULFILMENT],
  relations: RELATIONS,
};

/** A small corner of it, for examples: customers, orders and what's in them */
export const ORDERS_MODEL: ErdModel = (() => {
  const keep = ["sales.customers", "sales.addresses", "sales.orders", "sales.order_items", "sales.payments", "catalog.product_variants"];
  return {
    name: "harbour_goods",
    schemas: SHOP_MODEL.schemas.filter((s) => s.name === "sales" || s.name === "catalog"),
    tables: SHOP_MODEL.tables.filter((t) => keep.includes(t.id)),
    relations: RELATIONS.filter((r) => keep.includes(r.from.table) && keep.includes(r.to.table)),
  };
})();
