import { useState } from "react";
import { Link } from "react-router-dom";
import { useStore } from "../store/StoreContext";
import { formatPrice, pluralise } from "../lib/format";
import { FREE_SHIPPING_THRESHOLD, shippingFor, taxFor } from "../data/seed";
import { ProductArt } from "../lib/productArt";
import {
  Badge,
  Breadcrumbs,
  Button,
  EmptyState,
  LinkButton,
  QtyStepper,
} from "../components/Primitives";
import { CartIcon, ReturnIcon, ShieldIcon, TrashIcon, TruckIcon } from "../components/Icons";

/** Promo codes accepted by the mock checkout. */
const PROMOS: Record<string, { label: string; percentOff: number }> = {
  VOLT10: { label: "10% off your order", percentOff: 0.1 },
  NEWGEAR: { label: "$25 off orders over $200", percentOff: 0.125 },
};

export function OrderSummary({
  subtotal,
  discount = 0,
  children,
}: {
  subtotal: number;
  discount?: number;
  children?: React.ReactNode;
}) {
  const shipping = shippingFor(Math.max(0, subtotal - discount));
  const tax = taxFor(Math.max(0, subtotal - discount));
  const total = Math.max(0, subtotal - discount) + shipping + tax;

  return (
    <div className="rounded-2xl border border-line bg-surface">
      <h2 className="border-b border-line px-5 py-4 text-sm font-semibold text-fg">Order summary</h2>
      <dl className="space-y-2.5 px-5 py-4 text-sm">
        <div className="flex justify-between text-fg-2">
          <dt>Subtotal</dt>
          <dd className="tabular-nums">{formatPrice(subtotal)}</dd>
        </div>
        {discount > 0 && (
          <div className="flex justify-between text-success">
            <dt>Discount</dt>
            <dd className="tabular-nums">−{formatPrice(discount)}</dd>
          </div>
        )}
        <div className="flex justify-between text-fg-2">
          <dt>Shipping</dt>
          <dd className="tabular-nums">{shipping === 0 ? "Free" : formatPrice(shipping)}</dd>
        </div>
        <div className="flex justify-between text-fg-2">
          <dt>Estimated tax</dt>
          <dd className="tabular-nums">{formatPrice(tax)}</dd>
        </div>
        <div className="flex justify-between border-t border-line pt-3 text-base font-semibold text-fg">
          <dt>Total</dt>
          <dd className="tabular-nums" data-testid="order-total">
            {formatPrice(total)}
          </dd>
        </div>
      </dl>
      {children}
    </div>
  );
}

