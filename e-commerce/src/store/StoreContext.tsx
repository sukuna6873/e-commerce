import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from "react";
import type { Address, Order, Product, User } from "../types";
import * as api from "../data/api";
import { DEMO_USERS, SEED_ADDRESSES } from "../data/seed";
import { NS, read, write } from "../lib/storage";
import { clamp, lineId } from "../lib/format";
import { priceFor } from "../data/catalog";

/**
 * One reducer holds every piece of cross-route state: cart, wishlist, compare
 * tray, recently viewed, the signed-in user and their addresses. Components
 * read it through the hooks below, so nothing needs to thread props down a
 * tree, and every slice persists independently to localStorage.
 */

export const MAX_COMPARE = 4;
export const MAX_RECENT = 8;

export interface StoreState {
  cart: { id: string; productId: string; variantValue?: string; quantity: number; addedAt: string }[];
  wishlist: string[];
  compare: string[];
  recent: string[];
  userId: string | null;
  addresses: Address[];
  /** Bumped after checkout / admin edits so views can refetch catalog data. */
  catalogVersion: number;
  /** Whether the slide-over cart is showing. */
  cartOpen: boolean;
  /** Transient confirmation toast, e.g. "Added to cart". */
  toast: { message: string; tone: "success" | "error" | "info" } | null;
}

type Action =
  | { type: "cart/add"; productId: string; variantValue?: string; quantity: number }
  | { type: "cart/setQuantity"; lineId: string; quantity: number }
  | { type: "cart/remove"; lineId: string }
  | { type: "cart/clear" }
  | { type: "wishlist/toggle"; productId: string }
  | { type: "compare/toggle"; productId: string }
  | { type: "compare/clear" }
  | { type: "recent/push"; productId: string }
  | { type: "session/set"; userId: string | null }
  | { type: "addresses/set"; addresses: Address[] }
  | { type: "catalog/bump" }
  | { type: "cart/setOpen"; open: boolean }
  | { type: "toast/show"; message: string; tone: "success" | "error" | "info" }
  | { type: "toast/dismiss" }
  | { type: "reset" };

function initialState(): StoreState {
  return {
    cart: read(NS.cart, []),
    wishlist: read(NS.wishlist, []),
    compare: read(NS.compare, []),
    recent: read(NS.recent, []),
    userId: api.readSession(),
    addresses: read(NS.addresses, []),
    catalogVersion: 0,
    cartOpen: false,
    toast: null,
  };
}

function reducer(state: StoreState, action: Action): StoreState {
  switch (action.type) {
    case "cart/add": {
      const id = lineId(action.productId, action.variantValue);
      const existing = state.cart.find((l) => l.id === id);
      if (existing) {
        return {
          ...state,
          cart: state.cart.map((l) =>
            l.id === id ? { ...l, quantity: clamp(l.quantity + action.quantity, 1, 99) } : l,
          ),
          toast: { message: "Quantity updated in your cart", tone: "success" },
        };
      }
      return {
        ...state,
        cart: [
          ...state.cart,
          {
            id,
            productId: action.productId,
            variantValue: action.variantValue,
            quantity: clamp(action.quantity, 1, 99),
            addedAt: new Date().toISOString(),
          },
        ],
        toast: { message: "Added to your cart", tone: "success" },
      };
    }

    case "cart/setQuantity": {
      if (action.quantity <= 0) {
        return { ...state, cart: state.cart.filter((l) => l.id !== action.lineId) };
      }
      return {
        ...state,
        cart: state.cart.map((l) =>
          l.id === action.lineId ? { ...l, quantity: clamp(action.quantity, 1, 99) } : l,
        ),
      };
    }

    case "cart/remove":
      return { ...state, cart: state.cart.filter((l) => l.id !== action.lineId) };

    case "cart/clear":
      return { ...state, cart: [] };

    case "wishlist/toggle": {
      const has = state.wishlist.includes(action.productId);
      return {
        ...state,
        wishlist: has
          ? state.wishlist.filter((id) => id !== action.productId)
          : [action.productId, ...state.wishlist],
        toast: {
          message: has ? "Removed from your wishlist" : "Saved to your wishlist",
          tone: "info",
        },
      };
    }

    case "compare/toggle": {
      const has = state.compare.includes(action.productId);
      if (!has && state.compare.length >= MAX_COMPARE) {
        return {
          ...state,
          toast: { message: `Compare holds ${MAX_COMPARE} products — remove one first`, tone: "error" },
        };
      }
      return {
        ...state,
        compare: has
          ? state.compare.filter((id) => id !== action.productId)
          : [...state.compare, action.productId],
        toast: has ? null : { message: "Added to compare", tone: "info" },
      };
    }

    case "compare/clear":
      return { ...state, compare: [] };

    case "recent/push": {
      if (state.recent[0] === action.productId) return state;
      const next = [action.productId, ...state.recent.filter((id) => id !== action.productId)];
      return { ...state, recent: next.slice(0, MAX_RECENT) };
    }

    case "session/set":
      api.writeSession(action.userId);
      return { ...state, userId: action.userId };

    case "addresses/set":
      return { ...state, addresses: action.addresses };

    case "catalog/bump":
      return { ...state, catalogVersion: state.catalogVersion + 1 };

    case "cart/setOpen":
      return { ...state, cartOpen: action.open };

    case "toast/show":
      return { ...state, toast: { message: action.message, tone: action.tone } };

    case "toast/dismiss":
      return { ...state, toast: null };

    case "reset":
      api.resetDemoData();
      return { ...initialState(), toast: { message: "Demo data reset", tone: "info" } };
  }
}

