import { useStore } from "../store/StoreContext";
import { AlertIcon, CheckIcon } from "./Icons";

/** Transient confirmation messages for cart, wishlist and admin actions. */
export function Toaster() {
  const { state, dismissToast } = useStore();
  const toast = state.toast;
  if (!toast) return null;

  const tone =
    toast.tone === "success"
      ? "border-success/30 bg-success/15 text-success"
      : toast.tone === "error"
        ? "border-danger/30 bg-danger/15 text-danger"
        : "border-line bg-surface-3 text-fg-2";

  const Icon = toast.tone === "error" ? AlertIcon : CheckIcon;

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 top-20 z-[60] flex justify-center px-4"
    >
      <button
        type="button"
        onClick={dismissToast}
        className={`pointer-events-auto flex items-center gap-2.5 rounded-xl border px-4 py-2.5 text-sm font-medium shadow-xl backdrop-blur ${tone}`}
      >
        <Icon size={16} className="shrink-0" />
        {toast.message}
      </button>
    </div>
  );
}