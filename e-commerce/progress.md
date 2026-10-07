# E-Commerce Project — Progress Tracker

**Last updated:** 2026-10-07  
**Branch:** main  
**Status:** Admin auth backend + pages complete; working tree has uncommitted changes

---

## Project Overview

A **React + TypeScript + Vite** e-commerce application ("Voltify") with:
- Product catalog (24 products across 6 categories)
- Shopping cart with slide-over drawer
- Product comparison tray (up to 4 products)
- Multi-step checkout (Contact → Shipping → Payment → Review)
- Customer account area (orders, wishlist, addresses)
- Admin dashboard (products, inventory, orders, analytics)
- Demo authentication for shoppers (3 seeded accounts: 2 customers, 1 admin)
- **Real admin authentication** — Express + MongoDB backend with bcrypt hashing and JWT sessions

**Tech stack (frontend):** React 19, React Router 7, Tailwind CSS 4, TypeScript, Vite 8  
**Tech stack (backend):** Node 20, Express 4, Mongoose 8, bcryptjs, jsonwebtoken, zod — TypeScript ESM (`NodeNext`)

**Currency:** INR (Indian Rupees) — all prices in integer paise (₹1 = 100 paise)

---

## Completed Features

### 🏠 Core Layout & Navigation
- **App shell** (`src/App.tsx`): Routes, scroll restoration, global providers (Store, CartDrawer, CompareTray, Toaster)
- **Header** (`src/components/Header.tsx`): Logo, search, cart button (with count), compare button, user menu, mobile menu
- **Footer** (`src/components/Footer.tsx`): Links, newsletter signup, social icons
- **Breadcrumbs** (`src/components/Primitives.tsx`): Reusable breadcrumb component

### 🛍️ Product Catalog
- **HomePage** (`src/pages/HomePage.tsx`): Hero, category tiles, deals, featured, spotlight, new arrivals, promise strip
- **CatalogPage** (`src/pages/CatalogPage.tsx`): Full filter/sort/search with URL-synced state (grid/list view, pagination)
- **ProductDetailPage** (`src/pages/ProductDetailPage.tsx`): Gallery, variant selection, stock badges, add to cart/buy now, wishlist, compare, specs, reviews (with helpful marks), related products
- **ProductCard** (`src/components/ProductCard.tsx`): Grid/list layouts, wishlist/compare buttons, stock pills, badges, skeletons

### 🛒 Cart & Checkout
- **CartDrawer** (`src/components/CartDrawer.tsx`): Slide-over panel with quantity steppers, free shipping progress bar, clear cart
- **CartPage** (`src/pages/CartPage.tsx`): Full-page cart with promo codes (VOLT10, NEWGEAR), order summary, continue shopping
- **CheckoutPage** (`src/pages/CheckoutPage.tsx`): 4-step wizard (Contact → Shipping → Payment → Review) with validation, saved addresses, card formatting
- **OrderConfirmationPage** (`src/pages/OrderConfirmationPage.tsx`): Order details, timeline, shipping/payment info, track order link

### ⚖️ Product Comparison
- **CompareTray** (`src/components/CompareTray.tsx`): Persistent bottom bar showing selected products (max 4)
- **ComparePage** (`src/pages/ComparePage.tsx`): Side-by-side spec table with union of all spec rows, difference highlighting, highlight selector

### 👤 Customer Account
- **LoginPage** (`src/pages/LoginPage.tsx`): Demo account picker (Alex, Jordan, Admin) + email fallback
- **AccountOverviewPage** (`src/pages/account/AccountOverviewPage.tsx`): Stats cards, recent orders, wishlist preview, quick actions
- **AccountOrdersPage** (`src/pages/account/AccountOrdersPage.tsx`): Filterable order list with status pills, expandable details
- **AccountOrderDetailPage** (`src/pages/account/AccountOrdersPage.tsx`): Full order view with timeline, items, shipping, payment, event log
- **AccountWishlistPage** (`src/pages/account/AccountWishlistPage.tsx`): Quantity steppers, add to cart (single/all), remove
- **AccountAddressesPage** (`src/pages/account/AccountAddressesPage.tsx`): CRUD modals, seeded demo addresses, default marking