// ── Persistence ────────────────────────────────────────────────────────────

function usePersistence(state: StoreState): void {
  useEffect(() => {
    write(NS.cart, state.cart);
  }, [state.cart]);
  useEffect(() => {
    write(NS.wishlist, state.wishlist);
  }, [state.wishlist]);
  useEffect(() => {
    write(NS.compare, state.compare);
  }, [state.compare]);
  useEffect(() => {
    write(NS.recent, state.recent);
  }, [state.recent]);
  useEffect(() => {
    write(NS.addresses, state.addresses);
  }, [state.addresses]);
}

// ── Context ────────────────────────────────────────────────────────────────

export interface CartEntry {
  id: string;
  productId: string;
  variantValue?: string;
  quantity: number;
  addedAt: string;
  product: Product;
  unitPrice: number;
  lineTotal: number;
}

interface StoreValue {
  state: StoreState;
  dispatch: React.Dispatch<Action>;

  user: User | null;
  signIn: (userId: string) => void;
  signOut: () => void;

  /** Cart lines joined to catalog products, with per-line pricing. */
  cartEntries: CartEntry[];
  cartCount: number;
  cartSubtotal: number;
  addToCart: (productId: string, variantValue?: string, quantity?: number) => void;
  setQuantity: (lineId: string, quantity: number) => void;
  removeLine: (lineId: string) => void;

  toggleWishlist: (productId: string) => void;
  toggleCompare: (productId: string) => void;
  clearCompare: () => void;

  pushRecent: (productId: string) => void;
  notify: (message: string, tone?: "success" | "error" | "info") => void;
  dismissToast: () => void;

  addresses: Address[];
  saveAddress: (address: Address) => Promise<void>;
  removeAddress: (addressId: string) => Promise<void>;

  cartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;

  refreshCatalog: () => void;
  resetEverything: () => void;
}

const StoreContext = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, initialState);
  usePersistence(state);

  // Toast auto-dismiss.
  useEffect(() => {
    if (!state.toast) return;
    const timer = window.setTimeout(() => dispatch({ type: "toast/dismiss" }), 3200);
    return () => window.clearTimeout(timer);
  }, [state.toast]);

  const products = useMemo(() => api.allProducts(), [state.catalogVersion]);
  const byId = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);

  const user = useMemo(
    () => DEMO_USERS.find((u) => u.id === state.userId) ?? null,
    [state.userId],
  );

  const cartEntries = useMemo<CartEntry[]>(
    () =>
      state.cart.flatMap((line) => {
        const product = byId.get(line.productId);
        // A line can outlive its product if the catalog is ever edited to drop
        // an item; skip it rather than rendering a blank row.
        if (!product) return [];
        const unitPrice = priceFor(product, line.variantValue);
        return [{ ...line, product, unitPrice, lineTotal: unitPrice * line.quantity }];
      }),
    [state.cart, byId],
  );

  const cartCount = useMemo(
    () => cartEntries.reduce((sum, e) => sum + e.quantity, 0),
    [cartEntries],
  );

  const cartSubtotal = useMemo(
    () => cartEntries.reduce((sum, e) => sum + e.lineTotal, 0),
    [cartEntries],
  );

  const value = useMemo<StoreValue>(() => {
    return {
      state,
      dispatch,
      user,
      signIn: (userId) => dispatch({ type: "session/set", userId }),
      signOut: () => dispatch({ type: "session/set", userId: null }),

      cartEntries,
      cartCount,
      cartSubtotal,
      addToCart: (productId, variantValue, quantity = 1) =>
        dispatch({ type: "cart/add", productId, variantValue, quantity }),
      setQuantity: (lineIdValue, quantity) =>
        dispatch({ type: "cart/setQuantity", lineId: lineIdValue, quantity }),
      removeLine: (lineIdValue) => dispatch({ type: "cart/remove", lineId: lineIdValue }),

      toggleWishlist: (productId) => dispatch({ type: "wishlist/toggle", productId }),
      toggleCompare: (productId) => dispatch({ type: "compare/toggle", productId }),
      clearCompare: () => dispatch({ type: "compare/clear" }),

      pushRecent: (productId) => dispatch({ type: "recent/push", productId }),
      notify: (message, tone = "success") => dispatch({ type: "toast/show", message, tone }),
      dismissToast: () => dispatch({ type: "toast/dismiss" }),

      addresses: state.addresses,
      saveAddress: async (address) => {
        const userId = state.userId;
        if (!userId) return;
        const next = await api.saveAddress(userId, address);
        dispatch({ type: "addresses/set", addresses: next });
      },
      removeAddress: async (addressId) => {
        const userId = state.userId;
        if (!userId) return;
        const next = await api.deleteAddress(addressId, userId);
        dispatch({ type: "addresses/set", addresses: next });
      },

      refreshCatalog: () => dispatch({ type: "catalog/bump" }),
      resetEverything: () => dispatch({ type: "reset" }),

      cartOpen: state.cartOpen,
      openCart: () => dispatch({ type: "cart/setOpen", open: true }),
      closeCart: () => dispatch({ type: "cart/setOpen", open: false }),
    };
  }, [state, user, cartEntries, cartCount, cartSubtotal]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside <StoreProvider>");
  return ctx;
}

/** Convenience selector: is this product on the wishlist? */
export function useIsWishlisted(productId: string): boolean {
  const { state } = useStore();
  return state.wishlist.includes(productId);
}

export function useIsComparing(productId: string): boolean {
  const { state } = useStore();
  return state.compare.includes(productId);
}

export { SEED_ADDRESSES };
export type { Order };