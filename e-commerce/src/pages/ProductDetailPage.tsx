import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import type { Product, Review } from "../types";
import {
  fetchProduct,
  fetchRelated,
  fetchReviews,
  mergeHelpfulMarks,
  wasMarkedHelpful,
  markReviewHelpful,
  createReview,
} from "../data/api";
import { LOW_STOCK, priceFor, stockFor, variantLabel } from "../data/catalog";
import { ratingDistribution } from "../data/reviews";
import { formatPrice, percentOff, timeAgo } from "../lib/format";
import { ProductArt } from "../lib/productArt";
import { ProductCard, ProductCardSkeleton } from "../components/ProductCard";
import {
  Badge,
  Breadcrumbs,
  Button,
  LinkButton,
  QtyStepper,
  Rating,
  SectionHeading,
} from "../components/Primitives";
import {
  CheckIcon,
  ChevronRight,
  HeartIcon,
  ReturnIcon,
  ShieldIcon,
  StarIcon,
  TruckIcon,
} from "../components/Icons";
import { useIsComparing, useIsWishlisted, useStore } from "../store/StoreContext";

export function ProductDetailPage() {
  const { slug = "" } = useParams();
  const { addToCart, toggleWishlist, toggleCompare, openCart, notify, pushRecent, state } =
    useStore();

  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [selection, setSelection] = useState<Record<string, string>>({});
  const [quantity, setQuantity] = useState(1);

  const wishlisted = useIsWishlisted(product?.id ?? "");
  const comparing = useIsComparing(product?.id ?? "");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setNotFound(false);
    setQuantity(1);

    fetchProduct(slug).then((p) => {
      if (cancelled) return;
      if (!p) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      setProduct(p);
      pushRecent(p.id);
      setLoading(false);
      // Default to the first in-stock variant in each group so the shopper
      // never lands on a combination that can't be bought.
      const defaults: Record<string, string> = {};
      for (const group of p.variantGroups) {
        const inGroup = p.variants.filter((v) => v.group === group && v.stock > 0);
        const chosen = inGroup[0] ?? p.variants.find((v) => v.group === group);
        if (chosen) defaults[group] = chosen.value;
      }
      setSelection(defaults);
      fetchRelated(p, 4).then((r) => !cancelled && setRelated(r));
    });

    return () => {
      cancelled = true;
    };
    // pushRecent is stable (memoised in the store); excluding it avoids
    // re-fetching the product when the recent list changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, state.catalogVersion]);

  const variantValue = useMemo(() => {
    if (!product) return undefined;
    const values = product.variantGroups.map((g) => selection[g]).filter(Boolean);
    return values.length === product.variantGroups.length ? values.join(" · ") : undefined;
  }, [product, selection]);

  const price = product ? priceFor(product, variantValue) : 0;
  const stock = product ? stockFor(product, variantValue) : 0;

  if (loading) return <ProductSkeleton />;

  if (notFound || !product) {
    return (
      <div className="shell py-20 text-center">
        <h1 className="text-2xl font-semibold text-fg">Product not found</h1>
        <p className="mt-2 text-sm text-fg-3">
          That product isn’t in the catalog. It may have been retired.
        </p>
        <LinkButton to="/products" className="mt-6">
          Back to products
        </LinkButton>
      </div>
    );
  }

  const off = product.compareAt ? percentOff(product.price, product.compareAt) : 0;

  const handleAdd = (thenCheckout: boolean) => {
    if (stock === 0) {
      notify("That option is out of stock", "error");
      return;
    }
    addToCart(product.id, variantValue, quantity);
    if (thenCheckout) openCart();
  };

  return (
    <div className="shell py-8">
      <Breadcrumbs
        items={[
          { label: "Home", to: "/" },
          { label: "Products", to: "/products" },
          { label: product.category, to: `/products?category=${product.category}` },
          { label: product.name },
        ]}
      />

      <div className="mt-6 grid gap-8 lg:grid-cols-2 lg:gap-12">
        {/* Gallery — the same art at two crops gives a sense of scale. */}
        <div className="lg:sticky lg:top-32 lg:self-start">
          <div className="overflow-hidden rounded-3xl border border-line bg-surface">
            <ProductArt product={product} className="aspect-square w-full" />
          </div>
          <div className="mt-3 grid grid-cols-4 gap-3">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className={`overflow-hidden rounded-xl border bg-surface-2 ${
                  i === 0 ? "border-accent" : "border-line"
                }`}
                style={{ transform: `scale(${1 - i * 0.06})` }}
                aria-hidden
              >
                <ProductArt product={product} className="aspect-square w-full" />
              </div>
            ))}
          </div>
        </div>

        {/* Buy box */}
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium uppercase tracking-widest text-fg-3">
              {product.brand}
            </span>
            {product.isNew && <Badge tone="info">New</Badge>}
          </div>

          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-fg sm:text-4xl">
            {product.name}
          </h1>
          <p className="mt-2 text-base text-fg-2">{product.tagline}</p>

          <div className="mt-3">
            <Rating value={product.rating} count={product.reviewCount} size={15} />
          </div>

          <div className="mt-6 flex flex-wrap items-baseline gap-3">
            <span className="text-3xl font-semibold tracking-tight text-fg">
              {formatPrice(price)}
            </span>
            {product.compareAt && (
              <>
                <span className="text-lg text-fg-3 line-through">
                  {formatPrice(product.compareAt)}
                </span>
                {off > 0 && <Badge tone="danger">Save {off}%</Badge>}
              </>
            )}
          </div>
          <p className="mt-1 text-xs text-fg-3">Inclusive of estimated tax at checkout</p>

          {/* Variants */}
          {product.variantGroups.map((group) => {
            const options = product.variants.filter((v) => v.group === group);
            const isColour = options.some((o) => o.hex);
            return (
              <fieldset key={group} className="mt-6">
                <legend className="mb-2 flex w-full items-center justify-between text-sm font-medium text-fg-2">
                  <span>{variantLabel(group)}</span>
                  {selection[group] && (
                    <span className="text-fg-3">{selection[group]}</span>
                  )}
                </legend>
                <div className="flex flex-wrap gap-2">
                  {options.map((o) => {
                    const selected = selection[group] === o.value;
                    const out = o.stock === 0;
                    return (
                      <button
                        key={o.value}
                        type="button"
                        disabled={out}
                        onClick={() =>
                          setSelection((prev) => ({ ...prev, [group]: o.value }))
                        }
                        aria-pressed={selected}
                        className={`relative flex items-center gap-2 rounded-xl border px-3.5 py-2 text-sm transition-colors ${
                          selected
                            ? "border-accent bg-accent/10 text-fg"
                            : "border-line bg-surface-2 text-fg-2 hover:border-line-strong hover:text-fg"
                        } ${out ? "cursor-not-allowed opacity-40" : ""}`}
                      >
                        {isColour && o.hex && (
                          <span
                            className="h-4 w-4 shrink-0 rounded-full border border-line-strong"
                            style={{ background: o.hex }}
                            aria-hidden
                          />
                        )}
                        {o.value}
                        {o.priceDelta ? (
                          <span className="text-xs text-fg-3">
                            {o.priceDelta > 0 ? "+" : ""}
                            {formatPrice(o.priceDelta)}
                          </span>
                        ) : null}
                        {out && <span className="text-xs text-fg-3">Out</span>}
                      </button>
                    );
                  })}
                </div>
              </fieldset>
            );
          })}

          {/* Stock line */}
          <div className="mt-5 flex items-center gap-2 text-sm">
            {stock === 0 ? (
              <Badge tone="danger">Out of stock in this configuration</Badge>
            ) : stock <= LOW_STOCK ? (
              <Badge tone="warning">Only {stock} left</Badge>
            ) : (
              <Badge tone="success">
                <CheckIcon size={12} /> In stock
              </Badge>
            )}
          </div>

          {/* Add to cart */}
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <QtyStepper
              value={quantity}
              onChange={setQuantity}
              max={Math.max(1, stock)}
              min={1}
            />
            <Button
              size="lg"
              disabled={stock === 0}
              onClick={() => handleAdd(false)}
              className="flex-1 min-w-[12rem]"
            >
              {stock === 0 ? "Out of stock" : "Add to cart"}
            </Button>
            <Button
              size="lg"
              variant="secondary"
              disabled={stock === 0}
              onClick={() => handleAdd(true)}
            >
              Buy now
            </Button>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleWishlist(product.id)}
              aria-pressed={wishlisted}
            >
              <HeartIcon size={16} filled={wishlisted} />
              {wishlisted ? "Saved to wishlist" : "Save for later"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleCompare(product.id)}
              aria-pressed={comparing}
            >
              {comparing ? "In compare" : "Add to compare"}
            </Button>
          </div>

          {/* Perks */}
          <ul className="mt-7 grid gap-3 border-t border-line pt-6 sm:grid-cols-3">
            {[
              { Icon: TruckIcon, label: "Free shipping over $150" },
              { Icon: ReturnIcon, label: "30-day free returns" },
              { Icon: ShieldIcon, label: "2-year warranty" },
            ].map(({ Icon, label }) => (
              <li key={label} className="flex items-center gap-2.5 text-sm text-fg-2">
                <Icon size={17} className="shrink-0 text-accent" />
                {label}
              </li>
            ))}
          </ul>

          <p className="mt-6 text-sm leading-relaxed text-fg-2">{product.description}</p>
        </div>
      </div>

      {/* Specs + reviews */}
      <div className="mt-16 grid gap-10 lg:grid-cols-[1fr_1.4fr]">
        <section aria-labelledby="specs-heading">
          <h2 id="specs-heading" className="mb-4 text-xl font-semibold tracking-tight text-fg">
            Specifications
          </h2>
          <div className="space-y-6">
            {product.specs.map((group) => (
              <div key={group.group}>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-fg-3">
                  {group.group}
                </h3>
                <dl className="overflow-hidden rounded-xl border border-line">
                  {group.rows.map((row) => (
                    <div
                      key={row.label}
                      className="flex gap-4 border-b border-line px-4 py-2.5 last:border-b-0"
                    >
                      <dt className="w-2/5 shrink-0 text-sm text-fg-3">{row.label}</dt>
                      <dd className="flex-1 text-sm text-fg">{row.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            ))}
          </div>
        </section>

        <ReviewsSection product={product} />
      </div>

      {related && related.length > 0 && (
        <section className="mt-16">
          <SectionHeading
            eyebrow="You might also like"
            title="Related products"
            action={
              <Link
                to={`/products?category=${product.category}`}
                className="flex items-center gap-1.5 text-sm font-medium text-accent transition-colors hover:text-accent-hover"
              >
                More {product.category}
                <ChevronRight size={15} />
              </Link>
            }
          />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

// ── Reviews ────────────────────────────────────────────────────────────────

function ReviewsSection({ product }: { product: Product }) {
  const { user, notify } = useStore();
  const [reviews, setReviews] = useState<Review[] | null>(null);
  const [filter, setFilter] = useState(0);
  const [writing, setWriting] = useState(false);

  useEffect(() => {
    fetchReviews(product.id).then((r) => setReviews(mergeHelpfulMarks(r)));
  }, [product.id]);

  const distribution = ratingDistribution(product.rating, product.reviewCount);

  const filtered =
    filter === 0 ? (reviews ?? []) : (reviews ?? []).filter((r) => r.rating === filter);

  const shown = filtered.slice(0, 6);

  return (
    <section aria-labelledby="reviews-heading">
      <div className="mb-4 flex items-center justify-between gap-4">
        <h2 id="reviews-heading" className="text-xl font-semibold tracking-tight text-fg">
          Reviews
        </h2>
        <Button
          size="sm"
          variant={writing ? "secondary" : "primary"}
          onClick={() => setWriting((v) => !v)}
        >
          {writing ? "Cancel" : "Write a review"}
        </Button>
      </div>

      {writing && (
        <ReviewForm
          product={product}
          authorName={user?.name ?? "Guest shopper"}
          onDone={(r) => {
            setReviews((prev) => [r, ...(prev ?? [])]);
            setWriting(false);
            notify("Thanks — your review is published");
          }}
        />
      )}

      <div className="mb-5 flex flex-col gap-5 rounded-2xl border border-line bg-surface p-5 sm:flex-row sm:items-center">
        <div className="text-center sm:w-32 sm:shrink-0">
          <p className="text-4xl font-semibold tracking-tight text-fg tabular-nums">
            {product.rating.toFixed(1)}
          </p>
          <Rating value={product.rating} size={14} showValue={false} />
          <p className="mt-1 text-xs text-fg-3">
            {product.reviewCount.toLocaleString()} ratings
          </p>
        </div>

        <div className="flex-1 space-y-1.5">
          {[5, 4, 3, 2, 1].map((star) => {
            const count = distribution[star - 1];
            const pct = product.reviewCount > 0 ? (count / product.reviewCount) * 100 : 0;
            return (
              <button
                key={star}
                type="button"
                onClick={() => setFilter(filter === star ? 0 : star)}
                className="flex w-full items-center gap-2.5 text-left"
              >
                <span className="w-3 shrink-0 text-xs text-fg-2 tabular-nums">{star}</span>
                <StarIcon size={11} filled className="shrink-0 text-warning" />
                <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-3">
                  <span
                    className="block h-full rounded-full bg-warning"
                    style={{ width: `${pct}%` }}
                  />
                </span>
                <span className="w-10 shrink-0 text-right text-xs text-fg-3 tabular-nums">
                  {count.toLocaleString()}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {filter > 0 && (
        <p className="mb-3 flex items-center gap-2 text-sm text-fg-3">
          Showing {filter}-star reviews
          <button
            type="button"
            onClick={() => setFilter(0)}
            className="text-accent underline-offset-2 hover:underline"
          >
            Clear
          </button>
        </p>
      )}

      {!reviews ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-32 animate-pulse rounded-2xl border border-line bg-surface" />
          ))}
        </div>
      ) : shown.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-line px-6 py-10 text-center text-sm text-fg-3">
          No written reviews in this rating yet.
        </p>
      ) : (
        <ul className="space-y-3">
          {shown.map((r) => (
            <ReviewRow key={r.id} review={r} />
          ))}
        </ul>
      )}

      {filtered.length > shown.length && (
        <p className="mt-4 text-center text-sm text-fg-3">
          Showing {shown.length} of {filtered.length} written reviews. The{" "}
          {product.reviewCount.toLocaleString()} total includes ratings without text.
        </p>
      )}
    </section>
  );
}

function ReviewRow({ review }: { review: Review }) {
  const [helpful, setHelpful] = useState(wasMarkedHelpful(review.id));
  const [count, setCount] = useState(review.helpfulCount);

  const onHelpful = async () => {
    if (helpful) return;
    const added = await markReviewHelpful(review.id);
    if (added) {
      setHelpful(true);
      setCount((c) => c + 1);
    }
  };

  return (
    <li className="rounded-2xl border border-line bg-surface p-5">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
        <span
          className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-semibold text-ink"
          style={{ background: `hsl(${(review.author.charCodeAt(0) * 37) % 360} 65% 62%)` }}
          aria-hidden
        >
          {review.author.charAt(0)}
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-fg">{review.author}</p>
          <p className="text-xs text-fg-3">{timeAgo(review.createdAt)}</p>
        </div>
        {review.verifiedPurchase && (
          <Badge tone="success" className="ml-auto">
            <CheckIcon size={11} /> Verified purchase
          </Badge>
        )}
      </div>

      <div className="mt-3">
        <Rating value={review.rating} size={13} showValue={false} />
      </div>

      <h3 className="mt-2 text-sm font-semibold text-fg">{review.title}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-fg-2">{review.body}</p>

      <button
        type="button"
        onClick={onHelpful}
        disabled={helpful}
        className={`mt-3 text-xs transition-colors ${
          helpful ? "text-fg-3" : "text-fg-3 hover:text-fg"
        }`}
      >
        {helpful ? "Marked as helpful" : "Helpful"}{" "}
        {count > 0 && <span className="tabular-nums">({count})</span>}
      </button>
    </li>
  );
}

function ReviewForm({
  product,
  authorName,
  onDone,
}: {
  product: Product;
  authorName: string;
  onDone: (r: Review) => void;
}) {
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim().length < 3) {
      setError("Give your review a short title (at least 3 characters).");
      return;
    }
    if (body.trim().length < 10) {
      setError("Tell us a bit more — at least 10 characters.");
      return;
    }
    setError("");
    setSubmitting(true);
    const review = await createReview({
      productId: product.id,
      author: authorName,
      rating,
      title: title.trim(),
      body: body.trim(),
    });
    setSubmitting(false);
    onDone(review);
  };

  return (
    <form onSubmit={submit} className="mb-6 rounded-2xl border border-line bg-surface p-5">
      <h3 className="text-sm font-semibold text-fg">Review {product.name}</h3>

      <div className="mt-4">
        <span className="mb-1.5 block text-sm font-medium text-fg-2">Your rating</span>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setRating(n)}
              aria-label={`${n} star${n > 1 ? "s" : ""}`}
              aria-pressed={rating === n}
            >
              <StarIcon
                size={26}
                filled={n <= rating}
                className={n <= rating ? "text-warning" : "text-line-strong"}
              />
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4">
        <label htmlFor="review-title" className="mb-1.5 block text-sm font-medium text-fg-2">
          Title
        </label>
        <input
          id="review-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Sum it up in a few words"
          maxLength={80}
          className="h-11 w-full rounded-xl border border-line bg-surface-2 px-3.5 text-sm text-fg placeholder:text-fg-3 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
        />
      </div>

      <div className="mt-4">
        <label htmlFor="review-body" className="mb-1.5 block text-sm font-medium text-fg-2">
          Your review
        </label>
        <textarea
          id="review-body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={4}
          placeholder="What did you like or dislike? How did you use it?"
          maxLength={1200}
          className="w-full rounded-xl border border-line bg-surface-2 px-3.5 py-2.5 text-sm text-fg placeholder:text-fg-3 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
        />
      </div>

      {error && <p className="mt-3 text-sm text-danger">{error}</p>}

      <div className="mt-4 flex items-center gap-3">
        <Button type="submit" disabled={submitting}>
          {submitting ? "Publishing…" : "Publish review"}
        </Button>
        <span className="text-xs text-fg-3">Posting as {authorName}</span>
      </div>
    </form>
  );
}

function ProductSkeleton() {
  return (
    <div className="shell py-8">
      <div className="mb-6 h-4 w-48 animate-pulse rounded bg-surface-3" />
      <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
        <div className="aspect-square animate-pulse rounded-3xl bg-surface-3" />
        <div className="space-y-4">
          <div className="h-3 w-16 animate-pulse rounded bg-surface-3" />
          <div className="h-9 w-3/4 animate-pulse rounded bg-surface-3" />
          <div className="h-4 w-1/2 animate-pulse rounded bg-surface-3" />
          <div className="h-10 w-28 animate-pulse rounded bg-surface-3" />
          <div className="flex gap-2">
            <div className="h-10 w-24 animate-pulse rounded-xl bg-surface-3" />
            <div className="h-10 w-28 animate-pulse rounded-xl bg-surface-3" />
          </div>
        </div>
      </div>
      <div className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}