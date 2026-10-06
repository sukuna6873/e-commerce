/**
 * Deterministic inline-SVG product illustrations.
 *
 * The catalog has no photography, so every product renders as vector art derived
 * from its id: the same product always gets the same silhouette, angle and
 * accent hue, which keeps grids looking varied but stable across reloads.
 */

import type { Product } from "../types";

/** Stable 32-bit hash so a product's art never changes between renders. */
function hash(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0);
}

export interface ArtConfig {
  /** hue used for the accent, 0-360 */
  hue: number;
  /** subtle tilt of the device, -1 to 1 */
  tilt: number;
  /** which visual sub-style to use within a category */
  variant: number;
}

export function artConfig(product: Product): ArtConfig {
  const h = hash(product.id);
  // Golden-ratio hue stride keeps neighbouring products far apart on the wheel.
  const hue = (h * 0.6180339887 * 360) % 360;
  return {
    hue: Math.round(hue),
    tilt: ((h >> 8) % 100) / 50 - 1,
    variant: h % 3,
  };
}

interface Palette {
  shell: string;
  shellDark: string;
  screen: string;
  screenGlow: string;
  accent: string;
}

function palette(hue: number): Palette {
  return {
    shell: `hsl(${hue} 18% 26%)`,
    shellDark: `hsl(${hue} 22% 15%)`,
    screen: `hsl(${hue} 46% 12%)`,
    screenGlow: `hsl(${(hue + 24) % 360} 92% 62%)`,
    accent: `hsl(${hue} 88% 60%)`,
  };
}

function Laptop({ p, cfg }: { p: Palette; cfg: ArtConfig }) {
  const open = cfg.variant === 0 ? 0 : cfg.variant === 1 ? -6 : 4;
  return (
    <g transform={`rotate(${cfg.tilt * 4} 100 110)`}>
      {/* screen */}
      <path
        d={`M36 34 h128 a8 8 0 0 1 8 8 v${62 + open} a8 8 0 0 1 -8 8 h-128 a8 8 0 0 1 -8 -8 v-${62 + open} a8 8 0 0 1 8 -8 z`}
        fill={p.shellDark}
      />
      <path
        d={`M40 42 h120 v${54 + open} h-120 z`}
        fill={p.screen}
      />
      <path
        d={`M40 42 h120 v${18 + open} h-120 z`}
        fill={p.screenGlow}
        opacity="0.25"
      />
      <circle cx="100" cy="34" r="2" fill={p.shell} />
      {/* base */}
      <path
        d="M18 112 h164 l14 16 a4 4 0 0 1 -4 6 h-184 a4 4 0 0 1 -4 -6 z"
        fill={p.shell}
      />
      <path d="M76 122 h48 l-5 4 h-38 z" fill={p.shellDark} opacity="0.8" />
      <rect x="24" y="118" width="34" height="3" rx="1.5" fill={p.accent} opacity="0.5" />
      <rect x="62" y="118" width="34" height="3" rx="1.5" fill={p.accent} opacity="0.5" />
    </g>
  );
}

function Phone({ p, cfg }: { p: Palette; cfg: ArtConfig }) {
  const cameras = cfg.variant === 0 ? 3 : cfg.variant === 1 ? 2 : 1;
  return (
    <g transform={`rotate(${cfg.tilt * 6} 100 110)`}>
      <rect x="66" y="24" width="68" height="132" rx="16" fill={p.shellDark} />
      <rect x="70" y="28" width="60" height="124" rx="13" fill={p.screen} />
      <rect x="70" y="28" width="60" height="46" rx="13" fill={p.screenGlow} opacity="0.3" />
      <rect x="88" y="32" width="24" height="6" rx="3" fill={p.shellDark} />
      {/* rear camera island, shown as a soft reflection on the front glass */}
      <g opacity="0.55">
        {Array.from({ length: cameras }).map((_, i) => (
          <circle key={i} cx={80 + i * 16} cy={118} r="6" fill={p.accent} opacity="0.5" />
        ))}
      </g>
      <rect x="96" y="140" width="8" height="3" rx="1.5" fill={p.shell} />
    </g>
  );
}

function Headphones({ p, cfg }: { p: Palette; cfg: ArtConfig }) {
  const bandY = cfg.variant === 1 ? 30 : 38;
  return (
    <g transform={`rotate(${cfg.tilt * 5} 100 110)`}>
      <path
        d={`M52 118 v-30 a48 48 0 0 1 96 0 v30`}
        fill="none"
        stroke={p.shell}
        strokeWidth="15"
        strokeLinecap="round"
      />
      <path
        d={`M60 ${bandY + 22} a40 40 0 0 1 80 0`}
        fill="none"
        stroke={p.shellDark}
        strokeWidth="6"
        strokeLinecap="round"
      />
      <rect x="36" y="104" width="34" height="52" rx="15" fill={p.shellDark} />
      <rect x="130" y="104" width="34" height="52" rx="15" fill={p.shellDark} />
      <rect x="42" y="112" width="22" height="36" rx="10" fill={p.accent} opacity="0.8" />
      <rect x="136" y="112" width="22" height="36" rx="10" fill={p.accent} opacity="0.8" />
    </g>
  );
}

