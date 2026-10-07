import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAdminAuth } from "../store/AdminAuthContext";

/**
 * Admin-only route guard.
 *
 * Distinct from RequireAuth, which guards the storefront by `user.role`. An
 * admin signed in through the API has no shopper session, so the dashboard
 * hangs off this one instead.
 */

export function RequireAdminAuth({ children }: { children: ReactNode }) {
  const { admin, checking } = useAdminAuth();
  const location = useLocation();

  // While the stored token is being revalidated we know neither way; sending
  // the admin to the login screen here would flash it on every reload.
  if (checking) {
    return (
      <div className="shell py-20">
        <div className="mx-auto max-w-sm animate-pulse space-y-3">
          <div className="h-6 w-40 rounded-lg bg-surface-3" />
          <div className="h-4 w-full rounded-lg bg-surface-3" />
          <div className="h-4 w-4/5 rounded-lg bg-surface-3" />
        </div>
      </div>
    );
  }

  if (!admin) {
    return (
      <Navigate
        to="/admin/login"
        replace
        state={{ from: location.pathname + location.search }}
      />
    );
  }

  return <>{children}</>;
}

/** Keeps a signed-in admin off the login and register screens. */
export function RedirectIfAdminAuthed({ children }: { children: ReactNode }) {
  const { admin, checking } = useAdminAuth();
  const location = useLocation();

  if (checking) return null;

  if (!admin) return <>{children}</>;

  const from = location.state?.from;
  return <Navigate to={typeof from === "string" ? from : "/admin"} replace />;
}
