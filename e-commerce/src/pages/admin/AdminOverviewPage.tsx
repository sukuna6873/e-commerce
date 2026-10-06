import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import type { Order } from "../../types";
import { allProducts, fetchOrders } from "../../data/api";
import { LOW_STOCK } from "../../data/catalog";
import { formatPrice, timeAgo } from "../../lib/format";
import { ProductArt } from "../../lib/productArt";
import { Badge, Skeleton } from "../../components/Primitives";
import { AlertIcon, BoxIcon, ChevronRight, PackageIcon } from "../../components/Icons";
import { useStore } from "../../store/StoreContext";
import { OrderStatusPill } from "../account/AccountOrdersPage";

/** Orders placed in the last N days, for the "recent revenue" figure. */
const REVENUE_WINDOW_DAYS = 30;

export function AdminOverviewPage() {
  const { state } = useStore();
  const [orders, setOrders] = useState<Order[] | null>(null);

  // state.catalogVersion changes on stock edits, so the KPIs recalculate then.
  useEffect(() => {
    fetchOrders().then(setOrders);
  }, [state.catalogVersion]);

  const products = useMemo(() => allProducts(), [state.catalogVersion]);

  const stats = useMemo(() => {
    const all = orders ?? [];
    const settled = all.filter((o) => o.status !== "cancelled");

    const cutoff = Date.now() - REVENUE_WINDOW_DAYS * 86_400_000;
    const recentRevenue = settled
      .filter((o) => new Date(o.placedAt).getTime() >= cutoff)
      .reduce((sum, o) => sum + o.total, 0);

    const unitsSold = settled.reduce(
      (sum, o) => sum + o.items.reduce((n, i) => n + i.quantity, 0),
      0,
    );

    const lowStock = products
      .filter((p) => p.variants.some((v) => v.stock <= LOW_STOCK) || p.stock <= LOW_STOCK)
      .slice(0, 5);

    return {
      revenue: settled.reduce((sum, o) => sum + o.total, 0),
      recentRevenue,
      orderCount: all.length,
      activeCount: all.filter(
        (o) => o.status === "placed" || o.status === "processing",
      ).length,
      unitsSold,
      avgOrderValue: settled.length > 0
        ? Math.round(settled.reduce((sum, o) => sum + o.total, 0) / settled.length)
        : 0,
      lowStock,
      outOfStockCount: products.filter((p) => p.stock === 0).length,
    };
  }, [orders, products]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-fg">Dashboard</h2>
        <p className="text-sm text-fg-3">
          Store performance across the seeded catalog and order history.
        </p>
      </div>

      {/* KPI cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {!orders
          ? Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-2xl" />
            ))
          : [
              {
                label: "Lifetime revenue",
                value: formatPrice(stats.revenue),
                sub: `${stats.orderCount} orders`,
              },
              {
                label: `Revenue, last ${REVENUE_WINDOW_DAYS} days`,
                value: formatPrice(stats.recentRevenue),
                sub: "Excludes cancelled",
              },
              {
                label: "Average order value",
                value: formatPrice(stats.avgOrderValue),
                sub: `${stats.unitsSold} units sold`,
              },
              {
                label: "Needs fulfilment",
                value: String(stats.activeCount),
                sub: `${stats.outOfStockCount} products out of stock`,
              },
            ].map((card) => (
              <div key={card.label} className="rounded-2xl border border-line bg-surface p-4">
                <p className="text-xs font-medium uppercase tracking-wider text-fg-3">
                  {card.label}
                </p>
                <p className="mt-1.5 text-2xl font-semibold tracking-tight text-fg tabular-nums">
                  {card.value}
                </p>
                <p className="mt-1 text-xs text-fg-3">{card.sub}</p>
              </div>
            ))}
      </div>

      {/* Stock warnings */}
      {stats.lowStock.length > 0 && (
        <section className="rounded-2xl border border-warning/30 bg-warning/5">
          <div className="flex items-center justify-between border-b border-warning/20 px-5 py-3.5">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-fg">
              <AlertIcon size={16} className="text-warning" />
              Low stock
            </h3>
            <Link
              to="/admin/inventory"
              className="flex items-center gap-1 text-sm text-accent transition-colors hover:text-accent-hover"
            >
              Manage inventory
              <ChevronRight size={14} />
            </Link>
          </div>
          <ul className="divide-y divide-warning/10">
            {stats.lowStock.map((p) => {
              const total = p.variants.length
                ? p.variants.reduce((s, v) => s + v.stock, 0)
                : p.stock;
              return (
                <li key={p.id} className="flex items-center gap-3 px-5 py-3">
                  <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-surface-2">
                    <ProductArt product={p} className="h-full w-full" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <Link
                      to={`/admin/products?q=${encodeURIComponent(p.name)}`}
                      className="truncate text-sm font-medium text-fg hover:text-accent"
                    >
                      {p.name}
                    </Link>
                    <p className="text-xs text-fg-3">
                      {total} unit{total === 1 ? "" : "s"} across{" "}
                      {p.variants.length || 1} option{p.variants.length === 1 ? "" : "s"}
                    </p>
                  </div>
                  <Badge tone={total === 0 ? "danger" : "warning"}>
                    {total === 0 ? "Out of stock" : `${total} left`}
                  </Badge>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* Recent orders */}
      <section className="rounded-2xl border border-line bg-surface">
        <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
          <h3 className="text-sm font-semibold text-fg">Latest orders</h3>
          <Link
            to="/admin/orders"
            className="flex items-center gap-1 text-sm text-accent transition-colors hover:text-accent-hover"
          >
            All orders
            <ChevronRight size={14} />
          </Link>
        </div>

        {!orders ? (
          <div className="space-y-2 p-5">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : (
          <ul className="divide-y divide-line">
            {orders.slice(0, 6).map((order) => (
              <li key={order.id}>
                <Link
                  to="/admin/orders"
                  className="flex flex-wrap items-center gap-3 px-5 py-3 transition-colors hover:bg-surface-2"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-fg">{order.number}</p>
                    <p className="text-xs text-fg-3">
                      {order.items.reduce((n, i) => n + i.quantity, 0)} items ·{" "}
                      {timeAgo(order.placedAt)}
                    </p>
                  </div>
                  <OrderStatusPill status={order.status} />
                  <span className="text-sm font-semibold text-fg tabular-nums">
                    {formatPrice(order.total)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Quick links */}
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { to: "/admin/products", label: "Manage products", Icon: BoxIcon },
          { to: "/admin/inventory", label: "Adjust stock", Icon: PackageIcon },
          { to: "/admin/orders", label: "Fulfil orders", Icon: PackageIcon },
        ].map(({ to, label, Icon }) => (
          <Link
            key={to}
            to={to}
            className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-surface px-4 py-3.5 transition-colors hover:border-line-strong"
          >
            <span className="flex items-center gap-2.5 text-sm font-medium text-fg">
              <Icon size={17} className="text-accent" />
              {label}
            </span>
            <ChevronRight size={15} className="text-fg-3" />
          </Link>
        ))}
      </div>
    </div>
  );
}