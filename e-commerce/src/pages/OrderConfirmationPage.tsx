import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import type { Order } from "../types";
import { allProducts, fetchOrder } from "../data/api";
import { formatDate, formatPrice } from "../lib/format";
import { ProductArt } from "../lib/productArt";
import { Badge, Breadcrumbs, LinkButton, Skeleton } from "../components/Primitives";
import { CheckIcon, ChevronRight, PackageIcon, TruckIcon } from "../components/Icons";

export function OrderConfirmationPage() {
  const { id = "" } = useParams();
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
      <div className="shell-narrow py-12">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="mt-6 h-40 w-full rounded-2xl" />
        <Skeleton className="mt-4 h-40 w-full rounded-2xl" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="shell-narrow py-20 text-center">
        <h1 className="text-2xl font-semibold text-fg">Order not found</h1>
        <p className="mt-2 text-sm text-fg-3">
          We couldn’t find an order with the reference{" "}
          <span className="text-fg-2">{id}</span>.
        </p>
        <LinkButton to="/account/orders" className="mt-6">
          View your orders
        </LinkButton>
      </div>
    );
  }

  const eta = new Date(new Date(order.placedAt).getTime() + 4 * 86_400_000);

  return (
    <div className="shell-narrow py-10">
      <Breadcrumbs
        items={[
          { label: "Home", to: "/" },
          { label: "Orders", to: "/account/orders" },
          { label: order.number },
        ]}
      />

      <div className="mt-6 flex flex-col items-center text-center">
        <span className="grid h-14 w-14 place-items-center rounded-full bg-success/15 text-success">
          <CheckIcon size={28} />
        </span>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight text-fg sm:text-3xl">
          Thank you — your order is confirmed
        </h1>
        <p className="mt-2 text-sm text-fg-3">
          Order <span className="font-medium text-fg-2">{order.number}</span> placed on{" "}
          {formatDate(order.placedAt)}. A confirmation has been sent to your email.
        </p>
      </div>

      <div className="mt-8 overflow-hidden rounded-2xl border border-line bg-surface">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-fg-3">
              Estimated delivery
            </p>
            <p className="mt-1 flex items-center gap-2 text-sm font-medium text-fg">
              <TruckIcon size={16} className="text-accent" />
              {formatDate(eta.toISOString())} – {formatDate(
                new Date(eta.getTime() + 3 * 86_400_000).toISOString(),
              )}
            </p>
          </div>
          <Badge tone="info" className="capitalize">
            {order.status}
          </Badge>
        </div>

        <ul className="divide-y divide-line">
          {order.items.map((item) => {
            // Orders keep a snapshot of the name and price, but the art is
            // derived from the live catalog entry. A retired product falls
            // back to a neutral tile.
            const product = allProducts().find((p) => p.id === item.productId);
            return (
            <li key={`${item.productId}-${item.variantValue ?? ""}`} className="flex gap-4 p-4">
              <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-surface-2">
                {product ? (
                  <ProductArt product={product} className="h-full w-full" />
                ) : (
                  <span className="grid h-full w-full place-items-center text-[10px] text-fg-3">
                    N/A
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-fg">{item.name}</p>
                <p className="text-xs text-fg-3">
                  {item.variantValue ? `${item.variantValue} · ` : ""}Qty {item.quantity}
                </p>
                <p className="mt-1 text-sm text-fg-2 tabular-nums">
                  {formatPrice(item.unitPrice)} × {item.quantity}
                </p>
              </div>
              <span className="shrink-0 text-sm font-semibold text-fg tabular-nums">
                {formatPrice(item.unitPrice * item.quantity)}
              </span>
            </li>
            );
          })}
        </ul>

        <dl className="space-y-2 border-t border-line px-5 py-4 text-sm">
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
          <div className="flex justify-between border-t border-line pt-2.5 text-base font-semibold text-fg">
            <dt>Total paid</dt>
            <dd className="tabular-nums">{formatPrice(order.total)}</dd>
          </div>
        </dl>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-line bg-surface p-5">
          <h2 className="text-sm font-semibold text-fg">Shipping to</h2>
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
          <h2 className="text-sm font-semibold text-fg">Payment</h2>
          <p className="mt-2 text-sm text-fg-2">
            {order.paymentBrand} ending {order.paymentLast4}
          </p>
          <p className="mt-1 text-xs text-fg-3">
            Demonstration order — no payment was processed.
          </p>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <LinkButton to="/account/orders" size="lg">
          <PackageIcon size={18} />
          Track this order
        </LinkButton>
        <LinkButton to="/products" size="lg" variant="secondary">
          Continue shopping
          <ChevronRight size={18} />
        </LinkButton>
      </div>

      <p className="mt-6 text-center text-xs text-fg-3">
        Questions about this order?{" "}
        <Link to="/products" className="text-accent underline-offset-2 hover:underline">
          Contact support
        </Link>
      </p>
    </div>
  );
}