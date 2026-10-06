import { LinkButton } from "../components/Primitives";
import { CATEGORIES } from "../data/catalog";
import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <div className="shell py-20">
      <div className="mx-auto max-w-lg text-center">
        <p className="text-7xl font-semibold tracking-tight text-line-strong">404</p>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight text-fg">
          We couldn’t find that page
        </h1>
        <p className="mt-2 text-sm text-fg-3">
          The link may be broken, or the product might have been retired from the catalog.
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <LinkButton to="/" size="lg">
            Back to home
          </LinkButton>
          <LinkButton to="/products" size="lg" variant="secondary">
            Browse products
          </LinkButton>
        </div>

        <div className="mt-10 border-t border-line pt-8">
          <p className="text-xs font-semibold uppercase tracking-wider text-fg-3">
            Popular categories
          </p>
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            {CATEGORIES.map((c) => (
              <Link
                key={c.slug}
                to={`/products?category=${c.slug}`}
                className="rounded-lg border border-line px-3 py-1.5 text-sm text-fg-2 transition-colors hover:border-line-strong hover:text-fg"
              >
                {c.name}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}