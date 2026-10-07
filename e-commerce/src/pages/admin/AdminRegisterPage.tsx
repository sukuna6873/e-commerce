import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAdminAuth } from "../../store/AdminAuthContext";
import { useStore } from "../../store/StoreContext";
import { AdminApiError, type FieldErrors } from "../../data/adminApi";
import { Button, Field, inputClass } from "../../components/Primitives";
import { AlertIcon, CheckIcon, LockIcon, LogoMark } from "../../components/Icons";

/**
 * Admin registration.
 *
 * New accounts always land as moderators with read-only permissions — the API
 * decides that, not this form. The role note is on screen so nobody registers
 * expecting dashboard write access on day one.
 */

interface FormState {
  email: string;
  username: string;
  password: string;
  confirmPassword: string;
}

const EMPTY: FormState = { email: "", username: "", password: "", confirmPassword: "" };

/** Client-side mirror of the server's rule, so the error shows before a round trip. */
const STRENGTH_RULES: { label: string; test: (p: string) => boolean }[] = [
  { label: "At least 10 characters", test: (p) => p.length >= 10 },
  { label: "A lowercase letter", test: (p) => /[a-z]/.test(p) },
  { label: "An uppercase letter", test: (p) => /[A-Z]/.test(p) },
  { label: "A number", test: (p) => /\d/.test(p) },
];

function unmetRules(password: string): number {
  return STRENGTH_RULES.filter((rule) => !rule.test(password)).length;
}

export function AdminRegisterPage() {
  const { signUp } = useAdminAuth();
  const { notify } = useStore();
  const navigate = useNavigate();

  const [form, setForm] = useState<FormState>(EMPTY);
  const [fields, setFields] = useState<FieldErrors>({});
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const set = (key: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    setFields((f) => ({ ...f, [key]: "" }));
    setError("");
  };

  const unmet = form.password ? unmetRules(form.password) : 0;
  const mismatch =
    form.confirmPassword.length > 0 && form.confirmPassword !== form.password;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (unmet > 0 || mismatch) {
      setError("Fix the highlighted fields before continuing.");
      return;
    }

    setBusy(true);
    setError("");
    setFields({});
    try {
      const account = await signUp(form);
      notify(`Admin account "${account.username}" created`, "success");
      navigate("/admin", { replace: true });
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
            Create an admin account
          </h1>
          <p className="mt-2 text-sm text-fg-3">
            Staff access for the Voltify operations dashboard.
          </p>
        </div>

        <form
          onSubmit={submit}
          className="mt-8 space-y-4 rounded-2xl border border-line bg-surface p-5"
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

          <Field label="Email address" htmlFor="admin-reg-email" error={fields.email} required>
            <input
              id="admin-reg-email"
              type="email"
              value={form.email}
              onChange={set("email")}
              autoComplete="email"
              placeholder="you@voltify.com"
              className={inputClass(Boolean(fields.email))}
            />
          </Field>

          <Field
            label="Username"
            htmlFor="admin-reg-username"
            error={fields.username}
            hint="3–30 characters. Letters, numbers, dots, dashes and underscores."
            required
          >
            <input
              id="admin-reg-username"
              type="text"
              value={form.username}
              onChange={set("username")}
              autoComplete="username"
              placeholder="sam.okafor"
              className={inputClass(Boolean(fields.username))}
            />
          </Field>

          <Field
            label="Password"
            htmlFor="admin-reg-password"
            error={fields.password}
            required
          >
            <input
              id="admin-reg-password"
              type="password"
              value={form.password}
              onChange={set("password")}
              autoComplete="new-password"
              className={inputClass(Boolean(fields.password) || unmet > 0)}
            />
          </Field>

          {form.password && (
            <div className="-mt-2 flex flex-wrap gap-x-3 gap-y-1">
              {STRENGTH_RULES.map(({ label, test }) => (
                <span
                  key={label}
                  className={`flex items-center gap-1 text-xs ${
                    test(form.password) ? "text-success" : "text-fg-3"
                  }`}
                >
                  <CheckIcon size={12} />
                  {label}
                </span>
              ))}
            </div>
          )}

          <Field
            label="Confirm password"
            htmlFor="admin-reg-confirm"
            error={fields.confirmPassword ?? (mismatch ? "Passwords do not match." : undefined)}
            required
          >
            <input
              id="admin-reg-confirm"
              type="password"
              value={form.confirmPassword}
              onChange={set("confirmPassword")}
              autoComplete="new-password"
              className={inputClass(Boolean(mismatch) || Boolean(fields.confirmPassword))}
            />
          </Field>

          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? "Creating account…" : "Create admin account"}
          </Button>
        </form>

        <div className="mt-4 rounded-xl border border-line bg-surface-2 px-4 py-3.5">
          <p className="flex items-center gap-2 text-sm font-medium text-fg-2">
            <LockIcon size={15} className="text-fg-3" />
            New accounts start as moderators
          </p>
          <p className="mt-1.5 text-xs leading-relaxed text-fg-3">
            Registration grants read-only access to the dashboard, orders and products. A
            superadmin has to promote your account before you can make changes.
          </p>
        </div>

        <p className="mt-6 text-center text-sm text-fg-3">
          Already have an account?{" "}
          <Link to="/admin/login" className="text-accent underline-offset-2 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
