import type { Address, Order, OrderEvent, OrderItem, OrderStatus, User } from "../types";
import { PRODUCTS } from "./catalog";
import { lineId } from "../lib/format";

/**
 * Demo accounts. There is no real authentication — the login screen presents
 * these as a picker so every surface (customer account, admin) is reachable
 * without a sign-up flow or stored passwords.
 */

export const DEMO_USERS: User[] = [
  {
    id: "u-alex",
    name: "Alex Rivera",
    email: "alex@voltify.demo",
    role: "customer",
    avatarHue: 265,
    createdAt: "2025-11-04T10:12:00.000Z",
  },
  {
    id: "u-jordan",
    name: "Jordan Blake",
    email: "jordan@voltify.demo",
    role: "customer",
    avatarHue: 168,
    createdAt: "2026-01-19T15:40:00.000Z",
  },
  {
    id: "u-admin",
    name: "Sam Okafor",
    email: "admin@voltify.demo",
    role: "admin",
    avatarHue: 24,
    createdAt: "2025-09-01T08:00:00.000Z",
  },
];

function isoDaysAgo(days: number, hour = 12): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(hour, (days * 13) % 60, 0, 0);
  return d.toISOString();
}

export const SEED_ADDRESSES: Address[] = [
  {
    id: "a-alex-home",
    userId: "u-alex",
    label: "Home",
    fullName: "Alex Rivera",
    line1: "1180 Fell Street",
    line2: "Apt 4B",
    city: "San Francisco",
    region: "CA",
    postcode: "94117",
    country: "United States",
    phone: "+1 415 555 0142",
    isDefault: true,
  },
  {
    id: "a-alex-work",
    userId: "u-alex",
    label: "Office",
    fullName: "Alex Rivera",
    line1: "1 Mission Street",
    line2: "Floor 12",
    city: "San Francisco",
    region: "CA",
    postcode: "94105",
    country: "United States",
    phone: "+1 415 555 0142",
    isDefault: false,
  },
];

export const FREE_SHIPPING_THRESHOLD = 1500000; // ₹15,000

/** Orders above this subtotal ship free; below it, small orders still ship free. */
const SMALL_ORDER_CUTOFF = 750000; // ₹7,500
const SMALL_ORDER_SHIPPING = 10000; // ₹100

export function shippingFor(subtotal: number): number {
  if (subtotal === 0) return 0;
  if (subtotal >= FREE_SHIPPING_THRESHOLD) return 0;
  return subtotal >= SMALL_ORDER_CUTOFF ? 0 : SMALL_ORDER_SHIPPING;
}

/** 18% — standard GST rate for electronics in India. */
export function taxFor(subtotal: number): number {
  return Math.round(subtotal * 0.18);
}

interface OrderDraft {
  id: string;
  number: string;
  userId: string;
  placedDaysAgo: number;
  items: [productId: string, variantValue: string | undefined, qty: number][];
  status: OrderStatus;
  addressId: string;
  paymentBrand: string;
  paymentLast4: string;
}

/** Events are derived backwards from the terminal status so every order has a
 *  coherent, complete timeline. */
const TIMELINE: Record<OrderStatus, [OrderStatus, string][]> = {
  placed: [],
  processing: [["placed", "Order received"]],
  shipped: [
    ["placed", "Order received"],
    ["processing", "Payment confirmed, preparing items"],
  ],
  delivered: [
    ["placed", "Order received"],
    ["processing", "Payment confirmed, preparing items"],
    ["shipped", "Handed to carrier — tracking sent"],
  ],
  cancelled: [["placed", "Order received"]],
};

const STATUS_TERMINAL_NOTE: Record<OrderStatus, string> = {
  placed: "Awaiting payment confirmation",
  processing: "Being packed in the warehouse",
  shipped: "In transit with the carrier",
  delivered: "Delivered to the address on file",
  cancelled: "Cancelled — refund issued to the original payment method",
};

const PLACED_NOTE = "Order received";

