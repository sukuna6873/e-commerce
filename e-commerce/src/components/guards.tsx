import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useStore } from "../store/StoreContext";

/**
 * Route guard. The session is read synchronously from localStorage, so there is
 * no loading state — an absent user means "not signed in". The attempted path is
 * passed along so signing in returns the shopper to where they were headed.
 */
export function RequireAuth({ children, adminOnly }: { children: ReactNode; adminOnly?: boolean }) {
  const { user } = useStore();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  }

  if (adminOnly && user.role !== "admin") {
    return <Navigate to="/account" replace />;
  }

  return <>{children}</>;
}

/** Inverse guard: keeps a signed-in shopper out of the login screen. */
export function RedirectIfAuthed({ children }: { children: ReactNode }) {
  const { user } = useStore();
  const location = useLocation();
  const from = location.state?.from;

  if (!user) return <>{children}</>;

  return <Navigate to={from ?? (user.role === "admin" ? "/admin" : "/account")} replace />;
}