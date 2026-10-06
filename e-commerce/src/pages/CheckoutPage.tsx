import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import type { Address } from "../types";
import { useStore } from "../store/StoreContext";
import { placeOrder } from "../data/api";
import { formatPrice } from "../lib/format";
import { ProductArt } from "../lib/productArt";
import { OrderSummary } from "./CartPage";
import {
  Badge,
  Button,
  EmptyState,
  Field,
  LinkButton,
  inputClass,
} from "../components/Primitives";
import { CheckIcon, ChevronLeft, LockIcon, ShieldIcon } from "../components/Icons";

const STEPS = ["Contact", "Shipping", "Payment", "Review"] as const;
type Step = (typeof STEPS)[number];

const COUNTRIES = [
  "United States",
  "United Kingdom",
  "Canada",
  "Germany",
  "France",
  "Netherlands",
  "Australia",
  "Japan",
];

interface FormState {
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  line1: string;
  line2: string;
  city: string;
  region: string;
  postcode: string;
  country: string;
  cardNumber: string;
  cardName: string;
  expiry: string;
  cvc: string;
}

const EMPTY: FormState = {
  email: "",
  phone: "",
  firstName: "",
  lastName: "",
  line1: "",
  line2: "",
  city: "",
  region: "",
  postcode: "",
  country: "United States",
  cardNumber: "",
  cardName: "",
  expiry: "",
  cvc: "",
};

/** Groups digits into 4s as the shopper types. */
function formatCardNumber(value: string): string {
  return value
    .replace(/\D/g, "")
    .slice(0, 16)
    .replace(/(.{4})/g, "$1 ")
    .trim();
}