function buildEvents(draft: OrderDraft, placedAt: string): OrderEvent[] {
  if (draft.status === "cancelled") {
    const cancelledAt = new Date(new Date(placedAt).getTime() + 2 * 86_400_000).toISOString();
    return [
      { status: "placed", at: placedAt, note: PLACED_NOTE },
      { status: "cancelled", at: cancelledAt, note: STATUS_TERMINAL_NOTE.cancelled },
    ];
  }
  const chain = TIMELINE[draft.status];
  const events: OrderEvent[] = chain.map(([status, note], i) => ({
    status,
    at: new Date(new Date(placedAt).getTime() + i * 1.2 * 86_400_000).toISOString(),
    note,
  }));
  events.push({
    status: draft.status,
    at: new Date(new Date(placedAt).getTime() + chain.length * 1.2 * 86_400_000).toISOString(),
    note: STATUS_TERMINAL_NOTE[draft.status],
  });
  return events;
}

const ORDER_DRAFTS: OrderDraft[] = [
  {
    id: "o-1001",
    number: "VF-1001",
    userId: "u-alex",
    placedDaysAgo: 4,
    items: [
      ["p-nova-15-pro", "512GB", 1],
      ["p-pulse-buds-pro", "Black", 1],
    ],
    status: "shipped",
    addressId: "a-alex-home",
    paymentBrand: "Visa",
    paymentLast4: "4242",
  },
  {
    id: "o-1002",
    number: "VF-1002",
    userId: "u-alex",
    placedDaysAgo: 26,
    items: [["p-aether-14", "1TB", 1]],
    status: "delivered",
    addressId: "a-alex-home",
    paymentBrand: "Visa",
    paymentLast4: "4242",
  },
  {
    id: "o-1003",
    number: "VF-1003",
    userId: "u-alex",
    placedDaysAgo: 88,
    items: [
      ["p-onyx-action-cam", "Creator kit", 1],
      ["p-aether-charger-100w", "US plug", 2],
    ],
    status: "delivered",
    addressId: "a-alex-work",
    paymentBrand: "Mastercard",
    paymentLast4: "8210",
  },
  {
    id: "o-1004",
    number: "VF-1004",
    userId: "u-alex",
    placedDaysAgo: 141,
    items: [["p-pulse-band-8", "Black", 1]],
    status: "cancelled",
    addressId: "a-alex-home",
    paymentBrand: "Visa",
    paymentLast4: "4242",
  },
  {
    id: "o-1005",
    number: "VF-1005",
    userId: "u-alex",
    placedDaysAgo: 203,
    items: [["p-solace-usb-c-hub", "Space grey", 1]],
    status: "delivered",
    addressId: "a-alex-home",
    paymentBrand: "Amex",
    paymentLast4: "1005",
  },
  {
    id: "o-1006",
    number: "VF-1006",
    userId: "u-jordan",
    placedDaysAgo: 2,
    items: [
      ["p-vertex-watch-ultra-2", "47mm", 1],
      ["p-kestrel-monitor-stand", "Desk clamp", 1],
    ],
    status: "processing",
    addressId: "a-alex-home",
    paymentBrand: "Visa",
    paymentLast4: "1188",
  },
  {
    id: "o-1007",
    number: "VF-1007",
    userId: "u-jordan",
    placedDaysAgo: 19,
    items: [["p-lumen-r7", "With 24–70mm f/2.8", 1]],
    status: "delivered",
    addressId: "a-alex-home",
    paymentBrand: "Visa",
    paymentLast4: "1188",
  },
  {
    id: "o-1008",
    number: "VF-1008",
    userId: "u-jordan",
    placedDaysAgo: 61,
    items: [["p-vertex-mech-keyboard", "Tactile", 1]],
    status: "delivered",
    addressId: "a-alex-home",
    paymentBrand: "Mastercard",
    paymentLast4: "3391",
  },
  {
    id: "o-1009",
    number: "VF-1009",
    userId: "u-jordan",
    placedDaysAgo: 9,
    items: [["p-onyx-smart-ring", "Black", 1]],
    status: "shipped",
    addressId: "a-alex-home",
    paymentBrand: "Visa",
    paymentLast4: "1188",
  },
  // Orders from other shoppers, so the admin dashboard has volume that isn't
  // attributable to the two demo customer accounts.
  {
    id: "o-1010",
    number: "VF-1010",
    userId: "guest",
    placedDaysAgo: 1,
    items: [["p-nova-15-pro", "256GB", 1]],
    status: "placed",
    addressId: "a-alex-home",
    paymentBrand: "Visa",
    paymentLast4: "9033",
  },
  {
    id: "o-1011",
    number: "VF-1011",
    userId: "guest",
    placedDaysAgo: 2,
    items: [["p-solace-air-13", "512GB", 2]],
    status: "processing",
    addressId: "a-alex-home",
    paymentBrand: "Amex",
    paymentLast4: "2233",
  },
  {
    id: "o-1012",
    number: "VF-1012",
    userId: "guest",
    placedDaysAgo: 6,
    items: [["p-lumen-studio-anc", "Midnight", 1]],
    status: "shipped",
    addressId: "a-alex-home",
    paymentBrand: "Visa",
    paymentLast4: "4471",
  },
  {
    id: "o-1013",
    number: "VF-1013",
    userId: "guest",
    placedDaysAgo: 15,
    items: [["p-vertex-fold", "512GB", 1]],
    status: "delivered",
    addressId: "a-alex-home",
    paymentBrand: "Visa",
    paymentLast4: "7781",
  },
  {
    id: "o-1014",
    number: "VF-1014",
    userId: "guest",
    placedDaysAgo: 33,
    items: [
      ["p-onyx-15", "512GB", 1],
      ["p-pulse-buds-pro", "White", 1],
    ],
    status: "delivered",
    addressId: "a-alex-home",
    paymentBrand: "Mastercard",
    paymentLast4: "5521",
  },
  {
    id: "o-1015",
    number: "VF-1015",
    userId: "guest",
    placedDaysAgo: 47,
    items: [["p-kestrel-drone", "Fly More kit", 1]],
    status: "delivered",
    addressId: "a-alex-home",
    paymentBrand: "Visa",
    paymentLast4: "3312",
  },
  {
    id: "o-1016",
    number: "VF-1016",
    userId: "guest",
    placedDaysAgo: 72,
    items: [["p-aether-magsafe-stand", "Silver", 2]],
    status: "delivered",
    addressId: "a-alex-home",
    paymentBrand: "Visa",
    paymentLast4: "8840",
  },
  {
    id: "o-1017",
    number: "VF-1017",
    userId: "guest",
    placedDaysAgo: 96,
    items: [["p-pulse-band-8", "Coral", 1]],
    status: "cancelled",
    addressId: "a-alex-home",
    paymentBrand: "Visa",
    paymentLast4: "1120",
  },
];

