import { useEffect, useMemo, useRef, useState } from "react";
import { Link, NavLink, useNavigate, useSearchParams } from "react-router-dom";
import { CATEGORIES, categoryCount } from "../data/catalog";
import { formatPrice, pluralise } from "../lib/format";
import { useStore } from "../store/StoreContext";
import {
  CartIcon,
  CloseIcon,
  LogoMark,
  MenuIcon,
  SearchIcon,
  UserIcon,
} from "./Icons";
import { LinkButton } from "./Primitives";

const NAV_LINKS = [
  { to: "/products", label: "All products" },
  { to: "/products?onSale=1", label: "Deals" },
  { to: "/products?sort=newest", label: "New in" },
  { to: "/compare", label: "Compare" },
];

function AccountLinks() {
  const { user } = useStore();
  if (!user) {
    return <LinkButton to="/login" size="sm">Sign in</LinkButton>;
  }
  return (
    <div className="flex items-center gap-2">
      <LinkButton
        to={user.role === "admin" ? "/admin" : "/account"}
        size="sm"
        variant="secondary"
        className="max-w-[9rem]"
      >
        <span className="truncate">{user.name.split(" ")[0]}</span>
      </LinkButton>
      {user.role === "admin" && (
        <LinkButton to="/admin" size="sm" variant="ghost" className="px-2" aria-label="Admin">
          Admin
        </LinkButton>
      )}
    </div>
  );
}

