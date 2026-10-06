/**
 * Mock API layer.
 *
 * Everything the UI calls is async and resolves after a short delay, so
 * loading and error states are real code paths rather than decoration. Reads
 * come from the static catalog; writes persist to localStorage so cart,
 * wishlist, orders and reviews survive a reload.
 */

import type {
  Address,
  Category,
  Order,
  OrderStatus,
  Page,
  Product,
  ProductQuery,
  Review,
  SortKey,
} from "../types";
import {
  CATEGORIES,
  LOW_STOCK,
  PRODUCTS,
  getProductBySlug,
  priceFor,
  stockFor,
  totalStock,
} from "./catalog";
import { SEED_REVIEWS } from "./reviews";
import { DEMO_USERS, SEED_ORDERS, shippingFor, taxFor } from "./seed";
import { NS, clearAll, read, write } from "../lib/storage";
import { lineId } from "../lib/format";

/** Latency injected into every call, in ms. */
const LATENCY = 260;

function delay<T>(value: T, ms = LATENCY): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

// ── Catalog ────────────────────────────────────────────────────────────────

export function fetchCategories() {
  return delay(CATEGORIES);
}

export function fetchBrands(): Promise<string[]> {
  return delay([...new Set(PRODUCTS.map((p) => p.brand))].sort());
}

/**
 * Admin edits are stored as sparse overrides layered over the static catalog,
 * so the base data module stays immutable and a reset is a single clear().
 */
type ProductOverride = Partial<
  Pick<Product, "price" | "compareAt" | "stock" | "name" | "description" | "badges">
> & { variants?: Record<string, number> };

function readOverrides(): Record<string, ProductOverride> {
  return read<Record<string, ProductOverride>>(NS.products, {});
}

function applyOverrides(product: Product, overrides: Record<string, ProductOverride>): Product {
  const o = overrides[product.id];
  if (!o) return product;
  return {
    ...product,
    ...o,
    variants: o.variants
      ? product.variants.map((v) => ({ ...v, stock: o.variants?.[v.value] ?? v.stock }))
      : product.variants,
  };
}

/** Every product, with any admin overrides applied. */
export function allProducts(): Product[] {
  const overrides = readOverrides();
  return PRODUCTS.map((p) => applyOverrides(p, overrides));
}

function matchesSearch(product: Product, needle: string): boolean {
  const haystack = [
    product.name,
    product.brand,
    product.category,
    product.tagline,
    product.description,
  ]
    .join(" ")
    .toLowerCase();
  return needle
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((term) => haystack.includes(term));
}