function priceOf(productId: string, variantValue: string | undefined): number {
  const product = PRODUCTS.find((p) => p.id === productId);
  if (!product) return 0;
  if (!variantValue) return product.price;
  const v = product.variants.find((x) => x.value === variantValue);
  return product.price + (v?.priceDelta ?? 0);
}

export function buildOrder(draft: OrderDraft): Order {
  const items: OrderItem[] = draft.items.map(([productId, variantValue, qty]) => {
    const product = PRODUCTS.find((p) => p.id === productId);
    return {
      productId,
      name: product?.name ?? "Retired product",
      brand: product?.brand ?? "—",
      variantValue,
      quantity: qty,
      unitPrice: priceOf(productId, variantValue),
    };
  });

  const subtotal = items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
  const shipping = shippingFor(subtotal);
  const tax = taxFor(subtotal);
  const placedAt = isoDaysAgo(draft.placedDaysAgo);
  const address = SEED_ADDRESSES.find((a) => a.id === draft.addressId) ?? SEED_ADDRESSES[0];

  return {
    id: draft.id,
    number: draft.number,
    userId: draft.userId,
    items,
    subtotal,
    shipping,
    tax,
    discount: 0,
    total: subtotal + shipping + tax,
    status: draft.status,
    placedAt,
    events: buildEvents(draft, placedAt),
    shippingAddress: address,
    billingSameAsShipping: true,
    paymentBrand: draft.paymentBrand,
    paymentLast4: draft.paymentLast4,
  };
}

export const SEED_ORDERS: Order[] = ORDER_DRAFTS.filter((d) =>
  PRODUCTS.some((p) => p.id === d.items[0][0]),
).map(buildOrder);

export { lineId };