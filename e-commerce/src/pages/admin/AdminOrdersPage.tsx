import { useEffect, useMemo, useState } from "react";
import type { Order, OrderStatus } from "../../types";
import { allProducts, fetchOrders, updateOrderStatus } from "../../data/api";
import { formatDate, formatPrice, pluralise, timeAgo } from "../../lib/format";
import { useStore } from "../../store/StoreContext";
import { ProductArt } from "../../lib/productArt";
import {
  Badge,
  Button,
  EmptyState,
  Modal,
  Select,
  Skeleton,
} from "../../components/Primitives";
import { CheckIcon, PackageIcon, SearchIcon, TruckIcon } from "../../components/Icons";
import { OrderStatusPill } from "../account/AccountOrdersPage";

/** The fulfilment path, in the order an operator would walk it. */
const FLOW: OrderStatus[] = ["placed", "processing", "shipped", "delivered"];

export function AdminOrdersPage() {
  const { state, refreshCatalog, notify } = useStore();
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState<Order | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    fetchOrders().then(setOrders);
  }, [state.catalogVersion]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (orders ?? []).filter((o) => {
      if (filter !== "all" && o.status !== filter) return false;
      if (!q) return true;
      return (
        o.number.toLowerCase().includes(q) ||
        o.shippingAddress.fullName.toLowerCase().includes(q) ||
        o.items.some((i) => i.name.toLowerCase().includes(q))
      );
    });
  }, [orders, filter, search]);

  const advance = async (order: Order, status: OrderStatus) => {
    setBusyId(order.id);
    const next = await updateOrderStatus(order.id, status);
    setOrders(next);
    setBusyId(null);
    refreshCatalog();
    notify(
      status === "cancelled"
        ? `${order.number} cancelled and stock restored`
        : `${order.number} marked ${status}`,
      status === "cancelled" ? "info" : "success",
    );
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-fg">Orders</h2>
          <p className="text-sm text-fg-3">
            {filtered.length} order{filtered.length === 1 ? "" : "s"} shown
          </p>
        </div>
        <Select value={filter} onChange={setFilter} className="w-40" id="admin-order-filter">
          <option value="all">All statuses</option>
          {FLOW.map((s) => (
            <option key={s} value={s} className="capitalize">
              {s}
            </option>
          ))}
          <option value="cancelled">Cancelled</option>
        </Select>
      </div>

      <div className="relative mb-4">
        <SearchIcon
          size={16}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-fg-3"
        />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search order number, customer or product…"
          aria-label="Search orders"
          className="h-10 w-full rounded-xl border border-line bg-surface-2 pl-9 pr-3 text-sm text-fg placeholder:text-fg-3 focus:border-accent focus:outline-none"
        />
      </div>

      {!orders ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-2xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<PackageIcon size={22} />}
          title="No orders match"
          description="Try a different status filter or search term."
        />
      ) : (
        <ul className="space-y-2">
          {filtered.map((order) => {
            const isOpen = expanded === order.id;
            const flowIndex = FLOW.indexOf(order.status);
            const isCancelled = order.status === "cancelled";
            const nextStatus = flowIndex >= 0 && flowIndex < FLOW.length - 1 ? FLOW[flowIndex + 1] : null;

            return (
              <li key={order.id} className="overflow-hidden rounded-2xl border border-line bg-surface">
                <div className="flex flex-wrap items-center gap-3 p-4">
                  <button
                    type="button"
                    onClick={() => setExpanded(isOpen ? null : order.id)}
                    aria-expanded={isOpen}
                    className="min-w-0 flex-1 text-left"
                  >
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span className="font-medium text-fg">{order.number}</span>
                      <OrderStatusPill status={order.status} />
                      {isCancelled && <Badge tone="neutral">Stock returned</Badge>}
                    </div>
                    <p className="mt-1 text-xs text-fg-3">
                      {order.shippingAddress.fullName} ·{" "}
                      {pluralise(
                        order.items.reduce((n, i) => n + i.quantity, 0),
                        "item",
                      )}{" "}
                      · {timeAgo(order.placedAt)}
                    </p>
                  </button>

                  <span className="text-sm font-semibold text-fg tabular-nums">
                    {formatPrice(order.total)}
                  </span>

                  {!isCancelled && nextStatus && (
                    <Button
                      size="sm"
                      disabled={busyId === order.id}
                      onClick={() => advance(order, nextStatus)}
                    >
                      {busyId === order.id
                        ? "Working…"
                        : nextStatus === "shipped"
                          ? "Mark shipped"
                          : nextStatus === "delivered"
                            ? "Mark delivered"
                            : "Start processing"}
                    </Button>
                  )}
                  {!isCancelled && order.status !== "delivered" && (
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={busyId === order.id}
                      onClick={() => setCancelling(order)}
                      className="hover:text-danger"
                    >
                      Cancel
                    </Button>
                  )}
                </div>

                {isOpen && (
                  <div className="border-t border-line bg-surface-2 px-4 py-4">
                    <div className="grid gap-4 sm:grid-cols-[1fr_16rem]">
                      <div>
                        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-fg-3">
                          Items
                        </h3>
                        <ul className="space-y-2">
                          {order.items.map((item) => {
                            const p = allProducts().find((x) => x.id === item.productId);
                            return (
                              <li key={`${item.productId}-${item.variantValue ?? ""}`} className="flex gap-3">
                                <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-surface">
                                  {p ? (
                                    <ProductArt product={p} className="h-full w-full" />
                                  ) : (
                                    <span className="grid h-full w-full place-items-center text-[9px] text-fg-3">
                                      N/A
                                    </span>
                                  )}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-sm text-fg-2">{item.name}</p>
                                  <p className="text-xs text-fg-3">
                                    {item.variantValue ? `${item.variantValue} · ` : ""}
                                    {item.quantity} × {formatPrice(item.unitPrice)}
                                  </p>
                                </div>
                                <span className="text-sm text-fg-2 tabular-nums">
                                  {formatPrice(item.unitPrice * item.quantity)}
                                </span>
                              </li>
                            );
                          })}
                        </ul>

                        <h3 className="mt-4 mb-2 text-xs font-semibold uppercase tracking-wider text-fg-3">
                          Timeline
                        </h3>
                        <ul className="space-y-1.5">
                          {order.events.map((event, i) => (
                            <li key={`${event.status}-${i}`} className="flex gap-2.5 text-sm">
                              <CheckIcon
                                size={13}
                                className={`mt-1 shrink-0 ${
                                  event.status === "cancelled" ? "text-danger" : "text-success"
                                }`}
                              />
                              <span className="text-fg-2">
                                {event.note}{" "}
                                <span className="text-xs text-fg-3">· {formatDate(event.at)}</span>
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="space-y-4">
                        <div className="rounded-xl border border-line bg-surface p-3.5">
                          <h3 className="text-xs font-semibold uppercase tracking-wider text-fg-3">
                            Ship to
                          </h3>
                          <address className="mt-1.5 text-sm not-italic leading-relaxed text-fg-2">
                            {order.shippingAddress.fullName}
                            <br />
                            {order.shippingAddress.line1}
                            {order.shippingAddress.line2 && <>, {order.shippingAddress.line2}</>}
                            <br />
                            {order.shippingAddress.city}, {order.shippingAddress.region}{" "}
                            {order.shippingAddress.postcode}
                            <br />
                            {order.shippingAddress.country}
                          </address>
                        </div>

                        <div className="rounded-xl border border-line bg-surface p-3.5">
                          <h3 className="text-xs font-semibold uppercase tracking-wider text-fg-3">
                            Payment
                          </h3>
                          <p className="mt-1.5 text-sm text-fg-2">
                            {order.paymentBrand} ending {order.paymentLast4}
                          </p>
                          <dl className="mt-2 space-y-1 text-xs">
                            <div className="flex justify-between text-fg-3">
                              <dt>Subtotal</dt>
                              <dd className="tabular-nums">{formatPrice(order.subtotal)}</dd>
                            </div>
                            <div className="flex justify-between text-fg-3">
                              <dt>Shipping</dt>
                              <dd className="tabular-nums">
                                {order.shipping === 0 ? "Free" : formatPrice(order.shipping)}
                              </dd>
                            </div>
                            <div className="flex justify-between text-fg-3">
                              <dt>Tax</dt>
                              <dd className="tabular-nums">{formatPrice(order.tax)}</dd>
                            </div>
                            <div className="flex justify-between border-t border-line pt-1 font-semibold text-fg-2">
                              <dt>Total</dt>
                              <dd className="tabular-nums">{formatPrice(order.total)}</dd>
                            </div>
                          </dl>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {/* Cancel confirmation */}
      <Modal
        open={cancelling !== null}
        onClose={() => setCancelling(null)}
        title="Cancel this order?"
        footer={
          <div className="flex gap-2">
            <Button variant="secondary" className="flex-1" onClick={() => setCancelling(null)}>
              Keep order
            </Button>
            <Button
              variant="danger"
              className="flex-1"
              onClick={async () => {
                if (!cancelling) return;
                await advance(cancelling, "cancelled");
                setCancelling(null);
              }}
            >
              Cancel order
            </Button>
          </div>
        }
      >
        <p className="text-sm text-fg-2">
          Cancelling <strong className="text-fg">{cancelling?.number}</strong> marks the order
          cancelled and returns every unit to stock. This cannot be undone.
        </p>
        <p className="mt-3 flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/10 px-3 py-2.5 text-xs text-warning">
          <TruckIcon size={14} className="mt-0.5 shrink-0" />
          If the order has already shipped, cancel the carrier shipment first.
        </p>
      </Modal>
    </div>
  );
}