const SORTERS: Record<SortKey, (a: Product, b: Product) => number> = {
  featured: (a, b) =>
    Number(b.featured) - Number(a.featured) || b.rating - a.rating,
  "price-asc": (a, b) => a.price - b.price,
  "price-desc": (a, b) => b.price - a.price,
  rating: (a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount,
  newest: (a, b) => new Date(b.releasedAt).getTime() - new Date(a.releasedAt).getTime(),
  name: (a, b) => a.name.localeCompare(b.name),
};

export async function listProducts(query: ProductQuery = {}): Promise<Page<Product>> {
  const {
    search,
    categories,
    brands,
    minPrice,
    maxPrice,
    minRating,
    inStockOnly,
    onSaleOnly,
    sort = "featured",
    page = 1,
    perPage = 12,
  } = query;

  let results = allProducts();

  if (search?.trim()) results = results.filter((p) => matchesSearch(p, search.trim()));
  if (categories?.length) results = results.filter((p) => categories.includes(p.category));
  if (brands?.length) results = results.filter((p) => brands.includes(p.brand));
  if (minPrice !== undefined) results = results.filter((p) => p.price >= minPrice);
  if (maxPrice !== undefined) results = results.filter((p) => p.price <= maxPrice);
  if (minRating !== undefined) results = results.filter((p) => p.rating >= minRating);
  if (inStockOnly) results = results.filter((p) => totalStock(p) > 0);
  if (onSaleOnly) results = results.filter((p) => p.compareAt !== undefined);

  results = [...results].sort(SORTERS[sort]);

  const total = results.length;
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * perPage;

  return delay({
    items: results.slice(start, start + perPage),
    total,
    page: safePage,
    perPage,
    totalPages,
  });
}

/** Resolves to undefined for an unknown slug, which the route renders as a 404. */
export async function fetchProduct(slug: string): Promise<Product | undefined> {
  const base = getProductBySlug(slug);
  if (!base) return delay(undefined);
  return delay(applyOverrides(base, readOverrides()));
}

/** Related products: same category first, then anything sharing the brand. */
export async function fetchRelated(product: Product, limit = 4): Promise<Product[]> {
  const all = allProducts().filter((p) => p.id !== product.id);
  const sameCategory = all.filter((p) => p.category === product.category);
  const sameBrand = all.filter((p) => p.brand === product.brand && p.category !== product.category);
  const scored = [...sameCategory, ...sameBrand];
  const fill = all.filter((p) => !scored.includes(p));
  return delay([...scored, ...fill].slice(0, limit));
}

export async function fetchDeals(limit = 4): Promise<Product[]> {
  const deals = allProducts()
    .filter((p) => p.compareAt !== undefined)
    .sort((a, b) => {
      const off = (p: Product) => (p.compareAt ? (p.compareAt - p.price) / p.compareAt : 0);
      return off(b) - off(a);
    });
  return delay(deals.slice(0, limit));
}

export async function fetchNewArrivals(limit = 4): Promise<Product[]> {
  const items = allProducts()
    .filter((p) => p.isNew)
    .sort((a, b) => new Date(b.releasedAt).getTime() - new Date(a.releasedAt).getTime());
  return delay(items.slice(0, limit));
}

export async function fetchFeatured(limit = 6): Promise<Product[]> {
  return delay(allProducts().filter((p) => p.featured).slice(0, limit));
}

// ── Reviews ────────────────────────────────────────────────────────────────

function allReviews(): Review[] {
  return [...read<Review[]>(NS.reviews, []), ...SEED_REVIEWS];
}

export async function fetchReviews(productId: string): Promise<Review[]> {
  const items = allReviews()
    .filter((r) => r.productId === productId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return delay(items);
}

export interface NewReview {
  productId: string;
  author: string;
  rating: number;
  title: string;
  body: string;
}

export async function createReview(input: NewReview): Promise<Review> {
  const review: Review = {
    id: `r-${Date.now().toString(36)}`,
    productId: input.productId,
    author: input.author,
    rating: input.rating,
    title: input.title,
    body: input.body,
    createdAt: new Date().toISOString(),
    verifiedPurchase: true,
    helpfulCount: 0,
  };
  const existing = read<Review[]>(NS.reviews, []);
  write(NS.reviews, [review, ...existing]);
  return delay(review);
}

/**
 * Seed reviews live in a module constant and can't be mutated in place, so the
 * helpful marks the shopper gives them are stored separately and folded into
 * the counts at read time.
 */
function helpfulMarks(): Record<string, number> {
  return read<Record<string, number>>(NS.helpful, {});
}

/** Returns the reviews with the shopper's helpful marks applied. */
export function mergeHelpfulMarks(reviews: Review[]): Review[] {
  const marks = helpfulMarks();
  if (Object.keys(marks).length === 0) return reviews;
  return reviews.map((r) =>
    marks[r.id] ? { ...r, helpfulCount: r.helpfulCount + marks[r.id] } : r,
  );
}

export function wasMarkedHelpful(reviewId: string): boolean {
  return Boolean(helpfulMarks()[reviewId]);
}

/** Marks a review helpful. Returns false if it was already marked. */
export async function markReviewHelpful(reviewId: string): Promise<boolean> {
  const marks = helpfulMarks();
  if (marks[reviewId]) return false;
  write(NS.helpful, { ...marks, [reviewId]: 1 });
  return delay(true);
}

// ── Orders ─────────────────────────────────────────────────────────────────

function allOrders(): Order[] {
  return [...read<Order[]>(NS.orders, []), ...SEED_ORDERS];
}

export async function fetchOrders(userId?: string): Promise<Order[]> {
  const items = userId
    ? allOrders().filter((o) => o.userId === userId)
    : allOrders();
  const sorted = [...items].sort(
    (a, b) => new Date(b.placedAt).getTime() - new Date(a.placedAt).getTime(),
  );
  return delay(sorted);
}

export async function fetchOrder(id: string): Promise<Order | undefined> {
  return delay(allOrders().find((o) => o.id === id || o.number === id));
}

export interface PlaceOrderInput {
  userId: string;
  items: { productId: string; variantValue?: string; quantity: number }[];
  address: Address;
  paymentBrand: string;
  paymentLast4: string;
  billingSameAsShipping: boolean;
  /** Applied against the subtotal in cents; 0 when no promo is active. */
  discount?: number;
}

/**
 * Creates an order and decrements variant stock. Stock mutation is what makes
 * the admin inventory screen and the storefront stock badges consistent —
 * a product that sells out at checkout stays sold out after a reload.
 */
export async function placeOrder(input: PlaceOrderInput): Promise<Order> {
  const overrides = readOverrides();
  const items = input.items.map((i) => {
    const product = allProducts().find((p) => p.id === i.productId);
    if (!product) throw new Error(`Unknown product: ${i.productId}`);
    const available = stockFor(product, i.variantValue);
    if (available < i.quantity) {
      throw new Error(`${product.name} — only ${available} left in stock`);
    }
    return {
      productId: product.id,
      name: product.name,
      brand: product.brand,
      variantValue: i.variantValue,
      unitPrice: priceFor(product, i.variantValue),
      quantity: i.quantity,
    };
  });

  const subtotal = items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
  const discount = input.discount ?? 0;
  const discountedSubtotal = Math.max(0, subtotal - discount);
  const shipping = shippingFor(discountedSubtotal);
  const tax = taxFor(discountedSubtotal);
  const placedAt = new Date().toISOString();
  const seq = 2000 + read<Order[]>(NS.orders, []).length + 1;

  const order: Order = {
    id: `o-${seq}`,
    number: `VF-${seq}`,
    userId: input.userId,
    items,
    subtotal,
    shipping,
    tax,
    discount,
    total: discountedSubtotal + shipping + tax,
    status: "placed",
    placedAt,
    events: [{ status: "placed", at: placedAt, note: "Order received" }],
    shippingAddress: input.address,
    billingSameAsShipping: input.billingSameAsShipping,
    paymentBrand: input.paymentBrand,
    paymentLast4: input.paymentLast4,
  };

  for (const item of items) {
    const base = PRODUCTS.find((p) => p.id === item.productId);
    if (!base) continue;
    const current = overrides[item.productId]?.variants?.[item.variantValue ?? ""];
    const fallback = stockFor(base, item.variantValue);
    const next = (current ?? fallback) - item.quantity;
    overrides[item.productId] = {
      ...overrides[item.productId],
      variants: {
        ...overrides[item.productId]?.variants,
        [item.variantValue ?? ""]: next,
      },
    };
  }
  write(NS.products, overrides);

  const existing = read<Order[]>(NS.orders, []);
  write(NS.orders, [order, ...existing]);

  return delay(order);
}

/** Advances an order's fulfilment state. Admin-only; appends a timeline event. */
export async function updateOrderStatus(
  id: string,
  status: OrderStatus,
  note?: string,
): Promise<Order[]> {
  const userOrders = read<Order[]>(NS.orders, []);
  const target = userOrders.find((o) => o.id === id);
  if (!target) return allOrders();

  const at = new Date().toISOString();
  target.status = status;
  target.events = [
    ...target.events,
    { status, at, note: note ?? STATUS_NOTES[status] },
  ];
  write(NS.orders, userOrders);

  // A cancelled order puts its units back on the shelf.
  if (status === "cancelled") {
    const overrides = readOverrides();
    for (const item of target.items) {
      const base = PRODUCTS.find((p) => p.id === item.productId);
      if (!base) continue;
      const key = item.variantValue ?? "";
      const current = overrides[item.productId]?.variants?.[key] ?? stockFor(base, item.variantValue);
      overrides[item.productId] = {
        ...overrides[item.productId],
        variants: { ...overrides[item.productId]?.variants, [key]: current + item.quantity },
      };
    }
    write(NS.products, overrides);
  }

  return delay(allOrders());
}

const STATUS_NOTES: Record<OrderStatus, string> = {
  placed: "Awaiting payment confirmation",
  processing: "Being packed in the warehouse",
  shipped: "Handed to carrier — tracking sent",
  delivered: "Delivered to the address on file",
  cancelled: "Cancelled — refund issued to the original payment method",
};

// ── Users & addresses ──────────────────────────────────────────────────────

export function fetchDemoUsers() {
  return delay(DEMO_USERS);
}

export function readSession(): string | null {
  return read<string | null>(NS.session, null);
}

export function writeSession(userId: string | null): void {
  write(NS.session, userId);
}

export async function fetchAddresses(userId: string): Promise<Address[]> {
  return delay(readAddresses(userId));
}

export async function saveAddress(userId: string, address: Address): Promise<Address[]> {
  const all = read<Address[]>(NS.addresses, []);
  const exists = all.some((a) => a.id === address.id);
  const next = exists ? all.map((a) => (a.id === address.id ? address : a)) : [...all, address];
  write(NS.addresses, next);
  return delay(next.filter((a) => a.userId === userId));
}

export async function deleteAddress(addressId: string, userId: string): Promise<Address[]> {
  const next = read<Address[]>(NS.addresses, []).filter((a) => a.id !== addressId);
  write(NS.addresses, next);
  return delay(next.filter((a) => a.userId === userId));
}

export function readAddresses(userId: string): Address[] {
  return read<Address[]>(NS.addresses, []).filter((a) => a.userId === userId);
}

// ── Admin inventory ────────────────────────────────────────────────────────

export async function updateVariantStock(
  productId: string,
  variantValue: string,
  stock: number,
): Promise<Product[]> {
  const overrides = readOverrides();
  overrides[productId] = {
    ...overrides[productId],
    variants: { ...overrides[productId]?.variants, [variantValue]: Math.max(0, stock) },
  };
  write(NS.products, overrides);
  return delay(allProducts());
}

export async function updateProductPricing(
  productId: string,
  patch: { price?: number; compareAt?: number; stock?: number },
): Promise<Product[]> {
  const overrides = readOverrides();
  const base = PRODUCTS.find((p) => p.id === productId);
  if (!base) return allProducts();
  const clean: ProductOverride = { ...overrides[productId], ...patch };
  if (patch.compareAt !== undefined && patch.compareAt <= 0) delete clean.compareAt;
  // A top-level stock edit replaces every variant's stock with the same number.
  if (patch.stock !== undefined && base.variants.length > 0) {
    const nextVariants: Record<string, number> = {};
    for (const v of base.variants) nextVariants[v.value] = patch.stock;
    clean.variants = nextVariants;
  }
  overrides[productId] = clean;
  write(NS.products, overrides);
  return delay(allProducts());
}

export function resetDemoData(): void {
  clearAll();
}

export { LOW_STOCK, lineId };
export type { Category };