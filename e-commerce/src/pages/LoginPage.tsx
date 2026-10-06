import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { DEMO_USERS } from "../data/seed";
import { useStore } from "../store/StoreContext";
import { Badge, Button, Field, inputClass } from "../components/Primitives";
import { CheckIcon, LogoMark } from "../components/Icons";

/**
 * Demo authentication. There is no password check and no session token — the
 * shopper picks one of three seeded accounts and the store keeps their id.
 * The point is to make every surface reachable, not to be secure.
 */
export function LoginPage() {
  const { signIn, notify } = useStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  const from = typeof location.state?.from === "string" ? location.state.from : null;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const match = DEMO_USERS.find(
      (u) => u.email.toLowerCase() === email.trim().toLowerCase(),
    );
    if (!match) {
      setError("No demo account uses that email address.");
      return;
    }
    signIn(match.id);
    notify(`Signed in as ${match.name}`, "success");
    navigate(from ?? (match.role === "admin" ? "/admin" : "/account"), { replace: true });
  };

  const pickAccount = (id: string) => {
    const match = DEMO_USERS.find((u) => u.id === id);
    if (!match) return;
    signIn(match.id);
    notify(`Signed in as ${match.name}`, "success");
    navigate(from ?? (match.role === "admin" ? "/admin" : "/account"), { replace: true });
  };

  return (
    <div className="shell py-12 sm:py-20">
      <div className="mx-auto max-w-md">
        <div className="flex flex-col items-center text-center">
          <LogoMark size={44} />
          <h1 className="mt-4 text-2xl font-semibold tracking-tight text-fg">
            Sign in to Voltify
          </h1>
          <p className="mt-2 text-sm text-fg-3">
            This is a demonstration storefront. Pick an account below — no password is required
            and nothing is sent anywhere.
          </p>
        </div>

        <div className="mt-8 space-y-2">
          {DEMO_USERS.map((u) => (
            <button
              key={u.id}
              type="button"
              onClick={() => pickAccount(u.id)}
              className="group flex w-full items-center gap-3.5 rounded-2xl border border-line bg-surface p-4 text-left transition-colors hover:border-accent"
            >
              <span
                className="grid h-11 w-11 shrink-0 place-items-center rounded-full font-semibold text-ink"
                style={{ background: `hsl(${u.avatarHue} 70% 62%)` }}
                aria-hidden
              >
                {u.name.charAt(0)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2 text-sm font-medium text-fg">
                  {u.name}
                  {u.role === "admin" && <Badge tone="accent">Admin</Badge>}
                </p>
                <p className="truncate text-xs text-fg-3">{u.email}</p>
              </div>
              <span className="shrink-0 text-sm text-fg-3 transition-colors group-hover:text-accent">
                Continue →
              </span>
            </button>
          ))}
        </div>

        <div className="my-7 flex items-center gap-3">
          <span className="h-px flex-1 bg-line" />
          <span className="text-xs text-fg-3">or type an email</span>
          <span className="h-px flex-1 bg-line" />
        </div>

        <form onSubmit={submit} className="rounded-2xl border border-line bg-surface p-5">
          <Field label="Email address" htmlFor="login-email" error={error}>
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError("");
              }}
              placeholder="alex@voltify.demo"
              autoComplete="email"
              className={inputClass(Boolean(error))}
            />
          </Field>

          <Button type="submit" className="mt-4 w-full">
            Sign in
          </Button>

          <div className="mt-4 rounded-lg bg-surface-2 px-3 py-2.5 text-xs text-fg-3">
            <p className="flex items-center gap-1.5">
              <CheckIcon size={13} className="text-success" />
              Try <code className="text-fg-2">alex@voltify.demo</code> for a customer account
            </p>
            <p className="mt-1 flex items-center gap-1.5">
              <CheckIcon size={13} className="text-success" />
              Try <code className="text-fg-2">admin@voltify.demo</code> for the admin dashboard
            </p>
          </div>
        </form>

        <p className="mt-6 text-center text-sm text-fg-3">
          <Link to="/products" className="text-accent underline-offset-2 hover:underline">
            Continue as a guest
          </Link>{" "}
          — you can still browse and check out.
        </p>
      </div>
    </div>
  );
}