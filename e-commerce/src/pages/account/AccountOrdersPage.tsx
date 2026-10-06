import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import type { Order, OrderStatus } from "../../types";
import { allProducts, fetchOrder, fetchOrders } from "../../data/api";
import { formatDate, formatDateTime, formatPrice, pluralise } from "../../lib/format";
import { useStore } from "../../store/StoreContext";
import { ProductArt } from "../../lib/productArt";
import {
  Badge,
  EmptyState,
  LinkButton,
  Select,
  Skeleton,
} from "../../components/Primitives";
import {
  CheckIcon,
  ChevronRight,
  PackageIcon,
  ReturnIcon,
  TruckIcon,
} from "../../components/Icons";

const STATUS_TONE: Record<OrderStatus, "neutral" | "info" | "success" | "danger" | "warning"> = {
  placed: "neutral",
  processing: "info",
  shipped: "info",
  delivered: "success",
  cancelled: "danger",
};

export function OrderStatusPill({ status }: { status: OrderStatus }) {
  return (
    <Badge tone={STATUS_TONE[status]} className="shrink-0 capitalize">
      {status}
    </Badge>
  );
}

export function AccountOrdersPage() {
  const { user } = useStore();
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    if (!user) return;
    fetchOrders(user.id).then(setOrders);
  }, [user]);

  const filtered = useMemo(() => {
    if (!orders) return [];
    if (filter === "all") return orders;
    if (filter === "active") {
      return orders.filter((o) => o.status !== "delivered" && o.status !== "cancelled");
    }
    return orders.filter((o) => o.status === filter);
  }, [orders, filter]);

  if (!user) return null;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold tracking-tight text-fg">Your orders</h2>
        <Select
          value={filter}
          onChange={setFilter}
          className="w-40"
          id="order-filter"
        >
          <option value="all">All orders</option>
          <option value="active">Active</option>
          <option value="placed">Placed</option>
          <option value="processing">Processing</option>
          <option value="shipped">Shipped</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
        </Select>
      </div>

      {!orders ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-2xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<PackageIcon size={22} />}
          title={orders.length === 0 ? "No orders yet" : "No orders match this filter"}
          description={
            orders.length === 0
              ? "Your order history will appear here."
              : "Try a different status filter to see more."
          }
          action={orders.length === 0 ? <LinkButton to="/products">Start shopping</LinkButton> : undefined}
        />
      ) : (
        <ul className="space-y-3">
          {filtered.map((order) => (
            <li key={order.id}>
              <Link
                to={`/account/orders/${order.id}`}
                className="block rounded-2xl border border-line bg-surface p-5 transition-colors hover:border-line-strong"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-fg">{order.number}</p>
                    <p className="text-xs text-fg-3">
                      Placed {formatDate(order.placedAt)} ·{" "}
                      {pluralise(
                        order.items.reduce((n, i) => n + i.quantity, 0),
                        "item",
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <OrderStatusPill status={order.status} />
                    <span className="font-semibold text-fg tabular-nums">
                      {formatPrice(order.total)}
                    </span>
                    <ChevronRight size={16} className="text-fg-3" />
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {order.items.map((item) => {
                    const p = allProducts().find((x) => x.id === item.productId);
                    return p ? (
                      <div
                        key={`${item.productId}-${item.variantValue ?? ""}`}
                        className="h-10 w-10 overflow-hidden rounded-lg bg-surface-2"
                        title={item.name}
                      >
                        <ProductArt product={p} className="h-full w-full" />
                      </div>
                    ) : null;
                  })}
                  <span className="text-xs text-fg-3">
                    {order.items.map((i) => i.name).join(", ")}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function AccountOrderDetailPage() {
  const { id = "" } = useParams();
  const { user } = useStore();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrder(id).then((o) => {
      setOrder(o ?? null);
      setLoading(false);
    });
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-40 w-full rounded-2xl" />
      </div>
    );
  }

  if (!order) {
    return (
      <EmptyState
        icon={<PackageIcon size={22} />}
        title="Order not found"
        description={`No order matched “${id}”.`}
        action={<LinkButton to="/account/orders">Back to orders</LinkButton>}
      />
    );
  }

  // A guest who signs in later can still see an order placed as "guest" only
  // through the confirmation link, so scope this view to the signed-in owner.
  if (user && order.userId !== user.id) {
    return (
      <EmptyState
        icon={<PackageIcon size={22} />}
        title="That order belongs to another account"
        description="Sign in with the account that placed it to view the details."
        action={<LinkButton to="/account/orders">Back to your orders</LinkButton>}
      />
    );
  }

  const timelineSteps = [
    { status: "placed" as const, label: "Order placed", Icon: CheckIcon },
    { status: "processing" as const, label: "Processing", Icon: PackageIcon },
    { status: "shipped" as const, label: "Shipped", Icon: TruckIcon },
    { status: "delivered" as const, label: "Delivered", Icon: CheckIcon },
  ];

  const orderIndex = timelineSteps.findIndex((s) => s.status === order.status);
  const cancelled = order.status === "cancelled";

  const eventFor = (status: OrderStatus) => order.events.find((e) => e.status === status);

  return (
    <div>
      <Link
        to="/account/orders"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-fg-3 transition-colors hover:text-fg"
      >
        <ChevronRight size={15} className="rotate-180" /> All orders
      </Link>

      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-fg">{order.number}</h2>
          <p className="text-sm text-fg-3">Placed {formatDateTime(order.placedAt)}</p>
        </div>
        <OrderStatusPill status={order.status} />
      </div>

      {/* Status timeline */}
      {cancelled ? (
        <div className="mb-6 rounded-2xl border border-danger/30 bg-danger/10 p-5">
          <p className="flex items-center gap-2 font-medium text-danger">
            <ReturnIcon size={17} />
            This order was cancelled
          </p>
          <p className="mt-1.5 text-sm text-fg-2">
            {eventFor("cancelled")?.note ?? "A refund was issued to your original payment method."}
          </p>
          {eventFor("cancelled") && (
            <p className="mt-1 text-xs text-fg-3">
              {formatDateTime(eventFor("cancelled")!.at)}
            </p>
          )}
        </div>
      ) : (
        <div className="mb-6 rounded-2xl border border-line bg-surface p-5">
          <ol className="flex items-start">
            {timelineSteps.map((step, i) => {
              const reached = i <= orderIndex;
              const event = eventFor(step.status);
              return (
                <li key={step.status} className="flex flex-1 flex-col items-center text-center">
                  <div className="flex w-full items-center">
                    <span
                      className={`h-0.5 flex-1 ${i === 0 ? "bg-transparent" : reached ? "bg-accent" : "bg-line"}`}
                      aria-hidden
                    />
                    <span
                      className={`grid h-8 w-8 shrink-0 place-items-center rounded-full border-2 transition-colors ${
                        reached
                          ? "border-accent bg-accent text-ink"
                          : "border-line bg-surface-2 text-fg-3"
                      }`}
                    >
                      <step.Icon size={14} />
                    </span>
                    <span
                      className={`h-0.5 flex-1 ${
                        i === timelineSteps.length - 1
                          ? "bg-transparent"
                          : i < orderIndex
                            ? "bg-accent"
                            : "bg-line"
                      }`}
                      aria-hidden
                    />
                  </div>
                  <p
                    className={`mt-2 text-xs font-medium ${reached ? "text-fg" : "text-fg-3"}`}
                  >
                    {step.label}
                  </p>
                  {event && (
                    <p className="mt-0.5 hidden text-[11px] text-fg-3 sm:block">
                      {formatDate(event.at)}
                    </p>
                  )}
                </li>
              );
            })}
          </ol>

          {eventFor(order.status) && (
            <p className="mt-4 border-t border-line pt-3 text-sm text-fg-2">
              {eventFor(order.status)!.note}
            </p>
          )}
        </div>
      )}

      {/* Items */}
      <div className="overflow-hidden rounded-2xl border border-line bg-surface">
        <h3 className="border-b border-line px-5 py-3.5 text-sm font-semibold text-fg">
          Items in this order
        </h3>
        <ul className="divide-y divide-line">
          {order.items.map((item) => {
            const p = allProducts().find((x) => x.id === item.productId);
            return (
              <li key={`${item.productId}-${item.variantValue ?? ""}`} className="flex gap-4 p-4">
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-surface-2">
                  {p ? (
                    <ProductArt product={p} className="h-full w-full" />
                  ) : (
                    <span className="grid h-full w-full place-items-center text-[10px] text-fg-3">
                      N/A
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-fg">{item.name}</p>
                  <p className="text-xs text-fg-3">
                    {item.variantValue ? `${item.variantValue} · ` : ""}Qty {item.quantity} ·{" "}
                    {formatPrice(item.unitPrice)} each
                  </p>
                </div>
                <span className="shrink-0 text-sm font-semibold text-fg tabular-nums">
                  {formatPrice(item.unitPrice * item.quantity)}
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-line bg-surface p-5">
          <h3 className="text-sm font-semibold text-fg">Shipping address</h3>
          <address className="mt-2 text-sm not-italic leading-relaxed text-fg-2">
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

        <div className="rounded-2xl border border-line bg-surface p-5">
          <h3 className="text-sm font-semibold text-fg">Payment summary</h3>
          <dl className="mt-2 space-y-1.5 text-sm">
            <div className="flex justify-between text-fg-2">
              <dt>Subtotal</dt>
              <dd className="tabular-nums">{formatPrice(order.subtotal)}</dd>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-success">
                <dt>Discount</dt>
                <dd className="tabular-nums">−{formatPrice(order.discount)}</dd>
              </div>
            )}
            <div className="flex justify-between text-fg-2">
              <dt>Shipping</dt>
              <dd className="tabular-nums">
                {order.shipping === 0 ? "Free" : formatPrice(order.shipping)}
              </dd>
            </div>
            <div className="flex justify-between text-fg-2">
              <dt>Tax</dt>
              <dd className="tabular-nums">{formatPrice(order.tax)}</dd>
            </div>
            <div className="flex justify-between border-t border-line pt-2 font-semibold text-fg">
              <dt>Total</dt>
              <dd className="tabular-nums">{formatPrice(order.total)}</dd>
            </div>
          </dl>
          <p className="mt-3 text-xs text-fg-3">
            {order.paymentBrand} ending {order.paymentLast4}
          </p>
        </div>
      </div>

      {/* Full event log */}
      <div className="mt-4 rounded-2xl border border-line bg-surface p-5">
        <h3 className="text-sm font-semibold text-fg">Order history</h3>
        <ul className="mt-3 space-y-3">
          {order.events.map((event, i) => (
            <li key={`${event.status}-${i}`} className="flex gap-3">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" aria-hidden />
              <div>
                <p className="text-sm text-fg-2">{event.note}</p>
                <p className="text-xs text-fg-3">{formatDateTime(event.at)}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}