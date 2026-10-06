import { Link } from "react-router-dom";
import { useStore, MAX_COMPARE } from "../store/StoreContext";
import { formatPrice } from "../lib/format";
import { allProducts } from "../data/api";
import { ProductArt } from "../lib/productArt";
import { CloseIcon, CompareIcon } from "./Icons";
import { LinkButton } from "./Primitives";

/**
 * Persistent bar showing the compare selection. Only appears once something is
 * selected, and follows the shopper between routes so they can keep building a
 * comparison while browsing.
 */
export function CompareTray() {
  const { state, toggleCompare, clearCompare } = useStore();

  if (state.compare.length === 0) return null;

  const products = state.compare
    .map((id) => allProducts().find((p) => p.id === id))
    .filter((p): p is NonNullable<typeof p> => Boolean(p));

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/97 backdrop-blur-md">
      <div className="shell flex items-center gap-4 py-3">
        <div className="hidden shrink-0 items-center gap-2 sm:flex">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-accent/15 text-accent">
            <CompareIcon size={18} />
          </span>
          <div className="text-sm">
            <p className="font-medium text-fg">
              Compare ({products.length}/{MAX_COMPARE})
            </p>
            <button
              type="button"
              onClick={clearCompare}
              className="text-xs text-fg-3 transition-colors hover:text-fg"
            >
              Clear all
            </button>
          </div>
        </div>

        <ul className="no-scrollbar flex flex-1 items-center gap-2 overflow-x-auto">
          {products.map((p) => (
            <li
              key={p.id}
              className="group relative flex shrink-0 items-center gap-2 rounded-xl border border-line bg-surface-2 py-1.5 pl-2 pr-8"
            >
              <div className="h-9 w-9 shrink-0 overflow-hidden rounded-lg bg-surface">
                <ProductArt product={p} className="h-full w-full" />
              </div>
              <div className="min-w-0">
                <Link
                  to={`/products/${p.slug}`}
                  className="block max-w-32 truncate text-xs font-medium text-fg hover:text-accent"
                >
                  {p.name}
                </Link>
                <p className="text-[11px] text-fg-3 tabular-nums">{formatPrice(p.price)}</p>
              </div>
              <button
                type="button"
                onClick={() => toggleCompare(p.id)}
                aria-label={`Remove ${p.name} from compare`}
                className="absolute right-1.5 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-md text-fg-3 transition-colors hover:bg-surface-3 hover:text-danger"
              >
                <CloseIcon size={13} />
              </button>
            </li>
          ))}
        </ul>

        <LinkButton to="/compare" size="sm" className="hidden shrink-0 sm:inline-flex">
          Compare now
        </LinkButton>
        <Link
          to="/compare"
          aria-label="Compare products"
          className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-accent text-ink sm:hidden"
        >
          <CompareIcon size={17} />
        </Link>
      </div>
    </div>
  );
}