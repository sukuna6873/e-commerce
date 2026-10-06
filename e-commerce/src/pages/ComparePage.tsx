import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { allProducts } from "../data/api";
import { formatPrice } from "../lib/format";
import { ProductArt } from "../lib/productArt";
import { useStore, MAX_COMPARE } from "../store/StoreContext";
import {
  Badge,
  Breadcrumbs,
  Button,
  EmptyState,
  LinkButton,
  Rating,
  Select,
} from "../components/Primitives";
import { CloseIcon, CompareIcon } from "../components/Icons";

/**
 * Side-by-side spec comparison. Rows are built by unioning the spec labels
 * across the selected products, so a field only one product has still appears
 * with an em-dash where it's missing.
 */
export function ComparePage() {
  const { state, toggleCompare, clearCompare } = useStore();
  const [highlight, setHighlight] = useState<string>("");

  const products = useMemo(
    () =>
      state.compare
        .map((id) => allProducts().find((p) => p.id === id))
        .filter((p): p is NonNullable<typeof p> => Boolean(p)),
    [state.compare],
  );

  /** Merges the spec sheets, preserving catalog group order. */
  const rows = useMemo(() => {
    const groups: { group: string; rows: { label: string; values: (string | null)[] }[] }[] = [];
    const seenGroups = new Set<string>();

    for (const p of products) {
      for (const specGroup of p.specs) {
        if (!seenGroups.has(specGroup.group)) {
          groups.push({ group: specGroup.group, rows: [] });
          seenGroups.add(specGroup.group);
        }
        const target = groups.find((g) => g.group === specGroup.group)!;
        for (const row of specGroup.rows) {
          const existing = target.rows.find((r) => r.label === row.label);
          if (existing) existing.values[products.indexOf(p)] = row.value;
          else {
            target.rows.push({
              label: row.label,
              values: products.map((prod) =>
                prod.specs
                  .find((g) => g.group === specGroup.group)
                  ?.rows.find((r) => r.label === row.label)?.value ?? null,
              ),
            });
          }
        }
      }
    }

    // Pad every row to the full width so the table stays rectangular.
    for (const g of groups) {
      for (const r of g.rows) {
        while (r.values.length < products.length) r.values.push(null);
      }
    }
    return groups;
  }, [products]);

  if (products.length === 0) {
    return (
      <div className="shell py-12">
        <Breadcrumbs items={[{ label: "Home", to: "/" }, { label: "Compare" }]} />
        <h1 className="mt-4 text-2xl font-semibold tracking-tight text-fg">Compare products</h1>
        <div className="mt-6">
          <EmptyState
            icon={<CompareIcon size={24} />}
            title="Nothing to compare yet"
            description={`Add up to ${MAX_COMPARE} products using the compare button on any product card, then come back here to see their specifications side by side.`}
            action={<LinkButton to="/products">Browse products</LinkButton>}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="shell py-8">
      <Breadcrumbs items={[{ label: "Home", to: "/" }, { label: "Compare" }]} />

      <header className="mt-4 mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-fg sm:text-3xl">
            Compare products
          </h1>
          <p className="mt-1.5 text-sm text-fg-3">
            {products.length} of {MAX_COMPARE} slots used
            {products.length < 2 && " — add at least one more to see differences."}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select
            value={highlight}
            onChange={setHighlight}
            className="w-44"
            id="highlight"
            label="Highlight"
          >
            <option value="">No highlight</option>
            {rows
              .flatMap((g) => g.rows)
              .filter((r) => new Set(r.values.map((v) => v ?? "")).size > 1)
              .map((r) => (
                <option key={r.label} value={r.label}>
                  {r.label}
                </option>
              ))}
          </Select>
          <Button variant="secondary" size="sm" onClick={clearCompare}>
            Clear all
          </Button>
        </div>
      </header>

      {/* Sticky product header row */}
      <div className="overflow-x-auto rounded-2xl border border-line bg-surface">
        <table className="w-full min-w-[40rem] border-collapse">
          <caption className="sr-only">
            Specification comparison for {products.map((p) => p.name).join(", ")}
          </caption>
          <thead>
            <tr>
              <th scope="col" className="w-44 p-4 text-left align-bottom">
                <span className="text-xs font-semibold uppercase tracking-wider text-fg-3">
                  Product
                </span>
              </th>
              {products.map((p) => (
                <th key={p.id} scope="col" className="min-w-56 p-4 text-left align-top">
                  <div className="flex items-start justify-between gap-2">
                    <Link
                      to={`/products/${p.slug}`}
                      className="block h-28 w-full overflow-hidden rounded-xl bg-surface-2"
                    >
                      <ProductArt product={p} className="h-full w-full" />
                    </Link>
                    <button
                      type="button"
                      onClick={() => toggleCompare(p.id)}
                      aria-label={`Remove ${p.name} from comparison`}
                      className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-fg-3 transition-colors hover:bg-surface-3 hover:text-danger"
                    >
                      <CloseIcon size={15} />
                    </button>
                  </div>

                  <p className="mt-3 text-xs font-medium uppercase tracking-wider text-fg-3">
                    {p.brand}
                  </p>
                  <Link
                    to={`/products/${p.slug}`}
                    className="mt-0.5 block font-medium text-fg hover:text-accent"
                  >
                    {p.name}
                  </Link>

                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-lg font-semibold text-fg tabular-nums">
                      {formatPrice(p.price)}
                    </span>
                    {p.compareAt && (
                      <span className="text-sm text-fg-3 line-through">
                        {formatPrice(p.compareAt)}
                      </span>
                    )}
                  </div>

                  <div className="mt-1.5">
                    <Rating value={p.rating} size={12} />
                  </div>

                  <LinkButton to={`/products/${p.slug}`} size="sm" className="mt-3 w-full">
                    View
                  </LinkButton>
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="border-t border-line">
            {/* Summary facts first, before the deep spec groups. */}
            <tr className="border-b border-line bg-surface-2/50">
              <th scope="row" className="p-3.5 text-left text-sm font-medium text-fg-2">
                Category
              </th>
              {products.map((p) => (
                <td key={p.id} className="p-3.5 text-sm capitalize text-fg">
                  {p.category}
                </td>
              ))}
            </tr>
            <tr className="border-b border-line">
              <th scope="row" className="p-3.5 text-left text-sm font-medium text-fg-2">
                Availability
              </th>
              {products.map((p) => (
                <td key={p.id} className="p-3.5 text-sm">
                  <Badge
                    tone={
                      p.stock === 0 ? "danger" : p.stock <= 10 ? "warning" : "success"
                    }
                  >
                    {p.stock === 0
                      ? "Out of stock"
                      : p.stock <= 10
                        ? `Only ${p.stock} left`
                        : "In stock"}
                  </Badge>
                </td>
              ))}
            </tr>

            {rows.map((group) => (
              <>
                <tr key={group.group} className="border-b border-line bg-surface-2/50">
                  <th
                    scope="colgroup"
                    colSpan={products.length + 1}
                    className="px-3.5 py-2 text-left text-xs font-semibold uppercase tracking-wider text-fg-3"
                  >
                    {group.group}
                  </th>
                </tr>
                {group.rows.map((row) => {
                  const differs = new Set(row.values.map((v) => v ?? "")).size > 1;
                  const isHighlighted = highlight === row.label;
                  return (
                    <tr
                      key={`${group.group}-${row.label}`}
                      className={`border-b border-line last:border-b-0 ${
                        isHighlighted ? "bg-accent/5" : ""
                      }`}
                    >
                      <th
                        scope="row"
                        className={`p-3.5 text-left text-sm font-medium ${
                          differs ? "text-accent" : "text-fg-2"
                        }`}
                      >
                        {row.label}
                        {isHighlighted && differs && (
                          <span className="ml-1.5 align-middle text-[10px] uppercase text-accent">
                            differs
                          </span>
                        )}
                      </th>
                      {row.values.map((value, i) => (
                        <td
                          key={`${row.label}-${i}`}
                          className={`p-3.5 text-sm ${
                            isHighlighted && value ? "font-medium text-fg" : "text-fg-2"
                          } ${value === null ? "text-fg-3/50" : ""}`}
                        >
                          {value ?? "—"}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-xs text-fg-3">
        Differences between selected products are shown in blue. Use the highlight control to
        isolate one row across all columns.
      </p>
    </div>
  );
}