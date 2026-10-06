import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { Product } from "../types";
import { CATEGORIES, categoryCount } from "../data/catalog";
import { fetchDeals, fetchFeatured, fetchNewArrivals } from "../data/api";
import { formatPrice, percentOff } from "../lib/format";
import { ProductArt } from "../lib/productArt";
import { ProductCard, ProductCardSkeleton } from "../components/ProductCard";
import {
  Badge,
  LinkButton,
  SectionHeading,
  Skeleton,
} from "../components/Primitives";
import { ArrowRightIcon, BoxIcon, ShieldIcon, TruckIcon } from "../components/Icons";

/** Hero — the single largest visual statement on the page. */
function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-line">
      {/* Ambient gradient wash */}
      <div
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          background:
            "radial-gradient(70% 55% at 15% 0%, rgba(109,124,255,0.22), transparent 70%), radial-gradient(55% 50% at 90% 20%, rgba(55,226,214,0.14), transparent 70%)",
        }}
        aria-hidden
      />
      <div className="shell relative py-16 sm:py-24">
        <div className="max-w-2xl">
          <Badge tone="accent" className="mb-5">
            New season · 2026 collection
          </Badge>
          <h1 className="text-4xl font-semibold leading-[1.08] tracking-tight text-fg sm:text-5xl lg:text-6xl">
            Electronics worth{" "}
            <span className="bg-gradient-to-r from-accent to-secondary bg-clip-text text-transparent">
              reading the spec sheet
            </span>{" "}
            for.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-fg-2 sm:text-lg">
            Laptops, phones, audio, cameras and wearables — chosen for build quality and honest
            specifications, with free shipping over $150 and a 30-day return window.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <LinkButton to="/products" size="lg">
              Shop all products
              <ArrowRightIcon size={18} />
            </LinkButton>
            <LinkButton to="/products?onSale=1" size="lg" variant="secondary">
              View this week’s deals
            </LinkButton>
          </div>
        </div>

        <dl className="mt-12 grid max-w-2xl grid-cols-3 gap-4 border-t border-line pt-8">
          {[
            { value: "24", label: "Products in stock" },
            { value: "6", label: "Categories" },
            { value: "30", label: "Day returns" },
          ].map((stat) => (
            <div key={stat.label}>
              <dt className="sr-only">{stat.label}</dt>
              <dd className="text-2xl font-semibold tracking-tight text-fg tabular-nums sm:text-3xl">
                {stat.value}
              </dd>
              <p className="mt-1 text-xs text-fg-3 sm:text-sm">{stat.label}</p>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

function CategoryTiles() {
  return (
    <section className="shell py-14">
      <SectionHeading
        eyebrow="Browse"
        title="Shop by category"
        action={
          <Link
            to="/products"
            className="flex items-center gap-1.5 text-sm font-medium text-accent transition-colors hover:text-accent-hover"
          >
            All products
            <ArrowRightIcon size={15} />
          </Link>
        }
      />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {CATEGORIES.map((c) => (
          <Link
            key={c.slug}
            to={`/products?category=${c.slug}`}
            className="group relative overflow-hidden rounded-2xl border border-line bg-surface p-4 transition-colors hover:border-line-strong"
          >
            <div className="mb-3 h-20 w-full overflow-hidden rounded-xl bg-surface-2" aria-hidden>
              <CategoryGlyph category={c.slug} />
            </div>
            <p className="text-sm font-semibold text-fg">{c.name}</p>
            <p className="mt-0.5 line-clamp-2 text-xs text-fg-3">{c.tagline}</p>
            <p className="mt-2 text-xs font-medium text-accent tabular-nums">
              {categoryCount(c.slug)} products
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}

/** Small silhouette per category, reusing the product-art palette language. */
function CategoryGlyph({ category }: { category: string }) {
  const common = { fill: "none", stroke: "currentColor", strokeWidth: 1.5 } as const;
  return (
    <svg viewBox="0 0 100 80" className="h-full w-full p-3 text-fg-3" aria-hidden>
      {category === "laptops" && (
        <>
          <rect x="22" y="16" width="56" height="36" rx="3" {...common} />
          <path d="M14 58h72l-4 6H18l-4-6Z" {...common} />
        </>
      )}
      {category === "phones" && (
        <>
          <rect x="36" y="10" width="28" height="58" rx="5" {...common} />
          <path d="M45 17h10" {...common} />
        </>
      )}
      {category === "audio" && (
        <>
          <path d="M26 44V34a24 24 0 0 1 48 0v10" {...common} />
          <rect x="18" y="42" width="14" height="26" rx="6" {...common} />
          <rect x="68" y="42" width="14" height="26" rx="6" {...common} />
        </>
      )}
      {category === "cameras" && (
        <>
          <rect x="16" y="28" width="68" height="36" rx="5" {...common} />
          <circle cx="50" cy="46" r="12" {...common} />
          <path d="M36 28l3-6h14l3 6" {...common} />
        </>
      )}
      {category === "wearables" && (
        <>
          <rect x="38" y="10" width="24" height="16" rx="4" {...common} />
          <rect x="32" y="26" width="36" height="32" rx="8" {...common} />
          <rect x="38" y="58" width="24" height="14" rx="4" {...common} />
        </>
      )}
      {category === "accessories" && (
        <>
          <rect x="12" y="28" width="76" height="34" rx="4" {...common} />
          <path d="M22 38h8M38 38h8M54 38h8M70 38h8M22 48h8M38 48h8M54 48h8M70 48h8" {...common} />
        </>
      )}
    </svg>
  );
}

function Deals() {
  const [deals, setDeals] = useState<Product[] | null>(null);

  useEffect(() => {
    fetchDeals(4).then(setDeals);
  }, []);

  if (!deals) {
    return (
      <section className="shell pb-14">
        <SectionHeading title="This week’s deals" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="shell pb-14">
      <SectionHeading
        eyebrow="Reduced"
        title="This week’s deals"
        action={
          <Link
            to="/products?onSale=1"
            className="flex items-center gap-1.5 text-sm font-medium text-accent transition-colors hover:text-accent-hover"
          >
            All deals
            <ArrowRightIcon size={15} />
          </Link>
        }
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {deals.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  );
}

function Featured() {
  const [items, setItems] = useState<Product[] | null>(null);

  useEffect(() => {
    fetchFeatured(6).then(setItems);
  }, []);

  return (
    <section className="border-y border-line bg-surface/40 py-14">
      <div className="shell">
        <SectionHeading
          eyebrow="Picks"
          title="Featured this month"
          action={
            <Link
              to="/products?sort=rating"
              className="flex items-center gap-1.5 text-sm font-medium text-accent transition-colors hover:text-accent-hover"
            >
              Top rated
              <ArrowRightIcon size={15} />
            </Link>
          }
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {!items
            ? Array.from({ length: 6 }).map((_, i) => <ProductCardSkeleton key={i} />)
            : items.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      </div>
    </section>
  );
}

function NewArrivals() {
  const [items, setItems] = useState<Product[] | null>(null);

  useEffect(() => {
    fetchNewArrivals(4).then(setItems);
  }, []);

  return (
    <section className="shell py-14">
      <SectionHeading
        eyebrow="Just landed"
        title="New arrivals"
        action={
          <Link
            to="/products?sort=newest"
            className="flex items-center gap-1.5 text-sm font-medium text-accent transition-colors hover:text-accent-hover"
          >
            See everything new
            <ArrowRightIcon size={15} />
          </Link>
        }
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {!items
          ? Array.from({ length: 4 }).map((_, i) => <ProductCardSkeleton key={i} />)
          : items.map((p) => <ProductCard key={p.id} product={p} />)}
      </div>
    </section>
  );
}

/** A hand-picked hero card that breaks up the regular grid rhythm. */
function Spotlight() {
  const [product, setProduct] = useState<Product | null>(null);

  useEffect(() => {
    fetchNewArrivals(8).then((items) => setProduct(items[0] ?? null));
  }, []);

  if (!product) {
    return (
      <section className="shell pb-14">
        <Skeleton className="h-64 w-full rounded-2xl" />
      </section>
    );
  }

  const off = product.compareAt ? percentOff(product.price, product.compareAt) : 0;

  return (
    <section className="shell pb-14">
      <div className="relative overflow-hidden rounded-3xl border border-line bg-surface">
        <div className="grid items-center gap-8 p-6 sm:p-10 lg:grid-cols-2">
          <div>
            <Badge tone="info" className="mb-4">
              {product.badges[0] ?? "Featured"}
            </Badge>
            <p className="text-xs font-medium uppercase tracking-widest text-fg-3">
              {product.brand}
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-fg sm:text-3xl">
              {product.name}
            </h2>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-fg-2">{product.description}</p>

            <div className="mt-6 flex items-baseline gap-3">
              <span className="text-3xl font-semibold tracking-tight text-fg">
                {formatPrice(product.price)}
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

            <div className="mt-6">
              <LinkButton to={`/products/${product.slug}`} size="lg">
                View product
                <ArrowRightIcon size={18} />
              </LinkButton>
            </div>
          </div>

          <Link
            to={`/products/${product.slug}`}
            className="relative mx-auto aspect-square w-full max-w-sm overflow-hidden rounded-2xl bg-surface-2"
          >
            <ProductArt product={product} className="h-full w-full" />
          </Link>
        </div>
      </div>
    </section>
  );
}

function PromiseStrip() {
  const items = [
    { Icon: TruckIcon, title: "Free shipping over $150", body: "Same-day dispatch before 4pm" },
    { Icon: BoxIcon, title: "30-day returns", body: "Prepaid label in every box" },
    { Icon: ShieldIcon, title: "2-year warranty", body: "Manufacturing faults covered" },
  ];
  return (
    <section className="border-t border-line bg-surface/40 py-10">
      <div className="shell grid gap-6 sm:grid-cols-3">
        {items.map(({ Icon, title, body }) => (
          <div key={title} className="flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent/10 text-accent">
              <Icon size={20} />
            </span>
            <div>
              <p className="text-sm font-medium text-fg">{title}</p>
              <p className="mt-0.5 text-xs text-fg-3">{body}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function HomePage() {
  return (
    <>
      <Hero />
      <CategoryTiles />
      <Deals />
      <Featured />
      <Spotlight />
      <NewArrivals />
      <PromiseStrip />
    </>
  );
}