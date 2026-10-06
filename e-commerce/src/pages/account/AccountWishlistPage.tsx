import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { allProducts } from "../../data/api";
import { formatPrice, pluralise } from "../../lib/format";
import { useStore } from "../../store/StoreContext";
import { ProductArt } from "../../lib/productArt";
import {
  Button,
  EmptyState,
  LinkButton,
  QtyStepper,
} from "../../components/Primitives";
import { HeartIcon, TrashIcon } from "../../components/Icons";

export function AccountWishlistPage() {
  const { state, toggleWishlist, addToCart, notify } = useStore();
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  const products = useMemo(
    () =>
      state.wishlist
        .map((id) => allProducts().find((p) => p.id === id))
        .filter((p): p is NonNullable<typeof p> => Boolean(p)),
    [state.wishlist],
  );

  const total = products.reduce((sum, p) => sum + p.price * (quantities[p.id] ?? 1), 0);

  const addAllToCart = () => {
    let added = 0;
    for (const p of products) {
      if (p.stock > 0) {
        addToCart(p.id, undefined, quantities[p.id] ?? 1);
        added++;
      }
    }
    if (added === 0) {
      notify("Nothing on your wishlist is in stock", "error");
    }
  };

  if (products.length === 0) {
    return (
      <div>
        <h2 className="mb-4 text-lg font-semibold tracking-tight text-fg">Wishlist</h2>
        <EmptyState
          icon={<HeartIcon size={22} />}
          title="Your wishlist is empty"
          description="Tap the heart on any product card or detail page to save it here."
          action={<LinkButton to="/products">Browse products</LinkButton>}
        />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-fg">Wishlist</h2>
          <p className="text-sm text-fg-3">{pluralise(products.length, "product")} saved</p>
        </div>
        <Button
          size="sm"
          variant="secondary"
          onClick={addAllToCart}
          disabled={products.every((p) => p.stock === 0)}
        >
          Add all to cart
        </Button>
      </div>

      <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
        {products.map((p) => (
          <li key={p.id} className="flex flex-wrap items-center gap-4 p-4">
            <Link
              to={`/products/${p.slug}`}
              className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-surface-2"
            >
              <ProductArt product={p} className="h-full w-full" />
            </Link>

            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium uppercase tracking-wider text-fg-3">
                {p.brand}
              </p>
              <Link
                to={`/products/${p.slug}`}
                className="mt-0.5 block font-medium text-fg hover:text-accent"
              >
                {p.name}
              </Link>
              <p className="mt-1 text-sm text-fg-2 tabular-nums">{formatPrice(p.price)}</p>
              {p.stock === 0 && <p className="mt-1 text-xs text-danger">Currently out of stock</p>}
            </div>

            <div className="flex items-center gap-3">
              <QtyStepper
                value={quantities[p.id] ?? 1}
                onChange={(q) => setQuantities((prev) => ({ ...prev, [p.id]: q }))}
                max={Math.max(1, p.stock)}
                min={1}
              />
              <Button
                size="sm"
                disabled={p.stock === 0}
                onClick={() => addToCart(p.id, undefined, quantities[p.id] ?? 1)}
              >
                Add
              </Button>
              <button
                type="button"
                onClick={() => toggleWishlist(p.id)}
                aria-label={`Remove ${p.name} from wishlist`}
                className="grid h-9 w-9 place-items-center rounded-lg text-fg-3 transition-colors hover:bg-surface-3 hover:text-danger"
              >
                <TrashIcon size={16} />
              </button>
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-4 flex items-center justify-between rounded-2xl border border-line bg-surface px-5 py-4">
        <span className="text-sm text-fg-2">Estimated total</span>
        <span className="font-semibold text-fg tabular-nums">{formatPrice(total)}</span>
      </div>
    </div>
  );
}