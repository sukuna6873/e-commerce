import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  AdminApiError,
  clearAdminSession,
  fetchCurrentAdmin,
  loginAdmin,
  readAdminSession,
  registerAdmin,
  writeAdminSession,
  type AdminAccount,
  type AdminSession,
} from "../data/adminApi";

/**
 * Admin session provider.
 *
 * Deliberately separate from StoreContext: the storefront's `user` drives the
 * header and checkout, while this holds the API bearer token. An admin signed
 * in on one tab does not become a "signed in shopper" anywhere else.
 *
 * The stored token is revalidated against /me on mount. Without that, a token
 * that expired overnight would be read as a live session straight from
 * localStorage and the UI would only discover it was dead on the first click.
 */

interface AdminAuthValue {
  admin: AdminAccount | null;
  /** True while the stored token is being revalidated. */
  checking: boolean;
  signIn: (input: { email: string; password: string }) => Promise<AdminAccount>;
  signUp: (input: {
    email: string;
    username: string;
    password: string;
    confirmPassword: string;
  }) => Promise<AdminAccount>;
  signOut: () => void;
  /** Drops a session the server has rejected, e.g. after a 401. */
  invalidate: () => void;
  hasPermission: (permission: string) => boolean;
}

const AdminAuthContext = createContext<AdminAuthValue | null>(null);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<AdminAccount | null>(
    () => readAdminSession()?.admin ?? null,
  );
  const [checking, setChecking] = useState(() => Boolean(readAdminSession()?.token));

  useEffect(() => {
    const token = readAdminSession()?.token;
    if (!token) return;

    let cancelled = false;
    fetchCurrentAdmin()
      .then((fresh) => {
        if (cancelled) return;
        // The role or permission list may have changed server-side since the
        // token was minted; trust the server over the cached copy.
        const refreshed: AdminSession = { token, admin: fresh };
        writeAdminSession(refreshed);
        setAdmin(fresh);
      })
      .catch((err) => {
        if (cancelled) return;
        if (err instanceof AdminApiError && err.status === 0) return; // server down: keep what we have
        clearAdminSession();
        setAdmin(null);
      })
      .finally(() => {
        if (!cancelled) setChecking(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const adopt = useCallback((session: AdminSession) => {
    writeAdminSession(session);
    setAdmin(session.admin);
    return session.admin;
  }, []);

  const signIn = useCallback(
    async (input: { email: string; password: string }) =>
      adopt(await loginAdmin(input)),
    [adopt],
  );

  const signUp = useCallback(
    async (input: {
      email: string;
      username: string;
      password: string;
      confirmPassword: string;
    }) => adopt(await registerAdmin(input)),
    [adopt],
  );

  const signOut = useCallback(() => {
    clearAdminSession();
    setAdmin(null);
  }, []);

  const invalidate = useCallback(() => {
    clearAdminSession();
    setAdmin(null);
  }, []);

  const hasPermission = useCallback(
    (permission: string) =>
      admin?.role === "superadmin" || Boolean(admin?.permissions.includes(permission)),
    [admin],
  );

  const value = useMemo(
    () => ({ admin, checking, signIn, signUp, signOut, invalidate, hasPermission }),
    [admin, checking, signIn, signUp, signOut, invalidate, hasPermission],
  );

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}

export function useAdminAuth(): AdminAuthValue {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error("useAdminAuth must be used inside <AdminAuthProvider>");
  return ctx;
}
