// The demo's data: three thousand orders from Brindle & Moss, a made-up online shop for home and
// outdoor goods, between 1 April and 24 October 2026. Everything is invented and comes from a
// seeded generator, so every render (server or browser) gets the same rows.
//
// Times are wall-clock times built with the local-time Date constructor, so "09:41 on 24 October"
// prints as 09:41 on 24 October wherever it runs, and the table's date filters and Excel export,
// which work in local time, agree with what is shown. Hours stay between 07:00 and 22:00, clear of
// the night-time hours when clocks change.

export type OrderStatus = "Pending" | "Paid" | "Packed" | "Shipped" | "Delivered" | "Returned" | "Cancelled";
export type Channel = "Web shop" | "App" | "Marketplace" | "Phone";
export type Payment = "Card" | "PayPal" | "Invoice" | "Gift card";
export type Carrier = "Parcelwise" | "Northpost" | "Swift Courier";

export const STATUSES: OrderStatus[] = ["Pending", "Paid", "Packed", "Shipped", "Delivered", "Returned", "Cancelled"];
export const CHANNELS: Channel[] = ["Web shop", "App", "Marketplace", "Phone"];
export const PAYMENTS: Payment[] = ["Card", "PayPal", "Invoice", "Gift card"];
export const CARRIERS: Carrier[] = ["Parcelwise", "Northpost", "Swift Courier"];

export interface Product {
  sku: string;
  name: string;
  /** Euros, VAT included */
  price: number;
}

export interface OrderLine extends Product {
  qty: number;
}

export interface Order {
  /** "BM-10421" */
  id: string;
  /** When it was placed, epoch ms */
  placed: number;
  customer: string;
  email: string;
  city: string;
  country: string;
  /** Street address, for the detail drawer */
  street: string;
  postcode: string;
  channel: Channel;
  lines: OrderLine[];
  /** Pieces in all */
  items: number;
  subtotal: number;
  /** Taken off by the coupon (0 without one) */
  discount: number;
  coupon: string | null;
  shipping: number;
  total: number;
  payment: Payment;
  status: OrderStatus;
  carrier: Carrier | null;
  /** The day delivery was promised for, local midnight */
  promised: number;
  shipped: number | null;
  delivered: number | null;
  /** Days later than promised: delivered late, or still on its way after the promised day. 0 on time; null when it never shipped. */
  late: number | null;
  tracking: string | null;
  /** Stars the customer gave, 1–5, if they did */
  rating: number | null;
  /** From the customer, at checkout */
  note: string | null;
}

/** The demo's "now": Saturday 24 October 2026, 16:30, local time */
export const GRID_NOW = new Date(2026, 9, 24, 16, 30).getTime();

export const SHOP = { name: "Brindle & Moss", tagline: "Home and outdoor goods" };

const PRODUCTS: Product[] = [
  ["Enamel camp mug", 14],
  ["Linen tea towels, set of 2", 18.5],
  ["Wool throw, oatmeal", 89],
  ["Cast-iron skillet, 26 cm", 54],
  ["Beeswax candle, tall", 12],
  ["Ceramic planter, small", 22],
  ["Ceramic planter, large", 39],
  ["Oak serving board", 46],
  ["Waxed canvas tote", 64],
  ["Field notebooks, 3-pack", 15],
  ["Pocket knife, ash handle", 72],
  ["Insulated bottle, 750 ml", 29],
  ["Down pillow", 95],
  ["Stoneware bowls, set of 4", 58],
  ["Garden gloves", 16],
  ["Rain jacket", 149],
  ["Merino hiking socks", 19],
  ["Picnic blanket", 69],
  ["Cedar bird feeder", 34],
  ["Hand cream, 75 ml", 11.5],
  ["Pour-over coffee set", 48],
  ["Glass storage jars, 3", 27],
  ["Brass desk lamp", 129],
  ["Cotton hammock", 85],
  ["Rechargeable lantern", 44],
  ["Seed starter kit", 24],
  ["Wool slippers", 59],
  ["Folding camp stool", 38],
  ["Copper watering can", 76],
  ["Down sleeping bag", 239],
].map(([name, price], i) => ({ sku: `BM-${String(2101 + i * 7)}`, name: name as string, price: price as number }));