### 🛠️ Admin Dashboard
- **AdminLayout** (`src/pages/admin/AdminLayout.tsx`): Sidebar nav, user avatar, reset demo data button
- **AdminOverviewPage** (`src/pages/admin/AdminOverviewPage.tsx`): KPI cards (revenue, orders, AOV, fulfilment), low stock alerts, recent orders, quick links
- **AdminProductsPage** (`src/pages/admin/AdminProductsPage.tsx`): Searchable/filterable table, inline editor for price/compare-at/stock
- **AdminInventoryPage** (`src/pages/admin/AdminInventoryPage.tsx`): Per-variant stock editor with blur-to-save, low-stock filter, summary stats
- **AdminOrdersPage** (`src/pages/admin/AdminOrdersPage.tsx`): Order management with status advancement (placed→processing→shipped→delivered), cancellation with stock restore, expandable details

### 🔐 Admin Authentication (new — real backend)

The storefront's shopper login is still the seeded demo picker. Admin access is now a
separate, real authentication system backed by the Express/MongoDB API.

**Backend (`backend/src/`):**
- **index.ts** — Bootstrap; awaits the Mongo connection before opening the listener
- **app.ts** — Express assembly, exported separately so routes can be mounted without a port
- **config.ts** — Env config; `MONGODB_URI` and `ADMIN_JWT_SECRET` are **required, not defaulted** (a fallback signing key would accept forgeable tokens)
- **db.ts** — Mongoose connection; logs the URI with credentials redacted
- **auth/tokens.ts** — Sign/verify with issuer, audience, and a pinned HS256 algorithm
- **middleware/auth.ts** — `requireAdmin` (re-reads the document so deactivation takes effect immediately) and `requirePermission`
- **middleware/asyncHandler.ts** — Express 4 does not catch async rejections; without this a thrown error hangs the request
- **middleware/errors.ts** — Terminal error handler; Zod and Mongoose validation errors become 400s, duplicate-key becomes 409
- **routes/adminAuth.ts** — `POST /register`, `POST /login`, `GET /me`
- **models/Admin.ts** — email, username, passwordHash, role, permissions, lastLoginAt, isActive

**Frontend:**
- **AdminLoginPage** (`src/pages/admin/AdminLoginPage.tsx`) — `/admin/login`, handles expired-session messaging and per-field errors
- **AdminRegisterPage** (`src/pages/admin/AdminRegisterPage.tsx`) — `/admin/register`, live password-strength checklist, confirm-password match
- **AdminAuthContext** (`src/store/AdminAuthContext.tsx`) — Separate admin session; revalidates the stored token against `/me` on mount so an expired token isn't mistaken for a live one
- **adminApi** (`src/data/adminApi.ts`) — Real fetch client; `AdminApiError` normalises failures, `voltify:admin-session` namespace
- **adminGuards** (`src/components/adminGuards.tsx`) — `RequireAdminAuth` / `RedirectIfAdminAuthed`

**Security properties:**
- Passwords bcrypt-hashed at cost 12; plaintext never stored or logged
- Registration is open but **self-registered accounts always land as `moderator`** with read-only permissions — promotion requires a superadmin in the database
- Login is timing-equalized: a missing email still runs a bcrypt compare against a real hash, so response time doesn't reveal which emails exist
- Duplicate email/username returns one generic message, so the endpoint can't be used to enumerate accounts
- Bearer tokens only (no cookies), so CORS never needs credentials enabled
- `lastLoginAt` recorded on every successful sign-in

