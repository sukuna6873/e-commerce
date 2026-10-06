/** Formatting helpers. All money in the app is integer cents to avoid float drift. */

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

export function formatPrice(cents: number): string {
  return currency.format(cents / 100);
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function timeAgo(iso: string): string {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  const units: [number, Intl.RelativeTimeFormatUnit][] = [
    [60, "second"],
    [3600, "minute"],
    [86400, "hour"],
    [604800, "day"],
    [2629800, "week"],
    [31557600, "month"],
    [Infinity, "year"],
  ];
  const divisors = [1, 60, 3600, 86400, 604800, 2629800, 31557600];
  const rtf = new Intl.RelativeTimeFormat("en-US", { numeric: "auto" });
  for (let i = 0; i < units.length; i++) {
    if (seconds < units[i][0]) {
      return rtf.format(-Math.floor(seconds / divisors[i]), units[i][1]);
    }
  }
  return formatDate(iso);
}

export function percentOff(price: number, compareAt: number): number {
  if (compareAt <= price) return 0;
  return Math.round(((compareAt - price) / compareAt) * 100);
}

/** "2 items" / "1 item" */
export function pluralise(count: number, singular: string, plural?: string): string {
  return `${count} ${count === 1 ? singular : (plural ?? `${singular}s`)}`;
}

export function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

/** Builds the id used to key a cart line: one line per product+variant. */
export function lineId(productId: string, variantValue?: string): string {
  return variantValue ? `${productId}::${variantValue}` : productId;
}

export function orderNumber(seed: number): string {
  return `VF-${String(seed).slice(-4)}-${String((seed * 7919) % 9999).padStart(4, "0")}`;
}