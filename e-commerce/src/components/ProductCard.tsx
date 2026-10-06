import { Link } from "react-router-dom";
import type { Product } from "../types";
import { formatPrice, percentOff } from "../lib/format";
import { ProductArt } from "../lib/productArt";
import { totalStock } from "../data/catalog";
import { Badge, Rating } from "./Primitives";
import { CompareIcon, HeartIcon } from "./Icons";
import { useIsComparing, useIsWishlisted, useStore } from "../store/StoreContext";

function StockPill({ product }: { product: Product }) {
  const stock = totalStock(product);
  if (stock === 0) return <Badge tone="danger">Out of stock</Badge>;
  if (stock <= 10) return <Badge tone="warning">Only {stock} left</Badge>;
  return <Badge tone="success">In stock</Badge>;
}

interface ProductCardProps {
  product: Product;
  /** Renders a wide row instead of a grid tile — used by the list view. */
  layout?: "grid" | "list";
}

export function ProductCard({ product, layout = "grid" }: ProductCardProps) {
  const { toggleWishlist, toggleCompare } = useStore();
  const wishlisted = useIsWishlisted(product.id);
  const comparing = useIsComparing(product.id);

  const off = product.compareAt ? percentOff(product.price, product.compareAt) : 0;

  const art = (
    <div className="relative overflow-hidden bg-surface-2">
      <div className="aspect-square transition-transform duration-500 ease-out group-hover:scale-[1.04]">
        <ProductArt product={product} className="h-full w-full" />
      </div>

      <div className="pointer-events-none absolute left-3 top-3 flex flex-col items-start gap-1.5">
        {off > 0 && <Badge tone="danger">−{off}%</Badge>}
        {product.isNew && <Badge tone="info">New</Badge>}
      </div>

      <div className="absolute right-3 top-3 flex flex-col gap-2">
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            toggleWishlist(product.id);
          }}
          aria-label={wishlisted ? `Remove ${product.name} from wishlist` : `Save ${product.name} to wishlist`}
          aria-pressed={wishlisted}
          className={`grid h-9 w-9 place-items-center rounded-lg border backdrop-blur transition-colors ${
            wishlisted
              ? "border-danger/40 bg-danger/20 text-danger"
              : "border-line bg-ink/60 text-fg-2 hover:border-line-strong hover:text-fg"
          }`}
        >
          <HeartIcon size={16} filled={wishlisted} />
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            toggleCompare(product.id);
          }}
          aria-label={comparing ? `Remove ${product.name} from compare` : `Compare ${product.name}`}
          aria-pressed={comparing}
          className={`grid h-9 w-9 place-items-center rounded-lg border backdrop-blur transition-colors ${
            comparing
              ? "border-accent/50 bg-accent/25 text-accent"
              : "border-line bg-ink/60 text-fg-2 hover:border-line-strong hover:text-fg"
          }`}
        >
          <CompareIcon size={16} />
        </button>
      </div>

      {totalStock(product) === 0 && (
        <div className="absolute inset-0 grid place-items-center bg-ink/65 backdrop-blur-[1px]">
          <span className="rounded-full border border-line bg-surface px-3.5 py-1.5 text-xs font-medium text-fg-2">
            Out of stock
          </span>
        </div>
      )}
    </div>
  );

  const meta = (
    <div className="flex flex-1 flex-col p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium uppercase tracking-wider text-fg-3">
          {product.brand}
        </span>
        <StockPill product={product} />
      </div>

      <h3 className="mt-1.5 line-clamp-2 text-sm font-semibold leading-snug text-fg">
        <Link to={`/products/${product.slug}`} className="after:absolute after:inset-0">
          {product.name}
        </Link>
      </h3>

      <p className="mt-1 line-clamp-1 text-xs text-fg-3">{product.tagline}</p>

      <div className="mt-2.5">
        <Rating value={product.rating} count={product.reviewCount} size={13} />
      </div>

      <div className="mt-auto pt-3">
        <div className="flex items-baseline gap-2">
          <span className="text-lg font-semibold tracking-tight text-fg">
            {formatPrice(product.price)}
          </span>
          {product.compareAt && (
            <span className="text-sm text-fg-3 line-through">{formatPrice(product.compareAt)}</span>
          )}
        </div>
        {product.variantGroups.length > 0 && (
          <p className="mt-1 text-xs text-fg-3">
            {product.variantGroups.length} option{product.variantGroups.length > 1 ? "s" : ""} available
          </p>
        )}
      </div>
    </div>
  );

  if (layout === "list") {
    return (
      <article className="group relative flex gap-4 rounded-2xl border border-line bg-surface p-3 transition-colors hover:border-line-strong sm:gap-5 sm:p-4">
        <Link to={`/products/${product.slug}`} className="w-28 shrink-0 sm:w-44">
          {art}
        </Link>
        <div className="flex flex-1 flex-col">{meta}</div>
      </article>
    );
  }

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl border border-line bg-surface transition-colors hover:border-line-strong">
      <Link to={`/products/${product.slug}`}>{art}</Link>
      {meta}
    </article>
  );
}

export function ProductCardSkeleton({ layout = "grid" }: { layout?: "grid" | "list" }) {
  if (layout === "list") {
    return (
      <div className="flex gap-4 rounded-2xl border border-line bg-surface p-3 sm:gap-5 sm:p-4">
        <div className="w-28 shrink-0 animate-pulse rounded-xl bg-surface-3 sm:w-44" style={{ aspectRatio: "1 / 1" }} />
        <div className="flex flex-1 flex-col gap-3 py-1">
          <div className="h-3 w-16 animate-pulse rounded bg-surface-3" />
          <div className="h-4 w-3/4 animate-pulse rounded bg-surface-3" />
          <div className="h-3 w-1/2 animate-pulse rounded bg-surface-3" />
          <div className="h-3 w-24 animate-pulse rounded bg-surface-3" />
          <div className="mt-auto h-5 w-20 animate-pulse rounded bg-surface-3" />
        </div>
      </div>
    );
  }
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-line bg-surface">
      <div className="aspect-square animate-pulse bg-surface-3" />
      <div className="flex flex-col gap-3 p-4">
        <div className="h-3 w-14 animate-pulse rounded bg-surface-3" />
        <div className="h-4 w-4/5 animate-pulse rounded bg-surface-3" />
        <div className="h-3 w-1/2 animate-pulse rounded bg-surface-3" />
        <div className="h-5 w-24 animate-pulse rounded bg-surface-3" />
      </div>
    </div>
  );
}