### 🔧 Shared Infrastructure
- **StoreContext** (`src/store/StoreContext.tsx`): Centralized reducer for cart, wishlist, compare, recent, shopper session, addresses, toasts — all persisted to localStorage
- **API Layer** (`src/data/api.ts`): Async mock API with latency, catalog overrides, reviews, orders, addresses, admin mutations
- **Catalog Data** (`src/data/catalog.ts`): 24 products with variants, specs, badges, pricing, stock; categories, brands, price bounds
- **Seed Data** (`src/data/seed.ts`): Demo users, addresses, orders (17 seeded), shipping/tax calculations — `FREE_SHIPPING_THRESHOLD: 1500000` (₹15,000), `SMALL_ORDER_CUTOFF: 750000` (₹7,500), `SMALL_ORDER_SHIPPING: 10000` (₹100), `taxFor: 18%` GST
- **Reviews** (`src/data/reviews.ts`): Seeded reviews + rating distribution helper
- **Format Helpers** (`src/lib/format.ts`): Price, date, timeAgo, percentOff, pluralise, clamp, lineId — `Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 0, maximumFractionDigits: 0 })`
- **Product Art** (`src/lib/productArt.tsx`): Deterministic SVG illustrations per product (6 category renderers)
- **Storage** (`src/lib/storage.ts`): localStorage wrapper with namespacing, safe JSON parse, clearAll
- **Icons** (`src/components/Icons.tsx`): 30+ inline SVG icons (currentColor, size prop)
- **Primitives** (`src/components/Primitives.tsx`): Button, LinkButton, Card, Badge, Rating, QtyStepper, Modal, Pagination, Skeleton, EmptyState, ErrorState, SectionHeading, Field, Select, Checkbox, Toggle, Breadcrumbs
- **Guards** (`src/components/guards.tsx`): RequireAuth (with adminOnly), RedirectIfAuthed — for the **shopper** session
- **Toaster** (`src/components/Toaster.tsx`): Auto-dismissing toast notifications

### 🐳 Infrastructure
- **docker-compose.yml** — `mongodb` (mongo:7-alpine, healthcheck, init script) and `backend` (node:20-alpine, depends on a healthy Mongo)
- **docker/mongo-init.js** — Creates all 8 collections with `$jsonSchema` validators and indexes, including `admins`
- **docker/backend.Dockerfile** — Alpine, dependency layer cached ahead of source
- **vite.config.ts** — `/api` proxied to `http://localhost:3001`, so the browser stays on one origin and the token never crosses a CORS boundary

---

## Data Model (from `src/types.ts`)

| Type | Purpose |
|------|---------|
| `Product` | Full product with variants, specs, badges, pricing |
| `VariantOption` | Variant group/value, hex, priceDelta, stock |
| `CartLine` | Cart entry with variantValue, quantity |
| `Order` | Complete order with items, totals, timeline, addresses, payment |
| `OrderStatus` | placed \| processing \| shipped \| delivered \| cancelled |
| `User` | id, name, email, role (customer/admin), avatarHue |
| `Address` | Full shipping address with label, isDefault |
| `Review` | Product reviews with helpful marks |
| `ProductQuery` | Catalog filters (search, category, brand, price, rating, stock, sale, sort, page) |

---

## Key Design Decisions

