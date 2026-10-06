import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import type { Product } from "../../types";
import { allProducts, updateVariantStock } from "../../data/api";
import { LOW_STOCK, variantLabel } from "../../data/catalog";
import { useStore } from "../../store/StoreContext";
import { ProductArt } from "../../lib/productArt";
import { Badge, EmptyState } from "../../components/Primitives";
import { AlertIcon, CheckIcon, PackageIcon, SearchIcon } from "../../components/Icons";

/**
 * Per-variant inventory editor. Each stock field is uncontrolled until changed,
 * then saved on blur — so a table of 60+ inputs doesn't fire a write per
 * keystroke.
 */
export function AdminInventoryPage() {
  const { state, refreshCatalog, notify } = useStore();
  const [search, setSearch] = useState("");
  const [onlyLow, setOnlyLow] = useState(false);
  const [savingKey, setSavingKey] = useState<string | null>(null);

  const products = useMemo(() => allProducts(), [state.catalogVersion]);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list: {
      product: Product;
      total: number;
      low: boolean;
    }[] = [];

    for (const product of products) {
      const total = product.variants.length
        ? product.variants.reduce((s, v) => s + v.stock, 0)
        : product.stock;
      const low = product.variants.length
        ? product.variants.some((v) => v.stock <= LOW_STOCK)
        : product.stock <= LOW_STOCK;

      if (onlyLow && !low) continue;
      if (q && !`${product.name} ${product.brand}`.toLowerCase().includes(q)) continue;
      list.push({ product, total, low });
    }

    return list.sort((a, b) => Number(b.low) - Number(a.low) || a.product.name.localeCompare(b.product.name));
  }, [products, search, onlyLow]);

  const summary = useMemo(() => {
    const outOfStock = products.filter(
      (p) => (p.variants.length ? p.variants : [p]).every((v) => v.stock === 0),
    ).length;
    const lowStock = products.filter((p) =>
      (p.variants.length ? p.variants : [p]).some((v) => v.stock > 0 && v.stock <= LOW_STOCK),
    ).length;
    const units = products.reduce(
      (sum, p) =>
        sum + (p.variants.length ? p.variants : [p]).reduce((s, v) => s + v.stock, 0),
      0,
    );
    return { outOfStock, lowStock, units };
  }, [products]);

  const save = async (product: Product, variantValue: string, raw: string) => {
    const next = Number(raw);
    if (!Number.isInteger(next) || next < 0) {
      notify("Stock must be a whole number of zero or more", "error");
      refreshCatalog();
      return;
    }
    const key = `${product.id}::${variantValue}`;
    setSavingKey(key);
    await updateVariantStock(product.id, variantValue, next);
    setSavingKey(null);
    refreshCatalog();
  };

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-lg font-semibold tracking-tight text-fg">Inventory</h2>
        <p className="text-sm text-fg-3">
          {summary.units.toLocaleString()} units across {products.length} products ·{" "}
          {summary.lowStock} low · {summary.outOfStock} out of stock
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
        <label className="flex cursor-pointer items-center gap-2 text-sm text-fg-2">
          <input
            type="checkbox"
            checked={onlyLow}
            onChange={(e) => setOnlyLow(e.target.checked)}
            className="h-4 w-4 accent-[var(--color-accent)]"
          />
          Low stock only
        </label>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          icon={<PackageIcon size={22} />}
          title="Nothing to show"
          description={
            onlyLow
              ? "No products are below the low-stock threshold."
              : "No products match that search."
          }
        />
      ) : (
        <ul className="space-y-3">
          {rows.map(({ product, total, low }) => (
            <li
              key={product.id}
              className={`rounded-2xl border bg-surface p-4 ${
                total === 0 ? "border-danger/30" : low ? "border-warning/30" : "border-line"
              }`}
            >
              <div className="mb-3 flex flex-wrap items-center gap-3">
                <div className="h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-surface-2">
                  <ProductArt product={product} className="h-full w-full" />
                </div>
                <div className="min-w-0 flex-1">
                  <Link
                    to={`/products/${product.slug}`}
                    className="block truncate text-sm font-medium text-fg hover:text-accent"
                  >
                    {product.name}
                  </Link>
                  <p className="text-xs text-fg-3">
                    {product.brand} · {product.category}
                  </p>
                </div>
                {low && (
                  <Badge tone={total === 0 ? "danger" : "warning"} className="shrink-0">
                    <AlertIcon size={11} />
                    {total === 0 ? "Out of stock" : "Low stock"}
                  </Badge>
                )}
              </div>

              {product.variants.length === 0 ? (
                <StockField
                  value={product.stock}
                  saving={savingKey === product.id}
                  onSave={(v) => save(product, "", v)}
                  label="All units"
                />
              ) : (
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {product.variants.map((variant) => (
                    <StockField
                      key={variant.value}
                      value={variant.stock}
                      hex={variant.hex}
                      saving={savingKey === `${product.id}::${variant.value}`}
                      onSave={(v) => save(product, variant.value, v)}
                      label={variantLabel(variant.group)}
                    />
                  ))}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function StockField({
  value,
  label,
  hex,
  saving,
  onSave,
}: {
  value: number;
  label: string;
  hex?: string;
  saving: boolean;
  onSave: (next: string) => void;
}) {
  const [draft, setDraft] = useState(String(value));
  const [dirty, setDirty] = useState(false);

  // Re-sync when the underlying value changes (e.g. after another edit).
  if (!dirty && draft !== String(value)) setDraft(String(value));

  const commit = () => {
    if (!dirty) return;
    setDirty(false);
    if (draft !== String(value)) onSave(draft);
  };

  return (
    <div
      className={`flex items-center gap-2 rounded-lg border px-2.5 py-1.5 ${
        value === 0
          ? "border-danger/30 bg-danger/5"
          : value <= LOW_STOCK
            ? "border-warning/30 bg-warning/5"
            : "border-line bg-surface-2"
      }`}
    >
      <span className="flex min-w-0 flex-1 items-center gap-1.5">
        {hex && (
          <span
            className="h-3 w-3 shrink-0 rounded-full border border-line-strong"
            style={{ background: hex }}
            aria-hidden
          />
        )}
        <span className="truncate text-xs text-fg-2">{label}</span>
      </span>

      <input
        type="number"
        min="0"
        step="1"
        value={draft}
        aria-label={`${label} stock`}
        onChange={(e) => {
          setDraft(e.target.value);
          setDirty(true);
        }}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
          if (e.key === "Escape") {
            setDraft(String(value));
            setDirty(false);
            e.currentTarget.blur();
          }
        }}
        className={`h-7 w-16 shrink-0 rounded-md border bg-surface px-2 text-right text-sm tabular-nums focus:outline-none ${
          dirty ? "border-accent text-fg" : "border-line text-fg-2"
        }`}
      />

      <span className="w-5 shrink-0 text-fg-3">
        {saving ? (
          <CheckIcon size={13} className="text-success" />
        ) : value === 0 ? (
          <AlertIcon size={13} className="text-danger" />
        ) : null}
      </span>
    </div>
  );
}