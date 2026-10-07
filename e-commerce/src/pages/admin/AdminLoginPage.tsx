import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAdminAuth } from "../../store/AdminAuthContext";
import { useStore } from "../../store/StoreContext";
import { AdminApiError, type FieldErrors } from "../../data/adminApi";
import { Badge, Button, Field, inputClass } from "../../components/Primitives";
import { AlertIcon, LockIcon, LogoMark } from "../../components/Icons";

/**
 * Admin sign-in.
 *
 * Separate from the shopper LoginPage: different endpoint, different storage,
 * different failure handling. An expired token sends the admin back here with
 * the attempted path preserved so they land where they were going.
 */

export function AdminLoginPage() {
  const { signIn } = useAdminAuth();
  const { notify } = useStore();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [fields, setFields] = useState<FieldErrors>({});
  const [busy, setBusy] = useState(false);

  const from = typeof location.state?.from === "string" ? location.state.from : null;
  const expired = location.state?.reason === "expired";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim() || !password) {
      setError("Enter your email and password.");
      return;
    }

    setBusy(true);
    setError("");
    setFields({});
    try {
      const account = await signIn({ email: email.trim(), password });
      notify(`Signed in as ${account.username}`, "success");
      navigate(from ?? "/admin", { replace: true });
    } catch (err) {
      if (err instanceof AdminApiError) {
        setError(err.message);
        setFields(err.fields);
      } else {
        setError("Something went wrong. Please try again.");
      }
      setBusy(false);
    }
  };

  return (
    <div className="shell py-12 sm:py-20">
      <div className="mx-auto max-w-md">
        <div className="flex flex-col items-center text-center">
          <LogoMark size={44} />
          <h1 className="mt-4 text-2xl font-semibold tracking-tight text-fg">
            Admin sign in
          </h1>
          <p className="mt-2 flex items-center justify-center gap-1.5 text-sm text-fg-3">
            <LockIcon size={14} />
            Operations dashboard access
          </p>
        </div>

        {expired && (
          <div
            role="status"
            className="mt-6 flex items-start gap-2.5 rounded-xl border border-warning/30 bg-warning/10 px-3.5 py-3 text-sm text-warning"
          >
            <AlertIcon size={16} className="mt-0.5 shrink-0" />
            <span>Your session expired. Sign in again to continue.</span>
          </div>
        )}

        <form
          onSubmit={submit}
          className="mt-6 space-y-4 rounded-2xl border border-line bg-surface p-5"
        >
          {error && (
            <div
              role="alert"
              className="flex items-start gap-2.5 rounded-xl border border-danger/30 bg-danger/10 px-3.5 py-3 text-sm text-danger"
            >
              <AlertIcon size={16} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <Field label="Email address" htmlFor="admin-login-email" error={fields.email} required>
            <input
              id="admin-login-email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError("");
                setFields((f) => ({ ...f, email: undefined }));
              }}
              autoComplete="email"
              placeholder="you@voltify.com"
              className={inputClass(Boolean(fields.email))}
            />
          </Field>

          <Field label="Password" htmlFor="admin-login-password" error={fields.password} required>
            <input
              id="admin-login-password"
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError("");
                setFields((f) => ({ ...f, password: undefined }));
              }}
              autoComplete="current-password"
              className={inputClass(Boolean(fields.password))}
            />
          </Field>

          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? "Signing in…" : "Sign in"}
          </Button>
        </form>

        <div className="mt-4 rounded-xl border border-line bg-surface-2 px-4 py-3.5">
          <p className="text-xs leading-relaxed text-fg-3">
            Admin accounts are separate from customer accounts. Self-registered accounts
            start as <Badge tone="neutral">moderator</Badge> with read-only access until a
            superadmin promotes them.
          </p>
        </div>

        <p className="mt-6 text-center text-sm text-fg-3">
          Need an admin account?{" "}
          <Link
            to="/admin/register"
            className="text-accent underline-offset-2 hover:underline"
          >
            Register
          </Link>{" "}
          ·{" "}
          <Link to="/login" className="text-accent underline-offset-2 hover:underline">
            Customer sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