1. **Two separate auth systems** — Shopper login stays a localStorage demo picker; admin login is a real JWT session against the API. Keeping them apart means an admin signing in never disturbs a customer mid-checkout, and `/admin` no longer hangs off `RequireAuth`
2. **Open registration, weak by default** — Anyone can register, but self-registered accounts always get role `moderator` with read-only permissions. A stranger who reaches the register page cannot hand themselves the store
3. **Required secrets, never defaulted** — `config.ts` throws if `MONGODB_URI` or `ADMIN_JWT_SECRET` is missing. A boot-time fallback signing key would silently accept forgeable tokens
4. **Middleware re-reads the admin document** — A valid signature alone isn't enough; the account could be deleted or deactivated since the token was issued. Re-reading means deactivation takes effect immediately rather than at token expiry
5. **Timing-equalized login** — A missing email still runs a bcrypt compare against a real dummy hash, so a wrong email and a wrong password take comparable time
6. **Express 4 async safety** — `asyncHandler` wraps every async route; Express 4 doesn't catch rejected promises, so an unhandled rejection hangs the request until the client times out
7. **Token revalidation on mount** — `AdminAuthContext` calls `/me` on load, so a token that expired overnight isn't read as a live session straight from localStorage
8. **No backend (storefront)** — Catalog, cart, orders, and reviews still live in localStorage; the API layer simulates 260ms latency. Only admin auth is real so far
9. **Sparse overrides** — Admin edits stored as deltas over static catalog (`NS.products`)
10. **Single reducer** — All cross-route shopper state in one `StoreContext` with `useReducer`
11. **URL-synced filters** — Catalog page uses `useSearchParams` for shareable/back-button-friendly filters
12. **Deterministic art** — Product illustrations generated from product ID hash (no images needed)
13. **Paise-based money** — All prices in integer paise (₹1 = 100 paise) to avoid float drift; INR has no decimal subdivision in common usage so `minimumFractionDigits: 0, maximumFractionDigits: 0`

---

## Verification Status

Admin auth has been exercised against real MongoDB, not mocks.

| Check | Result |
|-------|--------|
| `npm run smoke` (in-memory Mongo, 17 assertions) | 17 passed, 0 failed |
| Auth suite against MongoDB Atlas (11 assertions) | 11 passed, 0 failed |
| Backend `tsc --noEmit` | Clean |
| Frontend `tsc -b` | Clean |
| `vite build` | Succeeds |

**Coverage:** registration, bcrypt hashing, weak-password and confirmation-mismatch rejection,
duplicate email (409), login success, case-insensitive email, wrong password (401), unknown email
(401 not 500), `/me` with a valid token, missing token, tampered token, foreign-signed token,
deactivated account, `lastLoginAt`, 404 handling, health endpoint.

**Not yet verified:** the `docker-compose.yml` wiring itself — no Docker daemon was available in
the environment where this was built. The `ADMIN_JWT_SECRET`/`ADMIN_ORIGIN` service env and the
`/api` Vite proxy should be checked with `docker compose up -d`.

**Tooling note:** `mongodb-memory-server` (devDependency) downloads a real MongoDB binary on first
run (~100 MB, then cached). Its binary tracks its own default version, which may differ from the
`mongo:7-alpine` tag pinned in compose — the smoke test validates auth logic, not parity with that
exact build.

---

## File Structure Summary