const FIRST = [
  "Hanna", "Jonas", "Amara", "Kenji", "Léa", "Mateo", "Ines", "Tomasz", "Freya", "Oskar", "Noor", "Elif", "Pieter", "Aoife",
  "Lukas", "Sofia", "Emil", "Clara", "Rafael", "Maja", "Teodor", "Yara", "Bruno", "Ingrid", "Mila", "Anton", "Saoirse", "Nils",
  "Greta", "Luca", "Vera", "Matthias", "Zofia", "Arvid", "Lotte", "Jules", "Selin", "Ruben", "Agnes", "Milan",
];
const LAST = [
  "Lindqvist", "Brandt", "Okafor", "Watanabe", "Dubois", "Ferreira", "Carvalho", "Nowak", "Halvorsen", "Bergström", "Haddad",
  "Yilmaz", "de Vries", "Byrne", "Hofmann", "Romano", "Larsen", "Meier", "Costa", "Kowalczyk", "Nyberg", "Mansour", "Moreau",
  "Aalto", "Novák", "Gruber", "Kelly", "Sandberg", "Vogel", "Ricci", "Janssen", "Mertens", "Pereira", "Eriksen", "Fischer",
];
const PLACES: [string, string, string][] = [
  // city, country, postcode pattern (# is a digit)
  ["Berlin", "Germany", "10###"],
  ["Hamburg", "Germany", "20###"],
  ["Munich", "Germany", "80###"],
  ["Leipzig", "Germany", "04###"],
  ["Amsterdam", "Netherlands", "10## AB"],
  ["Utrecht", "Netherlands", "35## CD"],
  ["Lyon", "France", "6900#"],
  ["Paris", "France", "750##"],
  ["Malmö", "Sweden", "21# ##"],
  ["Uppsala", "Sweden", "75# ##"],
  ["Aarhus", "Denmark", "8000"],
  ["Copenhagen", "Denmark", "1###"],
  ["Vienna", "Austria", "1###"],
  ["Graz", "Austria", "80##"],
  ["Ghent", "Belgium", "9000"],
  ["Turin", "Italy", "101##"],
  ["Valencia", "Spain", "460##"],
  ["Cork", "Ireland", "T12 ###"],
  ["Tampere", "Finland", "33###"],
  ["Kraków", "Poland", "30-###"],
];
const STREETS = ["Lindenweg", "Harbour Row", "Mill Lane", "Kastanjelaan", "Rue des Tilleuls", "Birkenstraße", "Station Road", "Via dei Pini", "Ågatan", "Elm Court", "Brouwersgracht", "Calle del Olmo"];
const NOTES = [
  "Please leave it with the neighbours at number 12.",
  "It's a present: no prices in the parcel, please.",
  "Ring twice, the bell is quiet.",
  "Can it come before Friday? We leave on holiday.",
  "Leave it in the shed by the gate.",
  "Gift wrap if you can!",
];
const COUPONS: [string, number][] = [
  ["WELCOME10", 0.1],
  ["AUTUMN15", 0.15],
  ["FRIENDS20", 0.2],
];

/** A seeded random number generator (mulberry32): the same numbers on every run */
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), s | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const DAY = 86_400_000;
const round2 = (n: number) => Math.round(n * 100) / 100;
/** Local midnight of the day `t` falls on */
const midnight = (t: number) => {
  const d = new Date(t);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
};
/** Whole days from one day to another, counting calendar days (so a clock change doesn't matter) */
export const daysBetween = (from: number, to: number) => Math.round((midnight(to) - midnight(from)) / DAY);
/** A local wall-clock time `days` calendar days after `t`'s day, at hour:minute */
const at = (t: number, days: number, hour: number, minute: number) => {
  const d = new Date(t);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + days, hour, minute).getTime();
};

