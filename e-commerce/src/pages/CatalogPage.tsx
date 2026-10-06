import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import type { Category, Product, ProductQuery, SortKey } from "../types";
import { BRANDS, CATEGORIES, PRICE_BOUNDS } from "../data/catalog";
import { listProducts } from "../data/api";
import { formatPrice } from "../lib/format";
import { ProductCard, ProductCardSkeleton } from "../components/ProductCard";
import {
  Badge,
  Breadcrumbs,
  Button,
  Checkbox,
  EmptyState,
  Pagination,
  Select,
  Toggle,
} from "../components/Primitives";
import { CloseIcon, GridIcon, ListIcon, SearchIcon } from "../components/Icons";
import { useStore } from "../store/StoreContext";

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "featured", label: "Featured" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
  { value: "rating", label: "Top rated" },
  { value: "newest", label: "Newest first" },
  { value: "name", label: "Name A–Z" },
];

const PER_PAGE = 12;

/** Reads a repeated or comma-joined query param into a string array. */
function paramList(params: URLSearchParams, key: string): string[] {
  return params.getAll(key).flatMap((v) => v.split(",")).filter(Boolean);
}

/** Serialises filter state into the URL so results are shareable and back works. */
function writeFilters(
  params: URLSearchParams,
  patch: Partial<{
    q: string;
    categories: Category[];
    brands: string[];
    minPrice: number;
    maxPrice: number;
    minRating: number;
    inStockOnly: boolean;
    onSaleOnly: boolean;
    sort: SortKey;
    page: number;
  }>,
) {
  const next = new URLSearchParams(params);
  const setList = (key: string, values: string[]) => {
    next.delete(key);
    if (values.length > 0) next.set(key, values.join(","));
  };

  if (patch.q !== undefined) {
    if (patch.q) next.set("q", patch.q);
    else next.delete("q");
  }
  if (patch.categories) setList("category", patch.categories);
  if (patch.brands) setList("brand", patch.brands);
  if (patch.minPrice !== undefined) next.set("min", String(patch.minPrice));
  if (patch.maxPrice !== undefined) next.set("max", String(patch.maxPrice));
  if (patch.minRating !== undefined) next.set("rating", String(patch.minRating));
  if (patch.inStockOnly !== undefined) {
    if (patch.inStockOnly) next.set("inStock", "1");
    else next.delete("inStock");
  }
  if (patch.onSaleOnly !== undefined) {
    if (patch.onSaleOnly) next.set("onSale", "1");
    else next.delete("onSale");
  }
  if (patch.sort !== undefined) next.set("sort", patch.sort);
  if (patch.page !== undefined) {
    if (patch.page > 1) next.set("page", String(patch.page));
    else next.delete("page");
  }
  return next;
}

