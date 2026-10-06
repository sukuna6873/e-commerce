import { Link } from "react-router-dom";
import { CATEGORIES } from "../data/catalog";
import { LogoMark, ReturnIcon, ShieldIcon, TruckIcon } from "./Icons";

const PERKS = [
  { Icon: TruckIcon, title: "Free shipping over $150", body: "Dispatched same day before 4pm" },
  { Icon: ReturnIcon, title: "30-day returns", body: "Free return label on every order" },
  { Icon: ShieldIcon, title: "2-year warranty", body: "Covered against manufacturing faults" },
];

const COMPANY = [
  { label: "Order tracking", to: "/account/orders" },
  { label: "Shipping & delivery", to: "/products" },
  { label: "Returns policy", to: "/products" },
  { label: "Warranty", to: "/products" },
];

export function Footer() {
  return (
    <footer className="mt-auto border-t border-line bg-surface">
      <div className="shell grid gap-6 border-b border-line py-8 sm:grid-cols-3 sm:gap-4">
        {PERKS.map(({ Icon, title, body }) => (
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

      <div className="shell grid gap-8 py-10 sm:grid-cols-2 lg:grid-cols-4">
        <div className="lg:col-span-1">
          <Link to="/" className="flex items-center gap-2">
            <LogoMark size={30} />
            <span className="text-lg font-semibold tracking-tight text-fg">Voltify</span>
          </Link>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-fg-3">
            Consumer electronics for people who read the spec sheet. A demonstration storefront —
            no real payments are processed.
          </p>
        </div>

        <nav aria-labelledby="footer-shop">
          <h2 id="footer-shop" className="text-sm font-semibold text-fg">
            Shop
          </h2>
          <ul className="mt-3 space-y-2">
            {CATEGORIES.map((c) => (
              <li key={c.slug}>
                <Link
                  to={`/products?category=${c.slug}`}
                  className="text-sm text-fg-3 transition-colors hover:text-fg"
                >
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-labelledby="footer-help">
          <h2 id="footer-help" className="text-sm font-semibold text-fg">
            Help
          </h2>
          <ul className="mt-3 space-y-2">
            {COMPANY.map((l) => (
              <li key={l.label}>
                <Link to={l.to} className="text-sm text-fg-3 transition-colors hover:text-fg">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-labelledby="footer-account">
          <h2 id="footer-account" className="text-sm font-semibold text-fg">
            Account
          </h2>
          <ul className="mt-3 space-y-2">
            {[
              { label: "Sign in", to: "/login" },
              { label: "Your orders", to: "/account/orders" },
              { label: "Wishlist", to: "/account/wishlist" },
              { label: "Admin dashboard", to: "/admin" },
            ].map((l) => (
              <li key={l.label}>
                <Link to={l.to} className="text-sm text-fg-3 transition-colors hover:text-fg">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <div className="border-t border-line">
        <div className="shell flex flex-col items-center justify-between gap-3 py-5 sm:flex-row">
          <p className="text-xs text-fg-3">
            © {new Date().getFullYear()} Voltify. A demonstration storefront.
          </p>
          <p className="text-xs text-fg-3">
            Built with React, Vite and Tailwind. Catalog and orders are mock data.
          </p>
        </div>
      </div>
    </footer>
  );
}