function makeOrders(count: number): Order[] {
  const r = rng(20261024);
  const pick = <V>(list: readonly V[]) => list[Math.floor(r() * list.length)];
  const digits = (pattern: string) => pattern.replace(/#/g, () => String(Math.floor(r() * 10)));

  // 600 customers, every name different; some order often
  const customers = Array.from({ length: 600 }, (_, i) => {
    const first = FIRST[i % FIRST.length];
    const last = LAST[(i * 7 + Math.floor(i / FIRST.length)) % LAST.length];
    const [city, country, postcode] = pick(PLACES);
    const mail = `${first}.${last}`
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/ø/g, "o")
      .replace(/ß/g, "ss")
      .replace(/\s+/g, "")
      .toLowerCase();
    return {
      name: `${first} ${last}`,
      email: `${mail}@example.${pick(["com", "net", "org"])}`,
      city,
      country,
      street: `${pick(STREETS)} ${1 + Math.floor(r() * 120)}`,
      postcode: digits(postcode),
      weight: r() < 0.15 ? 6 : 1,
    };
  });
  const pool = customers.flatMap((c) => Array<typeof c>(c.weight).fill(c));

  // Order times: spread over the days, busier in the evening and growing towards autumn
  const start = new Date(2026, 3, 1).getTime();
  const span = daysBetween(start, GRID_NOW);
  const times: number[] = [];
  while (times.length < count) {
    const d = Math.floor(Math.sqrt(r()) * (span + 1));
    const hour = 7 + Math.floor((r() + r() + r()) * 5);
    const t = at(start, d, Math.min(hour, 21), Math.floor(r() * 60));
    if (t <= GRID_NOW) times.push(t);
  }
  times.sort((a, b) => a - b);

  return times.map((placed, i) => {
    const c = pick(pool);
    const lineCount = r() < 0.55 ? 1 : r() < 0.7 ? 2 : r() < 0.8 ? 3 : 4;
    const lines: OrderLine[] = [];
    for (let k = 0; k < lineCount; k++) {
      const p = pick(PRODUCTS);
      const qty = r() < 0.8 ? 1 : r() < 0.7 ? 2 : 3 + Math.floor(r() * 4);
      const same = lines.find((l) => l.sku === p.sku);
      if (same) same.qty += qty;
      else lines.push({ ...p, qty });
    }
    const items = lines.reduce((s, l) => s + l.qty, 0);
    const subtotal = round2(lines.reduce((s, l) => s + l.qty * l.price, 0));
    const coupon = r() < 0.14 ? pick(COUPONS) : null;
    const discount = coupon ? round2(subtotal * coupon[1]) : 0;
    const shipping = subtotal - discount >= 75 ? 0 : c.country === "Germany" ? 4.95 : 6.95;
    const total = round2(subtotal - discount + shipping);
    const channel: Channel = r() < 0.58 ? "Web shop" : r() < 0.6 ? "App" : r() < 0.8 ? "Marketplace" : "Phone";
    const payment: Payment = channel === "Phone" ? "Invoice" : r() < 0.62 ? "Card" : r() < 0.75 ? "PayPal" : r() < 0.85 ? "Invoice" : "Gift card";
    const carrier: Carrier = c.country === "Germany" || c.country === "Austria" ? (r() < 0.7 ? "Parcelwise" : "Swift Courier") : r() < 0.65 ? "Northpost" : pick(CARRIERS);
    const transit = carrier === "Swift Courier" ? 1 : carrier === "Parcelwise" ? 2 : 3;
    const promised = at(placed, transit + 2, 0, 0);
    const age = (GRID_NOW - placed) / DAY;

    // Where the order has got to by now
    let status: OrderStatus;
    let shipped: number | null = null;
    let delivered: number | null = null;
    const cancelled = r() < 0.03;
    const shipAfter = r() < 0.75 ? 1 : r() < 0.8 ? 2 : 4; // days to pack and hand over
    const slow = r();
    const onTheWay = transit + (slow < 0.9 ? 0 : slow < 0.96 ? 1 + Math.floor(r() * 2) : 3 + Math.floor(r() * 6)); // days in transit
    if (cancelled && age > 0.3) status = "Cancelled";
    else if (age < 0.25) status = payment === "Invoice" ? "Paid" : r() < 0.4 ? "Pending" : "Paid";
    else if (age < shipAfter) status = r() < 0.5 ? "Paid" : "Packed";
    else {
      shipped = at(placed, shipAfter, 9 + Math.floor(r() * 8), Math.floor(r() * 60));
      const arrives = at(shipped, onTheWay, 9 + Math.floor(r() * 10), Math.floor(r() * 60));
      if (arrives > GRID_NOW) status = "Shipped";
      else {
        delivered = arrives;
        status = age > 14 && r() < 0.045 ? "Returned" : "Delivered";
      }
    }
    const late = shipped == null ? null : Math.max(0, daysBetween(promised, delivered ?? GRID_NOW));
    const n = 10400 + i;
    return {
      id: `BM-${n}`,
      placed,
      customer: c.name,
      email: c.email,
      city: c.city,
      country: c.country,
      street: c.street,
      postcode: c.postcode,
      channel,
      lines,
      items,
      subtotal,
      discount,
      coupon: coupon?.[0] ?? null,
      shipping,
      total,
      payment,
      status,
      carrier: shipped == null && status !== "Packed" ? null : carrier,
      promised,
      shipped,
      delivered,
      late,
      tracking: shipped == null ? null : `${carrier === "Northpost" ? "NP" : carrier === "Parcelwise" ? "PW" : "SC"}${String(n * 7919).padStart(10, "0")}`,
      rating: status === "Delivered" && r() < 0.35 ? Math.max(1, Math.min(5, Math.round(3.4 + r() * 2.4 - (late ? 1.2 : 0)))) : null,
      note: r() < 0.05 ? pick(NOTES) : null,
    };
  });
}

/** Every order, oldest first */
export const ORDERS: Order[] = makeOrders(3000);

/** The carrier's tracking page (an invented site) */
export function trackingUrl(o: Pick<Order, "carrier" | "tracking">): string | null {
  if (!o.tracking || !o.carrier) return null;
  const host = { Parcelwise: "parcelwise", Northpost: "northpost", "Swift Courier": "swiftcourier" }[o.carrier];
  return `https://track.${host}.example/${o.tracking}`;
}
