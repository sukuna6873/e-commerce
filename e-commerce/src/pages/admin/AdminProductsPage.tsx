import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import type { Product } from "../../types";
import { allProducts, updateProductPricing } from "../../data/api";
import { formatPrice } from "../../lib/format";
import { useStore } from "../../store/StoreContext";
import { ProductArt } from "../../lib/productArt";
import {
  Badge,
  Button,
  EmptyState,
  Field,
  Select,
  inputClass,
} from "../../components/Primitives";
import { EditIcon, SearchIcon } from "../../components/Icons";

/**
 * Product management. Editing price, compare-at price and stock writes a sparse
 * override into localStorage rather than mutating the catalog module, so the
 * storefront and the admin view stay in sync without either owning the data.
 */
export function AdminProductsPage() {
  const [params] = useSearchParams();
  const { state, refreshCatalog, notify } = useStore();
  const [search, setSearch] = useState(params.get("q") ?? "");
  const [category, setCategory] = useState("all");
  const [editing, setEditing] = useState<Product | null>(null);

  const categories = useMemo(
    () => [...new Set(allProducts().map((p) => p.category))],
    [state.catalogVersion],
  );

  const products = useMemo(() => {
    const q = search.trim().toLowerCase();
    return allProducts().filter((p) => {
      if (category !== "all" && p.category !== category) return false;
      if (!q) return true;
      return `${p.name} ${p.brand} ${p.tagline}`.toLowerCase().includes(q);
    });
  }, [search, category, state.catalogVersion]);

  if (editing) {
    return (
      <ProductEditor
        product={editing}
        onDone={(message) => {
          setEditing(null);
          refreshCatalog();
          if (message) notify(message);
        }}
        onCancel={() => setEditing(null)}
      />
    );
  }

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-lg font-semibold tracking-tight text-fg">Products</h2>
        <p className="text-sm text-fg-3">
          {products.length} of {allProducts().length} products shown
        </p>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative min-w-0 flex-1">
          <SearchIcon
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-fg-3"
          />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products…"
            aria-label="Search products"
            className="h-10 w-full rounded-xl border border-line bg-surface-2 pl-9 pr-3 text-sm text-fg placeholder:text-fg-3 focus:border-accent focus:outline-none"
          />
        </div>
        <Select
          value={category}
          onChange={setCategory}
          className="w-40"
          id="admin-category"
        >
          <option value="all">All categories</option>
          {categories.map((c) => (
            <option key={c} value={c} className="capitalize">
              {c}
            </option>
          ))}
        </Select>
      </div>

      {products.length === 0 ? (
        <EmptyState
          icon={<SearchIcon size={22} />}
          title="No products match"
          description="Try a different search term or category."
          action={
            <Button
              variant="secondary"
              onClick={() => {
                setSearch("");
                setCategory("all");
              }}
            >
              Clear filters
            </Button>
          }
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-line bg-surface">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[42rem] border-collapse">
              <caption className="sr-only">Catalog products with price and stock</caption>
              <thead>
                <tr className="border-b border-line bg-surface-2">
                  <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-fg-3">
                    Product
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-fg-3">
                    Category
                  </th>
                  <th scope="col" className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-fg-3">
                    Price
                  </th>
                  <th scope="col" className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-fg-3">
                    Stock
                  </th>
                  <th scope="col" className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-fg-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {products.map((p) => {
                  const stock = p.variants.length
                    ? p.variants.reduce((s, v) => s + v.stock, 0)
                    : p.stock;
                  return (
                    <tr key={p.id} className="transition-colors hover:bg-surface-2/60">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-surface-2">
                            <ProductArt product={p} className="h-full w-full" />
                          </div>
                          <div className="min-w-0">
                            <Link
                              to={`/products/${p.slug}`}
                              className="block truncate text-sm font-medium text-fg hover:text-accent"
                            >
                              {p.name}
                            </Link>
                            <p className="truncate text-xs text-fg-3">{p.brand}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm capitalize text-fg-2">{p.category}</td>
                      <td className="px-4 py-3 text-right">
                        <span className="block text-sm font-medium text-fg tabular-nums">
                          {formatPrice(p.price)}
                        </span>
                        {p.compareAt && (
                          <span className="block text-xs text-fg-3 line-through tabular-nums">
                            {formatPrice(p.compareAt)}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Badge tone={stock === 0 ? "danger" : stock <= 10 ? "warning" : "success"}>
                          {stock}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button size="sm" variant="secondary" onClick={() => setEditing(p)}>
                          <EditIcon size={14} />
                          Edit
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function ProductEditor({
  product,
  onDone,
  onCancel,
}: {
  product: Product;
  onDone: (message?: string) => void;
  onCancel: () => void;
}) {
  const [price, setPrice] = useState(String(product.price / 100));
  const [compareAt, setCompareAt] = useState(
    product.compareAt ? String(product.compareAt / 100) : "",
  );
  const [onSale, setOnSale] = useState(product.compareAt !== undefined);
  const [stock, setStock] = useState(String(product.stock));
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    const priceCents = Math.round(Number(price) * 100);
    const compareCents = onSale ? Math.round(Number(compareAt) * 100) : undefined;
    const stockValue = Number(stock);

    if (!Number.isFinite(priceCents) || priceCents <= 0) {
      setError("Enter a price greater than zero.");
      return;
    }
    if (onSale) {
      if (!Number.isFinite(compareCents as number) || (compareCents as number) <= 0) {
        setError("Enter a compare-at price, or turn the sale off.");
        return;
      }
      if ((compareCents as number) <= priceCents) {
        setError("The compare-at price must be higher than the price.");
        return;
      }
    }
    if (!Number.isInteger(stockValue) || stockValue < 0) {
      setError("Stock must be a whole number of zero or more.");
      return;
    }

    setError("");
    setSaving(true);
    await updateProductPricing(product.id, {
      price: priceCents,
      compareAt: onSale ? compareCents : undefined,
      stock: stockValue,
    });
    setSaving(false);
    onDone(`${product.name} updated`);
  };

  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onCancel}>
          ← Back to products
        </Button>
      </div>

      <div className="mb-6 flex items-center gap-4">
        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-surface-2">
          <ProductArt product={product} className="h-full w-full" />
        </div>
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-fg">{product.name}</h2>
          <p className="text-sm text-fg-3">
            {product.brand} · {product.variants.length || 1} variant
            {product.variants.length === 1 ? "" : "s"}
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-line bg-surface p-5">
        <h3 className="text-sm font-semibold text-fg">Pricing and stock</h3>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field
            label="Price (USD)"
            htmlFor="edit-price"
            hint="The price shoppers pay."
            error={error && price === "" ? error : undefined}
          >
            <input
              id="edit-price"
              type="number"
              min="0"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className={inputClass(false)}
            />
          </Field>

          <Field
            label="Compare-at price (USD)"
            htmlFor="edit-compare"
            hint={
              onSale
                ? "Shown struck through to mark a discount."
                : "Add a compare-at price to show it as on sale."
            }
          >
            <input
              id="edit-compare"
              type="number"
              min="0"
              step="0.01"
              value={compareAt}
              onChange={(e) => setCompareAt(e.target.value)}
              disabled={!onSale}
              className={inputClass(false)}
              placeholder="e.g. 194.00"
            />
          </Field>

          <div className="sm:col-span-2">
            <label className="flex cursor-pointer items-center gap-2.5 text-sm text-fg-2">
              <input
                type="checkbox"
                checked={onSale}
                onChange={(e) => setOnSale(e.target.checked)}
                className="h-4 w-4 accent-[var(--color-accent)]"
              />
              Product is on sale
            </label>
          </div>

          <Field
            label="Stock"
            htmlFor="edit-stock"
            hint={
              product.variants.length
                ? "Sets every variant to this level. Use the Inventory page for per-variant stock."
                : "Units available to sell."
            }
          >
            <input
              id="edit-stock"
              type="number"
              min="0"
              step="1"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              className={inputClass(false)}
            />
          </Field>
        </div>

        {error && (
          <div className="mt-4 rounded-lg border border-danger/30 bg-danger/10 px-3.5 py-2.5 text-sm text-danger">
            {error}
          </div>
        )}

        <div className="mt-5 flex gap-2 border-t border-line pt-4">
          <Button onClick={save} disabled={saving}>
            {saving ? "Saving…" : "Save changes"}
          </Button>
          <Button variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </div>

      {/* Read-only spec preview so the editor has the full context. */}
      <div className="mt-4 rounded-2xl border border-line bg-surface p-5">
        <h3 className="text-sm font-semibold text-fg">Specifications (read-only)</h3>
        <p className="mt-1 text-xs text-fg-3">
          Spec sheets are defined in the catalog module and aren’t editable from the dashboard.
        </p>
        <div className="mt-3 space-y-3">
          {product.specs.map((g) => (
            <div key={g.group}>
              <p className="text-xs font-semibold uppercase tracking-wider text-fg-3">
                {g.group}
              </p>
              <dl className="mt-1.5 overflow-hidden rounded-lg border border-line">
                {g.rows.map((row) => (
                  <div
                    key={row.label}
                    className="flex gap-3 border-b border-line px-3 py-1.5 last:border-b-0"
                  >
                    <dt className="w-1/3 shrink-0 text-xs text-fg-3">{row.label}</dt>
                    <dd className="flex-1 text-xs text-fg-2">{row.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}