function formatExpiry(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

/** Derives the brand from the leading digits, the way a real gateway would. */
function cardBrand(number: string): string {
  const d = number.replace(/\D/g, "");
  if (/^4/.test(d)) return "Visa";
  if (/^5[1-5]/.test(d)) return "Mastercard";
  if (/^3[47]/.test(d)) return "Amex";
  if (/^6/.test(d)) return "Discover";
  return "Card";
}

export function CheckoutPage() {
  const navigate = useNavigate();
  const { cartEntries, cartSubtotal, user, addresses, saveAddress, dispatch, notify } = useStore();

  const [step, setStep] = useState<Step>("Contact");
  const [form, setForm] = useState<FormState>(() => ({
    ...EMPTY,
    email: user?.email ?? "",
    firstName: user?.name.split(" ")[0] ?? "",
    lastName: user?.name.split(" ").slice(1).join(" ") ?? "",
  }));
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [billingSame, setBillingSame] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [placeError, setPlaceError] = useState("");

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  if (cartEntries.length === 0) {
    return (
      <div className="shell py-16">
        <div className="mx-auto max-w-md">
          <EmptyState
            icon={<LockIcon size={24} />}
            title="Nothing to check out"
            description="Your cart is empty. Add a product and come back."
            action={<LinkButton to="/products">Browse products</LinkButton>}
          />
        </div>
      </div>
    );
  }

  const validateStep = (target: Step): boolean => {
    const next: Partial<Record<keyof FormState, string>> = {};

    if (target === "Contact") {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) next.email = "Enter a valid email address";
      if (form.phone.replace(/\D/g, "").length < 7) next.phone = "Enter a contact number";
    }

    if (target === "Shipping") {
      if (!form.firstName.trim()) next.firstName = "Required";
      if (!form.lastName.trim()) next.lastName = "Required";
      if (!form.line1.trim()) next.line1 = "Required";
      if (!form.city.trim()) next.city = "Required";
      if (!form.region.trim()) next.region = "Required";
      if (form.postcode.trim().length < 3) next.postcode = "Required";
    }

    if (target === "Payment") {
      const digits = form.cardNumber.replace(/\D/g, "");
      if (digits.length < 13) next.cardNumber = "Enter a 13–16 digit card number";
      if (!form.cardName.trim()) next.cardName = "Required";
      const exp = form.expiry.replace(/\D/g, "");
      if (exp.length !== 4) next.expiry = "MM/YY";
      if (form.cvc.replace(/\D/g, "").length < 3) next.cvc = "3–4 digits";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const goNext = () => {
    if (!validateStep(step)) return;
    const i = STEPS.indexOf(step);
    if (i < STEPS.length - 1) setStep(STEPS[i + 1]);
  };

  const goBack = () => {
    const i = STEPS.indexOf(step);
    if (i > 0) setStep(STEPS[i - 1]);
  };

  const buildAddress = (): Address => ({
    id: `a-${Date.now().toString(36)}`,
    userId: user?.id ?? "guest",
    label: "Shipping",
    fullName: `${form.firstName} ${form.lastName}`.trim(),
    line1: form.line1.trim(),
    line2: form.line2.trim() || undefined,
    city: form.city.trim(),
    region: form.region.trim(),
    postcode: form.postcode.trim(),
    country: form.country,
    phone: form.phone.trim(),
    isDefault: addresses.length === 0,
  });

  const submit = async () => {
    if (!validateStep("Payment")) {
      setStep("Payment");
      return;
    }
    setSubmitting(true);
    setPlaceError("");

    const address = buildAddress();
    // Persist the address when signed in so it can be reused next time.
    if (user) await saveAddress(address);

    try {
      const order = await placeOrder({
        userId: user?.id ?? "guest",
        items: cartEntries.map((e) => ({
          productId: e.productId,
          variantValue: e.variantValue,
          quantity: e.quantity,
        })),
        address,
        paymentBrand: cardBrand(form.cardNumber),
        paymentLast4: form.cardNumber.replace(/\D/g, "").slice(-4),
        billingSameAsShipping: billingSame,
      });
      dispatch({ type: "cart/clear" });
      navigate(`/order-confirmation/${order.id}`, { replace: true });
    } catch (err) {
      setPlaceError(err instanceof Error ? err.message : "Something went wrong placing the order");
      setSubmitting(false);
    }
  };

  const stepIndex = STEPS.indexOf(step);
  const cardBrandName = cardBrand(form.cardNumber);

  return (
    <div className="shell py-8">
      <Link
        to="/cart"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-fg-3 transition-colors hover:text-fg"
      >
        <ChevronLeft size={15} /> Back to cart
      </Link>

      <h1 className="text-2xl font-semibold tracking-tight text-fg sm:text-3xl">Checkout</h1>

      {/* Step indicator */}
      <ol className="mt-6 mb-8 flex items-center gap-1 sm:gap-2" aria-label="Checkout progress">
        {STEPS.map((s, i) => {
          const done = i < stepIndex;
          const current = i === stepIndex;
          return (
            <li key={s} className="flex flex-1 items-center gap-1 sm:gap-2">
              <button
                type="button"
                disabled={i > stepIndex}
                onClick={() => setStep(s)}
                className={`flex items-center gap-2 disabled:cursor-default ${
                  i <= stepIndex ? "text-fg" : "text-fg-3"
                }`}
              >
                <span
                  className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-semibold transition-colors ${
                    done
                      ? "bg-success text-ink"
                      : current
                        ? "bg-accent text-ink"
                        : "border border-line bg-surface-2 text-fg-3"
                  }`}
                >
                  {done ? <CheckIcon size={13} /> : i + 1}
                </span>
                <span
                  className={`hidden text-sm sm:block ${current ? "font-medium" : ""}`}
                >
                  {s}
                </span>
              </button>
              {i < STEPS.length - 1 && (
                <span
                  className={`h-px flex-1 transition-colors ${done ? "bg-success/40" : "bg-line"}`}
                  aria-hidden
                />
              )}
            </li>
          );
        })}
      </ol>

      <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <div className="rounded-2xl border border-line bg-surface p-5 sm:p-6">
          {/* ── Contact ── */}
          {step === "Contact" && (
            <section>
              <h2 className="text-lg font-semibold text-fg">Contact details</h2>
              <p className="mt-1 text-sm text-fg-3">
                We’ll send your receipt and delivery updates here.
              </p>

              <div className="mt-5 space-y-4">
                <Field label="Email address" htmlFor="email" error={errors.email} required>
                  <input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={(e) => set("email", e.target.value)}
                    className={inputClass(Boolean(errors.email))}
                    placeholder="you@example.com"
                    autoComplete="email"
                  />
                </Field>

                <Field label="Phone number" htmlFor="phone" error={errors.phone} required>
                  <input
                    id="phone"
                    type="tel"
                    value={form.phone}
                    onChange={(e) => set("phone", e.target.value)}
                    className={inputClass(Boolean(errors.phone))}
                    placeholder="+1 415 555 0100"
                    autoComplete="tel"
                  />
                </Field>

                {!user && (
                  <div className="rounded-xl border border-line bg-surface-2 px-4 py-3 text-sm">
                    <p className="text-fg-2">
                      Checking out as a guest.{" "}
                      <Link to="/login" className="text-accent underline-offset-2 hover:underline">
                        Sign in
                      </Link>{" "}
                      to save this address and track the order.
                    </p>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* ── Shipping ── */}
          {step === "Shipping" && (
            <section>
              <h2 className="text-lg font-semibold text-fg">Shipping address</h2>

              {user && addresses.length > 0 && (
                <div className="mt-5 space-y-2">
                  <p className="text-sm font-medium text-fg-2">Saved addresses</p>
                  {addresses.map((a) => (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => {
                        setForm((f) => ({
                          ...f,
                          firstName: a.fullName.split(" ")[0],
                          lastName: a.fullName.split(" ").slice(1).join(" "),
                          line1: a.line1,
                          line2: a.line2 ?? "",
                          city: a.city,
                          region: a.region,
                          postcode: a.postcode,
                          country: a.country,
                          phone: a.phone,
                        }));
                        setErrors({});
                      }}
                      className="block w-full rounded-xl border border-line bg-surface-2 px-4 py-3 text-left text-sm transition-colors hover:border-line-strong"
                    >
                      <span className="flex items-center gap-2">
                        <span className="font-medium text-fg">{a.label}</span>
                        {a.isDefault && <Badge tone="neutral">Default</Badge>}
                      </span>
                      <span className="mt-1 block text-fg-3">
                        {a.line1}
                        {a.line2 ? `, ${a.line2}` : ""}, {a.city} {a.region} {a.postcode},{" "}
                        {a.country}
                      </span>
                    </button>
                  ))}
                  <p className="pt-1 text-xs text-fg-3">Or enter a new address below.</p>
                </div>
              )}

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <Field label="First name" htmlFor="firstName" error={errors.firstName} required>
                  <input
                    id="firstName"
                    value={form.firstName}
                    onChange={(e) => set("firstName", e.target.value)}
                    className={inputClass(Boolean(errors.firstName))}
                    autoComplete="given-name"
                  />
                </Field>
                <Field label="Last name" htmlFor="lastName" error={errors.lastName} required>
                  <input
                    id="lastName"
                    value={form.lastName}
                    onChange={(e) => set("lastName", e.target.value)}
                    className={inputClass(Boolean(errors.lastName))}
                    autoComplete="family-name"
                  />
                </Field>

                <div className="sm:col-span-2">
                  <Field label="Address" htmlFor="line1" error={errors.line1} required>
                    <input
                      id="line1"
                      value={form.line1}
                      onChange={(e) => set("line1", e.target.value)}
                      className={inputClass(Boolean(errors.line1))}
                      placeholder="Street address"
                      autoComplete="address-line1"
                    />
                  </Field>
                </div>

                <div className="sm:col-span-2">
                  <Field label="Apartment, suite (optional)" htmlFor="line2">
                    <input
                      id="line2"
                      value={form.line2}
                      onChange={(e) => set("line2", e.target.value)}
                      className={inputClass(false)}
                      autoComplete="address-line2"
                    />
                  </Field>
                </div>

                <Field label="City" htmlFor="city" error={errors.city} required>
                  <input
                    id="city"
                    value={form.city}
                    onChange={(e) => set("city", e.target.value)}
                    className={inputClass(Boolean(errors.city))}
                    autoComplete="address-level2"
                  />
                </Field>
                <Field label="State / region" htmlFor="region" error={errors.region} required>
                  <input
                    id="region"
                    value={form.region}
                    onChange={(e) => set("region", e.target.value)}
                    className={inputClass(Boolean(errors.region))}
                    autoComplete="address-level1"
                  />
                </Field>
                <Field label="Postcode" htmlFor="postcode" error={errors.postcode} required>
                  <input
                    id="postcode"
                    value={form.postcode}
                    onChange={(e) => set("postcode", e.target.value)}
                    className={inputClass(Boolean(errors.postcode))}
                    autoComplete="postal-code"
                  />
                </Field>
                <Field label="Country" htmlFor="country">
                  <select
                    id="country"
                    value={form.country}
                    onChange={(e) => set("country", e.target.value)}
                    className={inputClass(false)}
                    autoComplete="country-name"
                  >
                    {COUNTRIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
            </section>
          )}

          {/* ── Payment ── */}
          {step === "Payment" && (
            <section>
              <h2 className="text-lg font-semibold text-fg">Payment</h2>
              <div className="mt-2 flex items-center gap-2 rounded-lg border border-info/30 bg-info/10 px-3 py-2 text-sm text-info">
                <ShieldIcon size={15} className="shrink-0" />
                Demonstration storefront — no card is charged and no data leaves this browser.
              </div>

              <div className="mt-5 space-y-4">
                <Field label="Card number" htmlFor="cardNumber" error={errors.cardNumber} required>
                  <div className="relative">
                    <input
                      id="cardNumber"
                      value={form.cardNumber}
                      onChange={(e) => set("cardNumber", formatCardNumber(e.target.value))}
                      className={`${inputClass(Boolean(errors.cardNumber))} pr-20`}
                      placeholder="4242 4242 4242 4242"
                      inputMode="numeric"
                      autoComplete="cc-number"
                    />
                    {form.cardNumber && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-fg-3">
                        {cardBrandName}
                      </span>
                    )}
                  </div>
                </Field>

                <Field label="Name on card" htmlFor="cardName" error={errors.cardName} required>
                  <input
                    id="cardName"
                    value={form.cardName}
                    onChange={(e) => set("cardName", e.target.value)}
                    className={inputClass(Boolean(errors.cardName))}
                    autoComplete="cc-name"
                  />
                </Field>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Expiry" htmlFor="expiry" error={errors.expiry} required>
                    <input
                      id="expiry"
                      value={form.expiry}
                      onChange={(e) => set("expiry", formatExpiry(e.target.value))}
                      className={inputClass(Boolean(errors.expiry))}
                      placeholder="MM/YY"
                      inputMode="numeric"
                      autoComplete="cc-exp"
                    />
                  </Field>
                  <Field label="CVC" htmlFor="cvc" error={errors.cvc} required>
                    <input
                      id="cvc"
                      value={form.cvc}
                      onChange={(e) => set("cvc", e.target.value.replace(/\D/g, "").slice(0, 4))}
                      className={inputClass(Boolean(errors.cvc))}
                      placeholder="123"
                      inputMode="numeric"
                      autoComplete="cc-csc"
                    />
                  </Field>
                </div>

                <label className="flex cursor-pointer items-start gap-2.5 text-sm text-fg-2">
                  <input
                    type="checkbox"
                    checked={billingSame}
                    onChange={(e) => setBillingSame(e.target.checked)}
                    className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--color-accent)]"
                  />
                  Billing address is the same as shipping
                </label>
              </div>
            </section>
          )}

          {/* ── Review ── */}
          {step === "Review" && (
            <section>
              <h2 className="text-lg font-semibold text-fg">Review your order</h2>

              <div className="mt-5 space-y-3">
                <ReviewBlock label="Contact" onEdit={() => setStep("Contact")}>
                  {form.email}
                  <br />
                  {form.phone}
                </ReviewBlock>

                <ReviewBlock label="Ship to" onEdit={() => setStep("Shipping")}>
                  {form.firstName} {form.lastName}
                  <br />
                  {form.line1}
                  {form.line2 ? `, ${form.line2}` : ""}
                  <br />
                  {form.city}, {form.region} {form.postcode}
                  <br />
                  {form.country}
                </ReviewBlock>

                <ReviewBlock label="Payment" onEdit={() => setStep("Payment")}>
                  {cardBrandName} ending {form.cardNumber.replace(/\D/g, "").slice(-4)}
                  <br />
                  {form.expiry}
                </ReviewBlock>
              </div>

              <ul className="mt-6 divide-y divide-line rounded-xl border border-line">
                {cartEntries.map((e) => (
                  <li key={e.id} className="flex items-center gap-3 p-3">
                    <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-surface-2">
                      <ProductArt product={e.product} className="h-full w-full" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-fg">{e.product.name}</p>
                      <p className="truncate text-xs text-fg-3">
                        {e.variantValue ? `${e.variantValue} · ` : ""}Qty {e.quantity}
                      </p>
                    </div>
                    <span className="shrink-0 text-sm font-medium text-fg tabular-nums">
                      {formatPrice(e.lineTotal)}
                    </span>
                  </li>
                ))}
              </ul>

              {placeError && (
                <div className="mt-4 rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
                  {placeError}
                </div>
              )}
            </section>
          )}

          {/* Navigation */}
          <div className="mt-8 flex items-center gap-3 border-t border-line pt-5">
            {step !== "Contact" && (
              <Button variant="secondary" onClick={goBack}>
                Back
              </Button>
            )}
            {step !== "Review" ? (
              <Button onClick={goNext} className="flex-1 sm:flex-none sm:px-10">
                Continue
              </Button>
            ) : (
              <Button onClick={submit} disabled={submitting} className="flex-1 sm:px-10">
                {submitting ? "Placing order…" : `Pay ${formatPrice(cartSubtotal)}`}
              </Button>
            )}
          </div>

          {!user && (
            <p className="mt-3 text-center text-xs text-fg-3">
              By placing this order you agree to the (fictional) terms of sale.
            </p>
          )}
        </div>

        <div className="lg:sticky lg:top-32 lg:self-start">
          <OrderSummary subtotal={cartSubtotal}>
            <div className="px-5 pb-5">
              <ul className="space-y-3 border-t border-line pt-4">
                {cartEntries.map((e) => (
                  <li key={e.id} className="flex items-center gap-3 text-sm">
                    <div className="h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-surface-2">
                      <ProductArt product={e.product} className="h-full w-full" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-fg-2">{e.product.name}</p>
                      <p className="text-xs text-fg-3">Qty {e.quantity}</p>
                    </div>
                    <span className="shrink-0 text-fg-2 tabular-nums">
                      {formatPrice(e.lineTotal)}
                    </span>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={() => {
                  notify("Edit the cart before applying a promo", "info");
                  navigate("/cart");
                }}
                className="mt-4 text-xs text-fg-3 underline-offset-2 transition-colors hover:text-fg hover:underline"
              >
                Promo codes are applied on the cart page
              </button>
            </div>
          </OrderSummary>
        </div>
      </div>
    </div>
  );
}

function ReviewBlock({
  label,
  onEdit,
  children,
}: {
  label: string;
  onEdit: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-line bg-surface-2 px-4 py-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-fg-3">
          {label}
        </span>
        <button
          type="button"
          onClick={onEdit}
          className="text-xs font-medium text-accent underline-offset-2 hover:underline"
        >
          Edit
        </button>
      </div>
      <p className="mt-1.5 text-sm leading-relaxed text-fg-2">{children}</p>
    </div>
  );
}