import { useEffect } from "react";
import { Link } from "react-router-dom";
import { formatPrice, pluralise } from "../lib/format";
import { FREE_SHIPPING_THRESHOLD, shippingFor, taxFor } from "../data/seed";
import { useStore } from "../store/StoreContext";
import { ProductArt } from "../lib/productArt";
import { Button, LinkButton, QtyStepper } from "./Primitives";
import { CartIcon, CloseIcon, TrashIcon, TruckIcon } from "./Icons";

/**
 * Slide-over cart, opened from the header on every viewport size. Open state
 * lives in the store so the header icon, the "added to cart" toast and this
 * panel all stay in sync.
 */
export function CartDrawer() {
  const { cartEntries, cartSubtotal, cartOpen, closeCart, setQuantity, removeLine, dispatch } =
    useStore();

  useEffect(() => {
    if (!cartOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && closeCart();
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [cartOpen, closeCart]);

  if (!cartOpen) return null;

  const itemCount = cartEntries.reduce((n, e) => n + e.quantity, 0);
  const shipping = shippingFor(cartSubtotal);
  const tax = taxFor(cartSubtotal);
  const total = cartSubtotal + shipping + tax;
  const remainingForFreeShip = FREE_SHIPPING_THRESHOLD - cartSubtotal;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-ink/70 backdrop-blur-sm" onClick={closeCart} aria-hidden />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Shopping cart"
        className="relative z-10 flex h-full w-full max-w-md flex-col border-l border-line bg-surface shadow-2xl"
      >
        <header className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="flex items-center gap-2 text-base font-semibold text-fg">
            <CartIcon size={18} />
            Your cart
            {itemCount > 0 && (
              <span className="text-sm font-normal text-fg-3">{pluralise(itemCount, "item")}</span>
            )}
          </h2>
          <button
            type="button"
            onClick={closeCart}
            aria-label="Close cart"
            className="grid h-8 w-8 place-items-center rounded-lg text-fg-3 transition-colors hover:bg-surface-3 hover:text-fg"
          >
            <CloseIcon size={18} />
          </button>
        </header>

        {cartEntries.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-surface-3 text-fg-3">
              <CartIcon size={26} />
            </div>
            <div>
              <p className="font-medium text-fg">Your cart is empty</p>
              <p className="mt-1 text-sm text-fg-3">Browse the catalog to add something.</p>
            </div>
            <LinkButton to="/products" onClick={closeCart}>
              Shop all products
            </LinkButton>
          </div>
        ) : (
          <>
            <div className="min-h-0 flex-1 overflow-y-auto">
              {remainingForFreeShip > 0 && (
                <div className="border-b border-line bg-surface-2 px-5 py-3">
                  <p className="flex items-center gap-2 text-xs text-fg-2">
                    <TruckIcon size={15} className="shrink-0 text-accent" />
                    <span>
                      Add <strong className="text-fg">{formatPrice(remainingForFreeShip)}</strong> more
                      for free shipping
                    </span>
                  </p>
                  <div className="mt-2 h-1 overflow-hidden rounded-full bg-surface-3">
                    <div
                      className="h-full rounded-full bg-accent transition-all duration-500"
                      style={{
                        width: `${Math.min(100, (cartSubtotal / FREE_SHIPPING_THRESHOLD) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              )}

              <ul className="divide-y divide-line">
                {cartEntries.map((entry) => (
                  <li key={entry.id} className="flex gap-3.5 px-5 py-4">
                    <Link
                      to={`/products/${entry.product.slug}`}
                      onClick={closeCart}
                      className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-surface-2"
                    >
                      <ProductArt product={entry.product} className="h-full w-full" />
                    </Link>

                    <div className="flex min-w-0 flex-1 flex-col">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <Link
                            to={`/products/${entry.product.slug}`}
                            onClick={closeCart}
                            className="block truncate text-sm font-medium text-fg hover:text-accent"
                          >
                            {entry.product.name}
                          </Link>
                          {entry.variantValue && (
                            <p className="truncate text-xs text-fg-3">{entry.variantValue}</p>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => removeLine(entry.id)}
                          aria-label={`Remove ${entry.product.name} from cart`}
                          className="shrink-0 rounded-lg p-1 text-fg-3 transition-colors hover:bg-surface-3 hover:text-danger"
                        >
                          <TrashIcon size={15} />
                        </button>
                      </div>

                      <div className="mt-auto flex items-center justify-between gap-2 pt-2">
                        <QtyStepper
                          size="sm"
                          value={entry.quantity}
                          max={99}
                          onChange={(q) => setQuantity(entry.id, q)}
                        />
                        <span className="text-sm font-semibold text-fg tabular-nums">
                          {formatPrice(entry.lineTotal)}
                        </span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <footer className="border-t border-line bg-surface-2 px-5 py-4">
              <dl className="space-y-1.5 text-sm">
                <div className="flex justify-between text-fg-2">
                  <dt>Subtotal</dt>
                  <dd className="tabular-nums">{formatPrice(cartSubtotal)}</dd>
                </div>
                <div className="flex justify-between text-fg-2">
                  <dt>Shipping</dt>
                  <dd className="tabular-nums">{shipping === 0 ? "Free" : formatPrice(shipping)}</dd>
                </div>
                <div className="flex justify-between text-fg-2">
                  <dt>Estimated tax</dt>
                  <dd className="tabular-nums">{formatPrice(tax)}</dd>
                </div>
                <div className="flex justify-between border-t border-line pt-2.5 text-base font-semibold text-fg">
                  <dt>Total</dt>
                  <dd className="tabular-nums">{formatPrice(total)}</dd>
                </div>
              </dl>

              <div className="mt-4 flex gap-2">
                <LinkButton
                  to="/checkout"
                  onClick={closeCart}
                  className="flex-1"
                  size="lg"
                >
                  Checkout
                </LinkButton>
                <Button
                  variant="secondary"
                  size="lg"
                  onClick={() => dispatch({ type: "cart/clear" })}
                >
                  Clear
                </Button>
              </div>

              <button
                type="button"
                onClick={closeCart}
                className="mt-3 w-full text-center text-sm text-fg-3 transition-colors hover:text-fg"
              >
                Continue shopping
              </button>
            </footer>
          </>
        )}
      </aside>
    </div>
  );
}