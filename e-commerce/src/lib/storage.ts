/**
 * localStorage adapter. Every namespace is prefixed so the mock data layer can
 * wipe its own state without touching anything else on the origin.
 *
 * Reads never throw: a corrupt or absent value falls back to the seed, which
 * keeps a bad localStorage from bricking the storefront.
 */

const PREFIX = "voltify";

export const NS = {
  cart: "cart",
  wishlist: "wishlist",
  recent: "recent",
  compare: "compare",
  reviews: "reviews",
  orders: "orders",
  helpful: "helpful",
  users: "users",
  session: "session",
  addresses: "addresses",
  products: "products",
} as const;

export type Namespace = (typeof NS)[keyof typeof NS];

function key(ns: Namespace): string {
  return `${PREFIX}:${ns}`;
}

export function read<T>(ns: Namespace, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key(ns));
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function write<T>(ns: Namespace, value: T): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key(ns), JSON.stringify(value));
  } catch {
    // Quota exceeded or private-mode storage disabled. The in-memory copy in
    // the reducer still holds for the session, so this is non-fatal.
  }
}

export function clear(ns: Namespace): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(key(ns));
  } catch {
    // ignore
  }
}

/** Wipes every Voltify namespace. Used by the admin "reset demo data" action. */
export function clearAll(): void {
  for (const ns of Object.values(NS)) clear(ns);
}