function Camera({ p, cfg }: { p: Palette; cfg: ArtConfig }) {
  const zoom = cfg.variant === 2 ? 1.12 : 1;
  return (
    <g transform={`rotate(${cfg.tilt * 4} 100 110)`}>
      <rect x="38" y="62" width="124" height="82" rx="12" fill={p.shell} />
      <rect x="70" y="50" width="52" height="16" rx="6" fill={p.shellDark} />
      <circle cx="100" cy="104" r={34 * zoom} fill={p.shellDark} />
      <circle cx="100" cy="104" r={26 * zoom} fill="#05070d" />
      <circle cx="100" cy="104" r={17 * zoom} fill={p.screenGlow} opacity="0.45" />
      <circle cx="100" cy="104" r={9 * zoom} fill="#05070d" />
      <circle cx="92" cy="96" r="4" fill="#ffffff" opacity="0.55" />
      <circle cx="54" cy="76" r="5" fill={p.accent} opacity="0.9" />
      <rect x="128" y="70" width="24" height="10" rx="4" fill={p.accent} opacity="0.35" />
    </g>
  );
}

function Watch({ p, cfg }: { p: Palette; cfg: ArtConfig }) {
  const band = cfg.variant === 0 ? 34 : cfg.variant === 1 ? 44 : 26;
  return (
    <g>
      <rect x="82" y="12" width="36" height={band} rx="10" fill={p.shell} />
      <rect x="82" y={176 - band} width="36" height={band} rx="10" fill={p.shell} />
      <rect x="56" y="56" width="88" height="88" rx="26" fill={p.shellDark} />
      <rect x="64" y="64" width="72" height="72" rx="20" fill={p.screen} />
      <rect x="64" y="64" width="72" height="30" rx="20" fill={p.screenGlow} opacity="0.28" />
      <circle cx="100" cy="102" r="24" fill="none" stroke={p.accent} strokeWidth="3" opacity="0.9" />
      <circle cx="100" cy="102" r="14" fill={p.screenGlow} opacity="0.35" />
      <rect x="146" y="88" width="7" height="24" rx="3.5" fill={p.shell} />
    </g>
  );
}

function Accessory({ p, cfg }: { p: Palette; cfg: ArtConfig }) {
  if (cfg.variant === 0) {
    // keyboard
    return (
      <g transform={`rotate(${cfg.tilt * 4} 100 110)`}>
        <rect x="22" y="62" width="156" height="76" rx="10" fill={p.shellDark} />
        <rect x="28" y="68" width="144" height="64" rx="7" fill={p.shell} />
        {Array.from({ length: 5 }).map((_, r) =>
          Array.from({ length: 12 }).map((__, c) => (
            <rect
              key={`${r}-${c}`}
              x={33 + c * 11.6}
              y={73 + r * 12}
              width="9"
              height="9"
              rx="2"
              fill={r === 4 && c > 3 && c < 8 ? p.accent : p.shellDark}
              opacity={r === 4 && c > 3 && c < 8 ? 0.85 : 0.55}
            />
          )),
        )}
      </g>
    );
  }
  if (cfg.variant === 1) {
    // power bank / dongle
    return (
      <g transform={`rotate(${cfg.tilt * 8} 100 110)`}>
        <rect x="62" y="26" width="76" height="128" rx="18" fill={p.shell} />
        <rect x="62" y="26" width="76" height="40" rx="18" fill={p.shellDark} />
        <circle cx="100" cy="96" r="22" fill="none" stroke={p.accent} strokeWidth="4" />
        <path d="M94 96 l6 -10 v20 z" fill={p.screenGlow} />
        <rect x="80" y="132" width="40" height="5" rx="2.5" fill={p.shellDark} />
      </g>
    );
  }
  // monitor
  return (
    <g transform={`rotate(${cfg.tilt * 4} 100 110)`}>
      <rect x="24" y="44" width="152" height="96" rx="8" fill={p.shellDark} />
      <rect x="30" y="50" width="140" height="84" rx="4" fill={p.screen} />
      <rect x="30" y="50" width="140" height="34" rx="4" fill={p.screenGlow} opacity="0.28" />
      <rect x="88" y="140" width="24" height="18" fill={p.shell} />
      <rect x="58" y="158" width="84" height="8" rx="4" fill={p.shell} />
    </g>
  );
}

const SHAPES = {
  laptops: Laptop,
  phones: Phone,
  audio: Headphones,
  cameras: Camera,
  wearables: Watch,
  accessories: Accessory,
} as const;

/** Renders the illustration for a product as a 200x200 SVG scene. */
export function ProductArt({
  product,
  className,
}: {
  product: Product;
  className?: string;
}) {
  const cfg = artConfig(product);
  const p = palette(cfg.hue);
  const Shape = SHAPES[product.category] ?? Accessory;

  return (
    <svg
      viewBox="0 0 200 200"
      className={className}
      role="presentation"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <radialGradient id={`glow-${product.id}`} cx="50%" cy="42%" r="62%">
          <stop offset="0%" stopColor={p.screenGlow} stopOpacity="0.30" />
          <stop offset="100%" stopColor={p.screenGlow} stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="200" height="200" fill={`url(#glow-${product.id})`} />
      <Shape p={p} cfg={cfg} />
    </svg>
  );
}

/** Flat glyph version for cart rows and order lines. */
export function ProductArtInline({ product, className }: { product: Product; className?: string }) {
  return <ProductArt product={product} className={className} />;
}