```
src/
├── App.tsx                    # Routes, providers, shell
├── main.tsx                   # Entry point
├── types.ts                   # All TypeScript interfaces
├── index.css                  # Tailwind + custom CSS variables
├── components/
│   ├── Primitives.tsx         # 15+ reusable UI components
│   ├── Icons.tsx              # 30+ inline SVG icons
│   ├── Header.tsx             # Top navigation
│   ├── Footer.tsx             # Site footer
│   ├── CartDrawer.tsx         # Slide-over cart
│   ├── CompareTray.tsx        # Bottom comparison bar
│   ├── Toaster.tsx            # Toast notifications
│   ├── ProductCard.tsx        # Product grid/list card
│   └── guards.tsx             # Auth route guards
├── pages/
│   ├── HomePage.tsx           # Landing page
│   ├── CatalogPage.tsx        # Product listing with filters
│   ├── ProductDetailPage.tsx  # Product detail + reviews
│   ├── CartPage.tsx           # Full cart page
│   ├── CheckoutPage.tsx       # 4-step checkout
│   ├── OrderConfirmationPage.tsx
│   ├── LoginPage.tsx          # Demo login
│   ├── NotFoundPage.tsx       # 404
│   ├── ComparePage.tsx        # Side-by-side comparison
│   ├── account/
│   │   ├── AccountLayout.tsx
│   │   ├── AccountOverviewPage.tsx
│   │   ├── AccountOrdersPage.tsx (includes AccountOrderDetailPage)
│   │   ├── AccountWishlistPage.tsx
│   │   └── AccountAddressesPage.tsx
│   └── admin/
│       ├── AdminLayout.tsx
│       ├── AdminOverviewPage.tsx
│       ├── AdminProductsPage.tsx
│       ├── AdminInventoryPage.tsx
│       ├── AdminOrdersPage.tsx
│       ├── AdminLoginPage.tsx      # Real backend sign-in
│       └── AdminRegisterPage.tsx   # Real backend registration
├── store/
│   ├── StoreContext.tsx       # Shopper state + persistence
│   └── AdminAuthContext.tsx   # Admin JWT session (separate)
├── components/
│   └── adminGuards.tsx        # RequireAdminAuth, RedirectIfAdminAuthed
├── data/
│   ├── catalog.ts             # Product catalog (24 products)
│   ├── api.ts                 # Mock API layer (storefront)
│   ├── adminApi.ts            # Real fetch client for admin auth
│   ├── seed.ts                # Demo users, addresses, orders
│   └── reviews.ts             # Seeded reviews + helpers
└── lib/
    ├── format.ts              # Formatting utilities
    ├── storage.ts             # localStorage wrapper
    └── productArt.tsx         # Deterministic SVG product art

backend/
├── .env.example               # Env template (secrets required)
├── scripts/
│   └── smoke-admin-auth.ts    # 17-assertion smoke test
└── src/
    ├── index.ts               # Bootstrap
    ├── app.ts                 # Express assembly (testable without a port)
    ├── config.ts              # Env config, required secrets
    ├── db.ts                  # Mongoose connection
    ├── types.ts               # AdminPrincipal, token payload
    ├── auth/
    │   └── tokens.ts          # JWT sign/verify
    ├── middleware/
    │   ├── auth.ts            # requireAdmin, requirePermission
    │   ├── asyncHandler.ts    # Express 4 async rejection wrapper
    │   └── errors.ts          # Zod/Mongoose/duplicate-key handling
    ├── routes/
    │   └── adminAuth.ts       # POST /register, /login, GET /me
    └── models/
        ├── index.ts
        ├── Admin.ts           # Admin credentials + roles
        ├── User.ts, Product.ts, Order.ts, Address.ts,
        ├── Review.ts, Cart.ts, Wishlist.ts
```

---

## Environment Configuration

`backend/config.ts` requires these; the server refuses to boot without them.

| Variable | Required | Default | Purpose |
|----------|----------|---------|---------|
| `MONGODB_URI` | ✅ | — | Mongo connection string |
| `ADMIN_JWT_SECRET` | ✅ | — | Signs admin session tokens |
| `PORT` | — | `3001` | API port |
| `ADMIN_TOKEN_TTL` | — | `8h` | Admin session lifetime |
| `ADMIN_ORIGIN` | — | `http://localhost:5173` | Comma-separated CORS allow-list |
| `NODE_ENV` | — | `development` | — |

**Generating a secret:** `openssl rand -base64 48`

`docker-compose.yml` supplies a **dev-only** fallback secret for local convenience — generate a
real one before any shared deployment.

`.env` belongs at `backend/.env`. It is git-ignored (via the system `/etc/.gitignore`), so the
Atlas credential will not be committed.

---

## Known Limitations / Future Work

| Area | Notes |
|------|-------|
| **Admin promotion** | No UI to promote a moderator — must be done directly in the database. A superadmin management screen is the obvious next step |
| **Storefront auth** | Shopper login is still the demo picker; no passwords or JWT |
| **Backend scope** | Only admin auth has a server. Catalog, cart, orders, and reviews are still localStorage |
| **Docker wiring** | Compose file unverified — no daemon available in the build environment |
| **Rate limiting** | No brute-force protection on `/login`; add `express-rate-limit` before any public deployment |
| **Token refresh** | Tokens are fixed-lifetime with no refresh; an admin must re-enter credentials on expiry |
| **Password reset** | No email flow for recovering a forgotten admin password |
| **Payments** | Mock only; no Stripe/PayPal integration |
| **Images** | No product photography; all SVG art |
| **Search** | Client-side only; no Algolia/Meilisearch |
| **i18n** | English only; currency INR (Indian Rupees) with `en-IN` locale |
| **Accessibility** | Good baseline but not fully audited |
| **Tests** | Admin auth has a smoke script; no runner, no component or e2e tests |
| **PWA** | No service worker or manifest |
| **Analytics** | No event tracking |
| **Email** | No transactional emails (order confirmation, etc.) |