export function CatalogPage() {
  const [params, setParams] = useSearchParams();
  const { state } = useStore();

  const [results, setResults] = useState<{ items: Product[]; total: number; totalPages: number } | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [layout, setLayout] = useState<"grid" | "list">("grid");
  const [filtersOpen, setFiltersOpen] = useState(false);

  // ── Filter state, derived from the URL so it's the single source of truth ──
  const search = params.get("q") ?? "";
  const categories = paramList(params, "category") as Category[];
  const brands = paramList(params, "brand");
  const minPrice = params.has("min") ? Number(params.get("min")) : PRICE_BOUNDS.min;
  const maxPrice = params.has("max") ? Number(params.get("max")) : PRICE_BOUNDS.max;
  const minRating = params.has("rating") ? Number(params.get("rating")) : 0;
  const inStockOnly = params.get("inStock") === "1";
  const onSaleOnly = params.get("onSale") === "1";
  const sort = (params.get("sort") as SortKey) ?? "featured";
  const page = params.has("page") ? Number(params.get("page")) : 1;

  const update = useCallback(
    (patch: Parameters<typeof writeFilters>[1]) => {
      setParams(writeFilters(params, patch), { replace: false });
    },
    [params, setParams],
  );

  // ── Fetch ──
  const query: ProductQuery = useMemo(
    () => ({
      search,
      categories,
      brands,
      minPrice,
      maxPrice,
      minRating: minRating || undefined,
      inStockOnly,
      onSaleOnly,
      sort,
      page,
      perPage: PER_PAGE,
    }),
    [search, categories, brands, minPrice, maxPrice, minRating, inStockOnly, onSaleOnly, sort, page],
  );

  // state.catalogVersion changes after admin edits, so results refresh then.
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    listProducts(query).then((res) => {
      if (cancelled) return;
      setResults(res);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [query, state.catalogVersion]);

  // Scroll to the top of the grid when the page changes, not on filter tweaks.
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [page]);

  // Close the mobile filter sheet when a filter is applied.
  useEffect(() => {
    if (!filtersOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [filtersOpen]);

  const activeCount =
    categories.length +
    brands.length +
    (minPrice !== PRICE_BOUNDS.min || maxPrice !== PRICE_BOUNDS.max ? 1 : 0) +
    (minRating ? 1 : 0) +
    (inStockOnly ? 1 : 0) +
    (onSaleOnly ? 1 : 0);

  const clearAll = () => {
    const next = new URLSearchParams();
    if (search) next.set("q", search);
    setParams(next);
  };

  const singleCategory = categories.length === 1 ? categories[0] : null;
  const categoryMeta = CATEGORIES.find((c) => c.slug === singleCategory);

  const heading = search
    ? `Results for “${search}”`
    : categoryMeta && categories.length === 1
      ? categoryMeta.name
      : "All products";

  const toggleCategory = (slug: Category) => {
    const next = categories.includes(slug)
      ? categories.filter((c) => c !== slug)
      : [...categories, slug];
    update({ categories: next, page: 1 });
  };

  const toggleBrand = (brand: string) => {
    const next = brands.includes(brand)
      ? brands.filter((b) => b !== brand)
      : [...brands, brand];
    update({ brands: next, page: 1 });
  };

  const filterPanel = (
    <div className="space-y-6">
      <fieldset>
        <legend className="mb-2.5 text-sm font-semibold text-fg">Category</legend>
        <div className="space-y-0.5">
          {CATEGORIES.map((c) => (
            <Checkbox
              key={c.slug}
              label={c.name}
              checked={categories.includes(c.slug)}
              onChange={() => toggleCategory(c.slug)}
            />
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-2.5 text-sm font-semibold text-fg">Price</legend>
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={minPrice}
            min={PRICE_BOUNDS.min}
            max={maxPrice}
            onChange={(e) =>
              update({
                minPrice: Math.max(PRICE_BOUNDS.min, Number(e.target.value) || 0),
                page: 1,
              })
            }
            aria-label="Minimum price"
            className="h-10 w-full min-w-0 rounded-lg border border-line bg-surface-2 px-2.5 text-sm text-fg focus:border-accent focus:outline-none"
          />
          <span className="shrink-0 text-fg-3">–</span>
          <input
            type="number"
            value={maxPrice}
            min={minPrice}
            max={PRICE_BOUNDS.max}
            onChange={(e) =>
              update({
                maxPrice: Math.min(PRICE_BOUNDS.max, Number(e.target.value) || 0),
                page: 1,
              })
            }
            aria-label="Maximum price"
            className="h-10 w-full min-w-0 rounded-lg border border-line bg-surface-2 px-2.5 text-sm text-fg focus:border-accent focus:outline-none"
          />
        </div>
        <p className="mt-2 text-xs text-fg-3">
          {formatPrice(minPrice)} – {formatPrice(maxPrice)}
        </p>
      </fieldset>

      <fieldset>
        <legend className="mb-2.5 text-sm font-semibold text-fg">Brand</legend>
        <div className="space-y-0.5">
          {BRANDS.map((b) => (
            <Checkbox
              key={b}
              label={b}
              checked={brands.includes(b)}
              onChange={() => toggleBrand(b)}
            />
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-2.5 text-sm font-semibold text-fg">Rating</legend>
        <div className="space-y-0.5">
          {[4.5, 4, 3.5].map((r) => (
            <Checkbox
              key={r}
              label={`${r} stars & up`}
              checked={minRating === r}
              onChange={() => update({ minRating: minRating === r ? 0 : r, page: 1 })}
            />
          ))}
        </div>
      </fieldset>

      <div className="space-y-3 border-t border-line pt-5">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-fg-2">In stock only</span>
          <Toggle
            checked={inStockOnly}
            onChange={(v) => update({ inStockOnly: v, page: 1 })}
            label="Show in-stock products only"
          />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-fg-2">On sale only</span>
          <Toggle
            checked={onSaleOnly}
            onChange={(v) => update({ onSaleOnly: v, page: 1 })}
            label="Show discounted products only"
          />
        </div>
      </div>

      {activeCount > 0 && (
        <Button variant="secondary" size="sm" className="w-full" onClick={clearAll}>
          Clear all filters
        </Button>
      )}
    </div>
  );

  return (
    <div className="shell py-8">
      <Breadcrumbs items={[{ label: "Home", to: "/" }, { label: heading }]} />

      <header className="mt-4 mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-fg sm:text-3xl">{heading}</h1>
        <p className="mt-1.5 text-sm text-fg-3">
          {categoryMeta?.tagline ?? "Every product in the Voltify catalog."}
        </p>
      </header>

      <div className="lg:grid lg:grid-cols-[16rem_1fr] lg:gap-8">
        {/* Desktop filter rail */}
        <aside className="hidden lg:block">
          <div className="sticky top-32 max-h-[calc(100vh-9rem)] overflow-y-auto pr-2">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-fg-3">
              Filters
              {activeCount > 0 && <span className="ml-2 text-accent">({activeCount})</span>}
            </h2>
            {filterPanel}
          </div>
        </aside>

        <div>
          {/* Toolbar */}
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <Button
              variant="secondary"
              size="sm"
              className="lg:hidden"
              onClick={() => setFiltersOpen(true)}
            >
              Filters{activeCount > 0 ? ` (${activeCount})` : ""}
            </Button>

            <p className="text-sm text-fg-3">
              {loading ? "Loading…" : `${results?.total ?? 0} product${results?.total === 1 ? "" : "s"}`}
            </p>

            <div className="ml-auto flex items-center gap-2">
              <Select
                value={sort}
                onChange={(v) => update({ sort: v as SortKey, page: 1 })}
                className="w-44"
                id="sort"
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </Select>

              <div className="hidden rounded-lg border border-line p-0.5 sm:flex">
                <button
                  type="button"
                  onClick={() => setLayout("grid")}
                  aria-label="Grid view"
                  aria-pressed={layout === "grid"}
                  className={`grid h-8 w-8 place-items-center rounded-md transition-colors ${
                    layout === "grid" ? "bg-surface-3 text-fg" : "text-fg-3 hover:text-fg"
                  }`}
                >
                  <GridIcon size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => setLayout("list")}
                  aria-label="List view"
                  aria-pressed={layout === "list"}
                  className={`grid h-8 w-8 place-items-center rounded-md transition-colors ${
                    layout === "list" ? "bg-surface-3 text-fg" : "text-fg-3 hover:text-fg"
                  }`}
                >
                  <ListIcon size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* Active filter chips */}
          {activeCount > 0 && (
            <div className="mb-4 flex flex-wrap items-center gap-2">
              {categories.map((c) => (
                <FilterChip
                  key={c}
                  label={CATEGORIES.find((x) => x.slug === c)?.name ?? c}
                  onRemove={() => toggleCategory(c)}
                />
              ))}
              {brands.map((b) => (
                <FilterChip key={b} label={b} onRemove={() => toggleBrand(b)} />
              ))}
              {(minPrice !== PRICE_BOUNDS.min || maxPrice !== PRICE_BOUNDS.max) && (
                <FilterChip
                  label={`${formatPrice(minPrice)} – ${formatPrice(maxPrice)}`}
                  onRemove={() =>
                    update({ minPrice: PRICE_BOUNDS.min, maxPrice: PRICE_BOUNDS.max, page: 1 })
                  }
                />
              )}
              {minRating > 0 && (
                <FilterChip
                  label={`${minRating} stars & up`}
                  onRemove={() => update({ minRating: 0, page: 1 })}
                />
              )}
              {inStockOnly && (
                <FilterChip label="In stock" onRemove={() => update({ inStockOnly: false, page: 1 })} />
              )}
              {onSaleOnly && (
                <FilterChip label="On sale" onRemove={() => update({ onSaleOnly: false, page: 1 })} />
              )}
              <button
                type="button"
                onClick={clearAll}
                className="text-xs text-fg-3 underline-offset-2 transition-colors hover:text-fg hover:underline"
              >
                Clear all
              </button>
            </div>
          )}

          {/* Results */}
          {loading ? (
            <div
              className={
                layout === "grid"
                  ? "grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
                  : "flex flex-col gap-3"
              }
            >
              {Array.from({ length: PER_PAGE }).map((_, i) => (
                <ProductCardSkeleton key={i} layout={layout} />
              ))}
            </div>
          ) : results && results.items.length > 0 ? (
            <>
              <div
                className={
                  layout === "grid"
                    ? "grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
                    : "flex flex-col gap-3"
                }
              >
                {results.items.map((p) => (
                  <ProductCard key={p.id} product={p} layout={layout} />
                ))}
              </div>

              <div className="mt-10">
                <Pagination
                  page={page}
                  totalPages={results.totalPages}
                  onChange={(p) => update({ page: p })}
                />
              </div>
            </>
          ) : (
            <EmptyState
              icon={<SearchIcon size={22} />}
              title="No products match those filters"
              description="Try widening the price range, clearing a filter, or searching for something else."
              action={
                <Button variant="secondary" onClick={clearAll}>
                  Clear all filters
                </Button>
              }
            />
          )}
        </div>
      </div>

      {/* Mobile filter sheet */}
      {filtersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-ink/70 backdrop-blur-sm"
            onClick={() => setFiltersOpen(false)}
          />
          <div className="absolute inset-y-0 right-0 flex w-full max-w-sm flex-col border-l border-line bg-surface">
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <h2 className="text-base font-semibold text-fg">
                Filters{activeCount > 0 ? ` (${activeCount})` : ""}
              </h2>
              <button
                type="button"
                onClick={() => setFiltersOpen(false)}
                aria-label="Close filters"
                className="grid h-8 w-8 place-items-center rounded-lg text-fg-3 hover:bg-surface-3 hover:text-fg"
              >
                <CloseIcon size={18} />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{filterPanel}</div>
            <div className="border-t border-line p-4">
              <Button className="w-full" onClick={() => setFiltersOpen(false)}>
                Show {results?.total ?? 0} results
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <Badge tone="neutral" className="pr-1">
      {label}
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove filter ${label}`}
        className="ml-0.5 grid h-4 w-4 place-items-center rounded-full text-fg-3 transition-colors hover:bg-surface-3 hover:text-fg"
      >
        <CloseIcon size={11} />
      </button>
    </Badge>
  );
}