export function Header() {
  const { cartCount, openCart } = useStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [term, setTerm] = useState(searchParams.get("q") ?? "");
  const [mobileNav, setMobileNav] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<{ id: string; slug: string; name: string; brand: string; price: number }[]>([]);
  const [suggestOpen, setSuggestOpen] = useState(false);
  const accountRef = useRef<HTMLDivElement>(null);

  // Keep the field in sync when the URL changes underneath us (back button,
  // or a category link that clears the query).
  useEffect(() => {
    setTerm(searchParams.get("q") ?? "");
  }, [searchParams]);

  // Close the account popover on outside click or Escape.
  useEffect(() => {
    if (!accountOpen) return;
    const onClick = (e: MouseEvent) => {
      if (accountRef.current && !accountRef.current.contains(e.target as Node)) setAccountOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setAccountOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [accountOpen]);

  // Typeahead over product names and brands, debounced so every keystroke
  // doesn't re-filter the catalog.
  useEffect(() => {
    const q = term.trim().toLowerCase();
    if (q.length < 2) {
      setSuggestions([]);
      return;
    }
    const timer = window.setTimeout(async () => {
      const { items } = await import("../data/api").then((m) =>
        m.listProducts({ search: q, perPage: 5 }),
      );
      setSuggestions(
        items.map((p) => ({ id: p.id, slug: p.slug, name: p.name, brand: p.brand, price: p.price })),
      );
    }, 160);
    return () => window.clearTimeout(timer);
  }, [term]);

  const categoryLinks = useMemo(
    () => CATEGORIES.map((c) => ({ ...c, count: categoryCount(c.slug) })),
    [],
  );

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSuggestOpen(false);
    const q = term.trim();
    navigate(q ? `/products?q=${encodeURIComponent(q)}` : "/products");
  };

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-ink/85 backdrop-blur-md">
      <div className="shell flex h-16 items-center gap-3">
        <button
          type="button"
          onClick={() => setMobileNav(true)}
          aria-label="Open menu"
          className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-fg-2 transition-colors hover:bg-surface-2 hover:text-fg lg:hidden"
        >
          <MenuIcon size={20} />
        </button>

        <Link to="/" className="flex shrink-0 items-center gap-2" aria-label="Voltify home">
          <LogoMark size={30} />
          <span className="text-lg font-semibold tracking-tight text-fg">Voltify</span>
        </Link>

        {/* Desktop nav */}
        <nav className="ml-4 hidden items-center gap-1 lg:flex">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `rounded-lg px-3 py-2 text-sm transition-colors ${
                  isActive ? "text-fg" : "text-fg-2 hover:bg-surface-2 hover:text-fg"
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        {/* Search */}
        <form onSubmit={submitSearch} className="relative ml-auto hidden max-w-sm flex-1 md:block">
          <SearchIcon
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-fg-3"
          />
          <input
            type="search"
            value={term}
            onChange={(e) => {
              setTerm(e.target.value);
              setSuggestOpen(true);
            }}
            onFocus={() => setSuggestOpen(true)}
            onBlur={() => window.setTimeout(() => setSuggestOpen(false), 160)}
            placeholder="Search products…"
            aria-label="Search products"
            className="h-10 w-full rounded-xl border border-line bg-surface-2 pl-9 pr-3 text-sm text-fg placeholder:text-fg-3 transition-colors hover:border-line-strong focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
          />
          {suggestOpen && suggestions.length > 0 && (
            <ul className="absolute left-0 right-0 top-11 z-50 overflow-hidden rounded-xl border border-line bg-surface shadow-xl">
              {suggestions.map((s) => (
                <li key={s.id}>
                  <Link
                    to={`/products/${s.slug}`}
                    className="flex items-center justify-between gap-3 px-3.5 py-2.5 transition-colors hover:bg-surface-2"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm text-fg">{s.name}</span>
                      <span className="block text-xs text-fg-3">{s.brand}</span>
                    </span>
                    <span className="shrink-0 text-sm font-medium text-fg-2">
                      {formatPrice(s.price)}
                    </span>
                  </Link>
                </li>
              ))}
              <li className="border-t border-line">
                <button
                  type="button"
                  onMouseDown={submitSearch}
                  className="w-full px-3.5 py-2.5 text-left text-sm text-accent transition-colors hover:bg-surface-2"
                >
                  See all results for “{term.trim()}”
                </button>
              </li>
            </ul>
          )}
        </form>

        <div className="ml-auto flex items-center gap-1 md:ml-0">
          {/* Account */}
          <div className="relative" ref={accountRef}>
            <button
              type="button"
              onClick={() => setAccountOpen((v) => !v)}
              aria-expanded={accountOpen}
              aria-label="Account menu"
              className="grid h-10 w-10 place-items-center rounded-lg text-fg-2 transition-colors hover:bg-surface-2 hover:text-fg"
            >
              <UserIcon size={20} />
            </button>
            {accountOpen && <AccountPopover onClose={() => setAccountOpen(false)} />}
          </div>

          {/* Cart — opens the slide-over, which holds the full contents. */}
          <button
            type="button"
            onClick={openCart}
            className="relative grid h-10 w-10 place-items-center rounded-lg text-fg-2 transition-colors hover:bg-surface-2 hover:text-fg"
            aria-label={`Open cart, ${pluralise(cartCount, "item")}`}
          >
            <CartIcon size={20} />
            {cartCount > 0 && (
              <span
                className="absolute right-0.5 top-0.5 grid place-items-center rounded-full bg-accent px-1 text-[10px] font-bold text-ink tabular-nums"
                style={{ height: 18, minWidth: 18 }}
              >
                {cartCount > 99 ? "99+" : cartCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Category strip — a second nav row that stays visible on all sizes. */}
      <div className="border-t border-line/70 bg-surface/60">
        <div className="shell flex items-center gap-1 overflow-x-auto py-1.5 no-scrollbar">
          {categoryLinks.map((c) => (
            <NavLink
              key={c.slug}
              to={`/products?category=${c.slug}`}
              className={({ isActive }) =>
                `shrink-0 rounded-lg px-3 py-1.5 text-sm transition-colors ${
                  isActive
                    ? "bg-surface-3 text-fg"
                    : "text-fg-2 hover:bg-surface-2 hover:text-fg"
                }`
              }
            >
              {c.name}
              <span className="ml-1.5 text-xs text-fg-3 tabular-nums">{c.count}</span>
            </NavLink>
          ))}
        </div>
      </div>

      {/* Mobile nav drawer */}
      {mobileNav && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-ink/70 backdrop-blur-sm" onClick={() => setMobileNav(false)} />
          <div className="absolute inset-y-0 left-0 flex w-72 flex-col border-r border-line bg-surface">
            <div className="flex items-center justify-between border-b border-line px-4 py-3.5">
              <Link
                to="/"
                className="flex items-center gap-2"
                onClick={() => setMobileNav(false)}
              >
                <LogoMark size={26} />
                <span className="font-semibold text-fg">Voltify</span>
              </Link>
              <button
                type="button"
                onClick={() => setMobileNav(false)}
                aria-label="Close menu"
                className="grid h-8 w-8 place-items-center rounded-lg text-fg-3 hover:bg-surface-2 hover:text-fg"
              >
                <CloseIcon size={18} />
              </button>
            </div>
            <div className="border-b border-line p-3">
              <form onSubmit={submitSearch}>
                <div className="relative">
                  <SearchIcon
                    size={16}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-fg-3"
                  />
                  <input
                    type="search"
                    value={term}
                    onChange={(e) => setTerm(e.target.value)}
                    placeholder="Search products…"
                    aria-label="Search products"
                    className="h-10 w-full rounded-xl border border-line bg-surface-2 pl-9 pr-3 text-sm text-fg placeholder:text-fg-3 focus:border-accent focus:outline-none"
                  />
                </div>
              </form>
            </div>
            <nav className="flex-1 overflow-y-auto p-2">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileNav(false)}
                  className="block rounded-lg px-3 py-2.5 text-sm text-fg-2 transition-colors hover:bg-surface-2 hover:text-fg"
                >
                  {link.label}
                </Link>
              ))}
              <div className="my-2 border-t border-line" />
              <p className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-fg-3">
                Categories
              </p>
              {categoryLinks.map((c) => (
                <Link
                  key={c.slug}
                  to={`/products?category=${c.slug}`}
                  onClick={() => setMobileNav(false)}
                  className="flex items-center justify-between rounded-lg px-3 py-2.5 text-sm text-fg-2 transition-colors hover:bg-surface-2 hover:text-fg"
                >
                  {c.name}
                  <span className="text-xs text-fg-3 tabular-nums">{c.count}</span>
                </Link>
              ))}
            </nav>
            <div className="border-t border-line p-3">
              <AccountLinks />
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

function AccountPopover({ onClose }: { onClose: () => void }) {
  const { user, signOut, notify } = useStore();
  const navigate = useNavigate();

  if (!user) {
    return (
      <div className="absolute right-0 top-12 z-50 w-64 overflow-hidden rounded-xl border border-line bg-surface shadow-xl">
        <div className="p-4">
          <p className="text-sm font-medium text-fg">You’re browsing as a guest</p>
          <p className="mt-1 text-xs text-fg-3">
            Sign in to see your orders, addresses and wishlist.
          </p>
        </div>
        <div className="border-t border-line p-3">
          <LinkButton to="/login" size="sm" className="w-full" onClick={onClose}>
            Sign in
          </LinkButton>
        </div>
      </div>
    );
  }

  const link = (to: string, label: string) => (
    <Link
      to={to}
      onClick={onClose}
      className="flex items-center justify-between rounded-lg px-3 py-2 text-sm text-fg-2 transition-colors hover:bg-surface-2 hover:text-fg"
    >
      {label}
    </Link>
  );

  return (
    <div className="absolute right-0 top-12 z-50 w-64 overflow-hidden rounded-xl border border-line bg-surface shadow-xl">
      <div className="flex items-center gap-3 border-b border-line p-4">
        <span
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-sm font-semibold text-ink"
          style={{ background: `hsl(${user.avatarHue} 70% 62%)` }}
        >
          {user.name.charAt(0)}
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-fg">{user.name}</p>
          <p className="truncate text-xs text-fg-3">{user.email}</p>
        </div>
      </div>
      <div className="p-2">
        {user.role === "admin" ? (
          <>
            {link("/admin", "Dashboard")}
            {link("/admin/products", "Products")}
            {link("/admin/inventory", "Inventory")}
            {link("/admin/orders", "Orders")}
          </>
        ) : (
          <>
            {link("/account", "Overview")}
            {link("/account/orders", "Orders")}
            {link("/account/wishlist", "Wishlist")}
            {link("/account/addresses", "Addresses")}
          </>
        )}
      </div>
      <div className="border-t border-line p-2">
        <button
          type="button"
          onClick={() => {
            signOut();
            notify("Signed out", "info");
            onClose();
            navigate("/");
          }}
          className="w-full rounded-lg px-3 py-2 text-left text-sm text-fg-2 transition-colors hover:bg-surface-2 hover:text-fg"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}

export function MobileCartButton() {
  const { cartCount } = useStore();
  if (cartCount === 0) return null;
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 p-3 backdrop-blur sm:hidden">
      <LinkButton to="/cart" className="w-full" size="md">
        <CartIcon size={18} />
        View cart · {pluralise(cartCount, "item")}
      </LinkButton>
    </div>
  );
}