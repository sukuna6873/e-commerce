import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import type { Order } from "../../types";
import { allProducts, fetchOrders } from "../../data/api";
import { formatDate, formatPrice, pluralise } from "../../lib/format";
import { useStore } from "../../store/StoreContext";
import { ProductArt } from "../../lib/productArt";
import { EmptyState, LinkButton, Skeleton } from "../../components/Primitives";
import { ChevronRight, HeartIcon, PackageIcon, ReturnIcon, TruckIcon } from "../../components/Icons";
import { OrderStatusPill } from "./AccountOrdersPage";

export function AccountOverviewPage() {
  const { user, state } = useStore();
  const [orders, setOrders] = useState<Order[] | null>(null);

  useEffect(() => {
    if (!user) return;
    fetchOrders(user.id).then(setOrders);
  }, [user]);

  const active = useMemo(
    () => (orders ?? []).filter((o) => o.status !== "delivered" && o.status !== "cancelled"),
    [orders],
  );

  const totalSpent = useMemo(
    () =>
      (orders ?? [])
        .filter((o) => o.status !== "cancelled")
        .reduce((sum, o) => sum + o.total, 0),
    [orders],
  );

  const wishlistProducts = useMemo(
    () =>
      state.wishlist
        .map((id) => allProducts().find((p) => p.id === id))
        .filter((p): p is NonNullable<typeof p> => Boolean(p))
        .slice(0, 4),
    [state.wishlist],
  );

  if (!user) return null;

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { label: "Orders placed", value: orders ? String(orders.length) : null },
          { label: "In transit", value: orders ? String(active.length) : null },
          { label: "Lifetime spend", value: orders ? formatPrice(totalSpent) : null },
        ].map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-line bg-surface p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-fg-3">
              {stat.label}
            </p>
            {stat.value === null ? (
              <Skeleton className="mt-2 h-7 w-16" />
            ) : (
              <p className="mt-1.5 text-2xl font-semibold tracking-tight text-fg tabular-nums">
                {stat.value}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Active orders */}
      <section className="rounded-2xl border border-line bg-surface">
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="text-sm font-semibold text-fg">Recent orders</h2>
          <Link
            to="/account/orders"
            className="flex items-center gap-1 text-sm text-accent transition-colors hover:text-accent-hover"
          >
            All orders
            <ChevronRight size={14} />
          </Link>
        </div>

        {!orders ? (
          <div className="space-y-2 p-5">
            {Array.from({ length: 2 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="p-5">
            <EmptyState
              icon={<PackageIcon size={22} />}
              title="No orders yet"
              description="When you place an order it will appear here with tracking."
              action={<LinkButton to="/products">Start shopping</LinkButton>}
            />
          </div>
        ) : (
          <ul className="divide-y divide-line">
            {orders.slice(0, 3).map((order) => (
              <li key={order.id}>
                <Link
                  to={`/account/orders/${order.id}`}
                  className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-surface-2"
                >
                  <div className="flex -space-x-2">
                    {order.items.slice(0, 3).map((item) => {
                      const p = allProducts().find((x) => x.id === item.productId);
                      return p ? (
                        <div
                          key={`${item.productId}-${item.variantValue ?? ""}`}
                          className="h-10 w-10 overflow-hidden rounded-lg border-2 border-surface bg-surface-2"
                        >
                          <ProductArt product={p} className="h-full w-full" />
                        </div>
                      ) : null;
                    })}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-fg">
                      {order.number} · {pluralise(order.items.length, "item")}
                    </p>
                    <p className="text-xs text-fg-3">
                      Placed {formatDate(order.placedAt)}
                    </p>
                  </div>

                  <OrderStatusPill status={order.status} />
                  <span className="shrink-0 text-sm font-semibold text-fg tabular-nums">
                    {formatPrice(order.total)}
                  </span>
                  <ChevronRight size={16} className="shrink-0 text-fg-3" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Wishlist preview */}
      <section className="rounded-2xl border border-line bg-surface">
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="text-sm font-semibold text-fg">Wishlist</h2>
          <Link
            to="/account/wishlist"
            className="flex items-center gap-1 text-sm text-accent transition-colors hover:text-accent-hover"
          >
            View all
            <ChevronRight size={14} />
          </Link>
        </div>

        {wishlistProducts.length === 0 ? (
          <div className="p-5">
            <EmptyState
              icon={<HeartIcon size={22} />}
              title="Nothing saved yet"
              description="Tap the heart on any product to save it here."
              action={<LinkButton to="/products" variant="secondary">Browse products</LinkButton>}
            />
          </div>
        ) : (
          <ul className="grid gap-3 p-5 sm:grid-cols-2">
            {wishlistProducts.map((p) => (
              <li key={p.id}>
                <Link
                  to={`/products/${p.slug}`}
                  className="flex items-center gap-3 rounded-xl border border-line p-2.5 transition-colors hover:border-line-strong"
                >
                  <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-surface-2">
                    <ProductArt product={p} className="h-full w-full" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-fg">{p.name}</p>
                    <p className="text-xs text-fg-3 tabular-nums">{formatPrice(p.price)}</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Quick actions */}
      <section className="grid gap-3 sm:grid-cols-2">
        {[
          { to: "/account/orders", label: "Track a delivery", Icon: TruckIcon },
          { to: "/account/addresses", label: "Manage addresses", Icon: ReturnIcon },
        ].map(({ to, label, Icon }) => (
          <Link
            key={to}
            to={to}
            className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-surface px-5 py-4 transition-colors hover:border-line-strong"
          >
            <span className="flex items-center gap-3 text-sm font-medium text-fg">
              <Icon size={18} className="text-accent" />
              {label}
            </span>
            <ChevronRight size={16} className="text-fg-3" />
          </Link>
        ))}
      </section>
    </div>
  );
}