---

## How to Resume

**Frontend (storefront + admin UI):**
```bash
cd /home/runner/workspace/e-commerce
npm install        # or bun install
npm run dev        # Vite dev server on :5173
```

**Backend (admin API):**
```bash
cd backend
npm install
cp .env.example .env    # then set MONGODB_URI and ADMIN_JWT_SECRET
npm run dev             # API on :3001
npm run smoke           # 17-assertion smoke test
```

Or bring up MongoDB + API together:
```bash
docker compose up -d
```

**Shopper demo accounts (localStorage picker, no password):**
- `alex@voltify.demo` — Customer with order history
- `jordan@voltify.demo` — Customer with different orders
- `admin@voltify.demo` — Reaches the admin dashboard via the demo guard only

**Admin accounts** come from the API, not the seed file. Register at `/admin/register`; the
account lands as a moderator. Promote it by hand to test superadmin behaviour:
```js
db.admins.updateOne({ username: "yourname" }, { $set: { role: "superadmin" } })
```

**Storefront admin edits persist to localStorage** — use "Reset demo data" in the admin sidebar to
restore the original catalog.

---

## Next Session Ideas

1. **Admin management UI** — List, promote, deactivate, and reset passwords for admin accounts (the highest-value follow-up: registration is open but there's no way to elevate through the app)
2. **Rate limiting** — `express-rate-limit` on `/login` and `/register`
3. **Verify Docker compose** — `docker compose up -d` and confirm the proxy, env, and healthcheck all work together
4. **Backend for storefront data** — Move catalog/orders/reviews off localStorage onto the models that already exist
5. **Add a test runner** — Vitest + supertest, converting the smoke script into real specs
6. **Real images** — Integrate placeholder image service or local assets
7. **Search enhancement** — Add debounced server-style search with loading states
8. **Wishlist sharing** — Generate shareable wishlist URLs
9. **Order PDF** — Generate printable order confirmations
10. **Accessibility audit** — Run axe-core, fix any violations

---

## Technical Debt

| Issue | Location | Notes |
|-------|----------|-------|
| `Date.now()` called during render | `src/pages/admin/AdminOverviewPage.tsx` | Pre-existing; flagged by `react-hooks/purity` |
| Duplicate schema indexes | `backend/src/models/Cart.ts`, `Wishlist.ts` | Index declared both as `index: true` and via `schema.index()`; Mongoose warns at boot |
| `react-refresh/only-export-components` | `src/store/AdminAuthContext.tsx`, `StoreContext.tsx` | Provider + hook in one file; matches existing convention, left as-is |

---

## Git History

```
b9aa82f Implement e-commerce cart, comparison features, and UI components
1f7cdd2 Initial commit
```

**Working tree has uncommitted changes** — modified: `src/App.tsx`, `src/lib/storage.ts`,
`vite.config.ts`, `src/data/seed.ts`, `src/lib/format.ts`; untracked: `backend/`, `docker/`,
`docker-compose.yml`, `src/pages/admin/AdminLoginPage.tsx`,
`src/pages/admin/AdminRegisterPage.tsx`, `src/store/AdminAuthContext.tsx`,
`src/data/adminApi.ts`, `src/components/adminGuards.tsx`, `progress.md`

---

## Git History

```
b9aa82f Implement e-commerce cart, comparison features, and UI components
1f7cdd2 Initial commit
```

Working tree is clean — no uncommitted changes.