export function CartPage() {
  const { cartEntries, cartSubtotal, setQuantity, removeLine, dispatch } = useStore();
  const [promoInput, setPromoInput] = useState("");
  const [promo, setPromo] = useState<{ code: string; label: string } | null>(null);
  const [promoError, setPromoError] = useState("");

  const applyPromo = () => {
    const code = promoInput.trim().toUpperCase();
    if (!code) return;
    const found = PROMOS[code];
    if (!found) {
      setPromoError(`“${code}” isn’t a valid code`);
      setPromo(null);
      return;
    }
    setPromoError("");
    setPromo({ code, label: found.label });
    setPromoInput("");
  };

  const discount = promo
    ? Math.round(cartSubtotal * PROMOS[promo.code].percentOff)
    : 0;

  if (cartEntries.length === 0) {
    return (
      <div className="shell py-16">
        <div className="mx-auto max-w-md">
          <EmptyState
            icon={<CartIcon size={24} />}
            title="Your cart is empty"
            description="Once you add something, it’ll show up here with your delivery estimate."
            action={<LinkButton to="/products">Browse products</LinkButton>}
          />
          <div className="mt-4 flex justify-center gap-4 text-sm text-fg-3">
            <Link to="/account/orders" className="hover:text-fg">
              Track an order
            </Link>
            <Link to="/account/wishlist" className="hover:text-fg">
              View wishlist
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const remainingForFreeShip = FREE_SHIPPING_THRESHOLD - (cartSubtotal - discount);

  return (
    <div className="shell py-8">
      <Breadcrumbs items={[{ label: "Home", to: "/" }, { label: "Cart" }]} />

      <header className="mt-4 mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight text-fg sm:text-3xl">
          Shopping cart
        </h1>
        <p className="text-sm text-fg-3">
          {pluralise(cartEntries.reduce((n, e) => n + e.quantity, 0), "item")}
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <div>
          {remainingForFreeShip > 0 && (
            <div className="mb-5 rounded-xl border border-accent/25 bg-accent/10 px-4 py-3">
              <p className="flex items-center gap-2 text-sm text-fg-2">
                <TruckIcon size={16} className="shrink-0 text-accent" />
                <span>
                  Add <strong className="text-fg">{formatPrice(remainingForFreeShip)}</strong> more
                  for free shipping
                </span>
              </p>
              <div className="mt-2 h-1 overflow-hidden rounded-full bg-surface-3">
                <div
                  className="h-full rounded-full bg-accent transition-all duration-500"
                  style={{
                    width: `${Math.min(100, ((cartSubtotal - discount) / FREE_SHIPPING_THRESHOLD) * 100)}%`,
                  }}
                />
              </div>
            </div>
          )}

          <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
            {cartEntries.map((entry) => (
              <li key={entry.id} className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
                <Link
                  to={`/products/${entry.product.slug}`}
                  className="h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-surface-2"
                >
                  <ProductArt product={entry.product} className="h-full w-full" />
                </Link>

                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium uppercase tracking-wider text-fg-3">
                    {entry.product.brand}
                  </p>
                  <Link
                    to={`/products/${entry.product.slug}`}
                    className="mt-0.5 block font-medium text-fg hover:text-accent"
                  >
                    {entry.product.name}
                  </Link>
                  {entry.variantValue && (
                    <p className="mt-0.5 text-sm text-fg-3">{entry.variantValue}</p>
                  )}
                  <p className="mt-1.5 text-sm text-fg-2 tabular-nums">
                    {formatPrice(entry.unitPrice)} each
                  </p>

                  <div className="mt-3 flex items-center gap-3 sm:hidden">
                    <QtyStepper
                      value={entry.quantity}
                      onChange={(q) => setQuantity(entry.id, q)}
                      max={99}
                    />
                    <button
                      type="button"
                      onClick={() => removeLine(entry.id)}
                      className="text-sm text-fg-3 hover:text-danger"
                    >
                      Remove
                    </button>
                  </div>
                </div>

                <div className="flex shrink-0 items-center justify-between gap-4 sm:flex-col sm:items-end">
                  <span className="font-semibold text-fg tabular-nums">
                    {formatPrice(entry.lineTotal)}
                  </span>
                  <div className="hidden items-center gap-3 sm:flex">
                    <QtyStepper
                      value={entry.quantity}
                      onChange={(q) => setQuantity(entry.id, q)}
                      max={99}
                    />
                    <button
                      type="button"
                      onClick={() => removeLine(entry.id)}
                      aria-label={`Remove ${entry.product.name}`}
                      className="rounded-lg p-1.5 text-fg-3 transition-colors hover:bg-surface-3 hover:text-danger"
                    >
                      <TrashIcon size={16} />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <Link
              to="/products"
              className="text-sm text-fg-3 transition-colors hover:text-fg"
            >
              ← Continue shopping
            </Link>
            <Button variant="ghost" size="sm" onClick={() => dispatch({ type: "cart/clear" })}>
              Clear cart
            </Button>
          </div>
        </div>

        <div className="lg:sticky lg:top-32 lg:self-start">
          <OrderSummary subtotal={cartSubtotal} discount={discount}>
            <div className="px-5 pb-4">
              <div className="mb-4 flex gap-2">
                <input
                  type="text"
                  value={promoInput}
                  onChange={(e) => setPromoInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && applyPromo()}
                  placeholder="Promo code"
                  aria-label="Promo code"
                  className="h-10 w-full min-w-0 rounded-xl border border-line bg-surface-2 px-3 text-sm text-fg uppercase placeholder:normal-case placeholder:text-fg-3 focus:border-accent focus:outline-none"
                />
                <Button variant="secondary" size="sm" onClick={applyPromo} className="h-10">
                  Apply
                </Button>
              </div>
              {promo && (
                <div className="flex items-center justify-between rounded-lg border border-success/30 bg-success/10 px-3 py-2 text-sm">
                  <span className="text-success">
                    {promo.code} — {promo.label}
                  </span>
                  <button
                    type="button"
                    onClick={() => setPromo(null)}
                    className="text-fg-3 hover:text-fg"
                  >
                    Remove
                  </button>
                </div>
              )}
              {promoError && <p className="mt-2 text-xs text-danger">{promoError}</p>}
              {!promo && !promoError && (
                <p className="text-xs text-fg-3">
                  Try <code className="text-fg-2">VOLT10</code> or{" "}
                  <code className="text-fg-2">NEWGEAR</code>
                </p>
              )}

              <LinkButton to="/checkout" size="lg" className="mt-4 w-full">
                Proceed to checkout
              </LinkButton>

              <ul className="mt-4 space-y-2 border-t border-line pt-4 text-xs text-fg-3">
                <li className="flex items-center gap-2">
                  <ShieldIcon size={14} className="shrink-0" />
                  Secure checkout — no real payment is processed
                </li>
                <li className="flex items-center gap-2">
                  <ReturnIcon size={14} className="shrink-0" />
                  30-day free returns on everything
                </li>
              </ul>
            </div>
          </OrderSummary>

          {promo && <Badge tone="success" className="mt-3">Discount applied at checkout</Badge>}
        </div>
      </div>
    </div>
  );
}