import type { Category, CategoryMeta, Product, SpecGroup, VariantOption } from "../types";

export const CATEGORIES: CategoryMeta[] = [
  { slug: "laptops", name: "Laptops", tagline: "Portable power, all day" },
  { slug: "phones", name: "Phones", tagline: "Flagship silicon, pro cameras" },
  { slug: "audio", name: "Audio", tagline: "Hear every detail" },
  { slug: "cameras", name: "Cameras", tagline: "Shoot it properly" },
  { slug: "wearables", name: "Wearables", tagline: "Track, tune, connect" },
  { slug: "accessories", name: "Accessories", tagline: "Finish the setup" },
];

export const BRANDS = [
  "Aether",
  "Kestrel",
  "Lumen",
  "Nova",
  "Onyx",
  "Pulse",
  "Solace",
  "Vertex",
] as const;

interface Draft {
  id: string;
  name: string;
  brand: string;
  category: Category;
  tagline: string;
  description: string;
  price: number;
  compareAt?: number;
  rating: number;
  reviewCount: number;
  stock: number;
  badges?: string[];
  variantGroups?: string[];
  featured?: boolean;
  isNew?: boolean;
  releasedAt: string;
  specs: SpecGroup[];
}

interface VariantDraft {
  group: string;
  value: string;
  hex?: string;
  priceDelta?: number;
  stock: number;
}

const RAW: { product: Draft; variants: VariantDraft[] }[] = [
  // ── Laptops ───────────────────────────────────────────────────────────────
  {
    product: {
      id: "p-aether-14",
      name: "Aether 14 Pro",
      brand: "Aether",
      category: "laptops",
      tagline: "14-inch creator laptop",
      description:
        "A 14-inch notebook built around the A12 Pro chip, with a colour-accurate 3K panel and enough battery for a full day of editing away from a socket. The vapour chamber keeps sustained exports quiet, so the fans stay near-silent even on long renders.",
      price: 169900,
      compareAt: 194900,
      rating: 4.8,
      reviewCount: 428,
      stock: 34,
      badges: ["On sale", "Best seller"],
      variantGroups: ["storage", "memory", "colour"],
      featured: true,
      releasedAt: "2026-04-18",
      specs: [
        {
          group: "Performance",
          rows: [
            { label: "Processor", value: "Aether A12 Pro, 12-core CPU" },
            { label: "Graphics", value: "20-core integrated GPU" },
            { label: "Neural engine", value: "38 TOPS" },
          ],
        },
        {
          group: "Display",
          rows: [
            { label: "Panel", value: "14.2-inch 3K Mini-LED" },
            { label: "Refresh rate", value: "120Hz adaptive" },
            { label: "Colour", value: "100% DCI-P3, 1600 nits peak" },
          ],
        },
        {
          group: "Battery & power",
          rows: [
            { label: "Battery life", value: "Up to 19 hours" },
            { label: "Charging", value: "96W USB-C, 0–50% in 30 min" },
            { label: "Adapter", value: "96W GaN, dual port" },
          ],
        },
        {
          group: "Chassis",
          rows: [
            { label: "Dimensions", value: "312 × 221 × 15.5 mm" },
            { label: "Weight", value: "1.52 kg" },
            { label: "Material", value: "Recycled aluminium unibody" },
          ],
        },
        {
          group: "Ports",
          rows: [
            { label: "Thunderbolt", value: "2× Thunderbolt 5" },
            { label: "USB-A", value: "1× USB-A 3.2" },
            { label: "Other", value: "HDMI 2.1, 3.5 mm, SDXC" },
          ],
        },
      ],
    },
    variants: [
      { group: "storage", value: "512GB", priceDelta: 0, stock: 18 },
      { group: "storage", value: "1TB", priceDelta: 20000, stock: 11 },
      { group: "storage", value: "2TB", priceDelta: 44000, stock: 5 },
      { group: "memory", value: "16GB", priceDelta: 0, stock: 20 },
      { group: "memory", value: "32GB", priceDelta: 25000, stock: 9 },
      { group: "memory", value: "64GB", priceDelta: 58000, stock: 0 },
      { group: "colour", value: "Midnight", hex: "#1b2130", priceDelta: 0, stock: 14 },
      { group: "colour", value: "Silver", hex: "#d9dde3", priceDelta: 0, stock: 12 },
      { group: "colour", value: "Deep Teal", hex: "#123c42", priceDelta: 5000, stock: 8 },
    ],
  },
  {
    product: {
      id: "p-vertex-16",
      name: "Vertex 16 Studio",
      brand: "Vertex",
      category: "laptops",
      tagline: "16-inch workstation",
      description:
        "A colour-workstation laptop with a 16-inch 120Hz display, a full-size numpad, and discrete graphics that hold frame rates in 3D and video timelines. Ships with a 230W adapter and a cooling shroud for long sessions under load.",
      price: 249900,
      compareAt: 274900,
      rating: 4.7,
      reviewCount: 189,
      stock: 12,
      badges: ["On sale"],
      variantGroups: ["graphics", "memory"],
      releasedAt: "2026-02-09",
      specs: [
        {
          group: "Performance",
          rows: [
            { label: "Processor", value: "Vertex V8, 16-core CPU" },
            { label: "Graphics", value: "RTX-class discrete, 12GB VRAM" },
            { label: "Cooling", value: "Dual vapour + vapour" },
          ],
        },
        {
          group: "Display",
          rows: [
            { label: "Panel", value: "16-inch 2560×1600 IPS" },
            { label: "Refresh rate", value: "120Hz" },
            { label: "Colour", value: "100% sRGB, 400 nits" },
          ],
        },
        {
          group: "Connectivity",
          rows: [
            { label: "Thunderbolt", value: "2× Thunderbolt 4" },
            { label: "USB-A", value: "2× USB-A 3.2" },
            { label: "Network", value: "2.5GbE, Wi-Fi 7" },
          ],
        },
        {
          group: "Chassis",
          rows: [
            { label: "Weight", value: "2.24 kg" },
            { label: "Keyboard", value: "Backlit with numpad" },
            { label: "Slots", value: "2× M.2 2280" },
          ],
        },
      ],
    },
    variants: [
      { group: "graphics", value: "12GB VRAM", priceDelta: 0, stock: 8 },
      { group: "graphics", value: "16GB VRAM", priceDelta: 38000, stock: 4 },
      { group: "memory", value: "32GB", priceDelta: 0, stock: 9 },
      { group: "memory", value: "64GB", priceDelta: 32000, stock: 3 },
    ],
  },
  {
    product: {
      id: "p-solace-air-13",
      name: "Solace Air 13",
      brand: "Solace",
      category: "laptops",
      tagline: "Fanless ultrabook",
      description:
        "A completely fanless 13-inch notebook under a kilogram. It stays silent because it has no moving parts — the thermal solution is a vapour sheet instead. Best for writing, browsing and long flights.",
      price: 99900,
      rating: 4.4,
      reviewCount: 612,
      stock: 47,
      badges: ["Fanless"],
      variantGroups: ["storage", "colour"],
      featured: true,
      releasedAt: "2026-05-30",
      specs: [
        {
          group: "Performance",
          rows: [
            { label: "Processor", value: "Solace S5, 8-core CPU" },
            { label: "Graphics", value: "10-core integrated GPU" },
            { label: "Cooling", value: "Passive vapour sheet" },
          ],
        },
        {
          group: "Display",
          rows: [
            { label: "Panel", value: "13.6-inch 2560×1664" },
            { label: "Brightness", value: "500 nits" },
            { label: "Refresh rate", value: "60Hz" },
          ],
        },
        {
          group: "Battery & power",
          rows: [
            { label: "Battery life", value: "Up to 22 hours" },
            { label: "Weight", value: "0.98 kg" },
            { label: "Charging", value: "45W USB-C" },
          ],
        },
      ],
    },
    variants: [
      { group: "storage", value: "256GB", priceDelta: 0, stock: 22 },
      { group: "storage", value: "512GB", priceDelta: 14000, stock: 19 },
      { group: "storage", value: "1TB", priceDelta: 30000, stock: 6 },
      { group: "colour", value: "Lunar White", hex: "#e8e6e1", priceDelta: 0, stock: 15 },
      { group: "colour", value: "Graphite", hex: "#3a3f47", priceDelta: 0, stock: 20 },
      { group: "colour", value: "Sage", hex: "#a8b5a4", priceDelta: 4000, stock: 12 },
    ],
  },
  {
    product: {
      id: "p-nova-slate-11",
      name: "Nova Slate 11",
      brand: "Nova",
      category: "laptops",
      tagline: "Detachable 2-in-1",
      description:
        "A tablet that snaps into a keyboard folio to become a laptop. The 11-inch 90Hz display and stylus support make it a good note-taking and reading device, and it detaches in a single second when you want the smaller screen.",
      price: 74900,
      compareAt: 84900,
      rating: 4.2,
      reviewCount: 274,
      stock: 0,
      badges: ["On sale", "Backorder"],
      variantGroups: ["storage", "keyboard"],
      releasedAt: "2026-01-22",
      specs: [
        {
          group: "Display",
          rows: [
            { label: "Panel", value: "11-inch 2560×1600, 90Hz" },
            { label: "Touch", value: "Yes, with 4096-level stylus" },
            { label: "Brightness", value: "450 nits" },
          ],
        },
        {
          group: "Performance",
          rows: [
            { label: "Processor", value: "Nova N6, 8-core" },
            { label: "Memory", value: "8GB LPDDR5X" },
            { label: "Cooling", value: "Passive, fanless" },
          ],
        },
        {
          group: "Chassis",
          rows: [
            { label: "Tablet weight", value: "0.59 kg" },
            { label: "With folio", value: "1.02 kg" },
            { label: "Battery", value: "Up to 15 hours" },
          ],
        },
      ],
    },
    variants: [
      { group: "storage", value: "128GB", priceDelta: 0, stock: 0 },
      { group: "storage", value: "256GB", priceDelta: 10000, stock: 0 },
      { group: "keyboard", value: "Keyboard folio", priceDelta: 0, stock: 6 },
      { group: "keyboard", value: "No keyboard", priceDelta: -12000, stock: 9 },
    ],
  },

  // ── Phones ────────────────────────────────────────────────────────────────
  {
    product: {
      id: "p-nova-15-pro",
      name: "Nova 15 Pro",
      brand: "Nova",
      category: "phones",
      tagline: "6.7-inch flagship",
      description:
        "A titanium-framed flagship with a triple 50MP camera system, a 120Hz LTPO display that drops to 1Hz on the always-on clock, and two days of battery in normal use. Charges to 50% in 18 minutes.",
      price: 109900,
      compareAt: 119900,
      rating: 4.9,
      reviewCount: 1204,
      stock: 58,
      badges: ["On sale", "Best seller"],
      variantGroups: ["storage", "colour"],
      featured: true,
      releasedAt: "2026-06-11",
      specs: [
        {
          group: "Display",
          rows: [
            { label: "Panel", value: "6.7-inch LTPO OLED" },
            { label: "Resolution", value: "2796 × 1290 at 460ppi" },
            { label: "Refresh rate", value: "1–120Hz adaptive" },
            { label: "Peak brightness", value: "2600 nits outdoors" },
          ],
        },
        {
          group: "Camera",
          rows: [
            { label: "Main", value: "50MP, f/1.6, OIS" },
            { label: "Ultra-wide", value: "50MP, f/2.0, 120°" },
            { label: "Telephoto", value: "50MP, 5× optical, OIS" },
            { label: "Video", value: "4K120 HDR, Log2 profile" },
          ],
        },
        {
          group: "Performance",
          rows: [
            { label: "Chip", value: "Nova N1 Pro, 3-nanometre" },
            { label: "RAM", value: "12GB" },
            { label: "Storage", value: "256GB – 1TB" },
          ],
        },
        {
          group: "Battery",
          rows: [
            { label: "Capacity", value: "4,850 mAh" },
            { label: "Charging", value: "45W wired, 25W wireless" },
            { label: "Life", value: "Up to 2 days typical use" },
          ],
        },
        {
          group: "Body",
          rows: [
            { label: "Material", value: "Grade 5 titanium frame" },
            { label: "Water resistance", value: "IP68 to 6 metres" },
            { label: "Weight", value: "207 g" },
          ],
        },
      ],
    },
    variants: [
      { group: "storage", value: "256GB", priceDelta: 0, stock: 26 },
      { group: "storage", value: "512GB", priceDelta: 11000, stock: 20 },
      { group: "storage", value: "1TB", priceDelta: 24000, stock: 12 },
      { group: "colour", value: "Obsidian", hex: "#26282d", priceDelta: 0, stock: 24 },
      { group: "colour", value: "Glacier", hex: "#dfe3e6", priceDelta: 0, stock: 18 },
      { group: "colour", value: "Cobalt", hex: "#2a4a8f", priceDelta: 0, stock: 10 },
      { group: "colour", value: "Ember", hex: "#a8452c", priceDelta: 3000, stock: 6 },
    ],
  },
  {
    product: {
      id: "p-onyx-15",
      name: "Onyx 15",
      brand: "Onyx",
      category: "phones",
      tagline: "Big screen, big battery",
      description:
        "A 6.8-inch phone that prioritises endurance over the spec sheet. A 5,400mAh cell and a 6.9mm body make it comfortable to hold, and the 144Hz panel stays smooth without draining the battery.",
      price: 74900,
      compareAt: 79900,
      rating: 4.5,
      reviewCount: 738,
      stock: 41,
      badges: ["On sale"],
      variantGroups: ["storage", "colour"],
      releasedAt: "2026-03-14",
      specs: [
        {
          group: "Display",
          rows: [
            { label: "Panel", value: "6.8-inch AMOLED, 144Hz" },
            { label: "Resolution", value: "2800 × 1260" },
            { label: "Brightness", value: "2200 nits peak" },
          ],
        },
        {
          group: "Camera",
          rows: [
            { label: "Main", value: "108MP, f/1.7, OIS" },
            { label: "Ultra-wide", value: "13MP, f/2.2" },
            { label: "Telephoto", value: "8MP, 3× optical" },
          ],
        },
        {
          group: "Battery",
          rows: [
            { label: "Capacity", value: "5,400 mAh" },
            { label: "Charging", value: "100W wired, 30W wireless" },
            { label: "Life", value: "Up to 2.5 days" },
          ],
        },
        {
          group: "Body",
          rows: [
            { label: "Thickness", value: "6.9 mm" },
            { label: "Water resistance", value: "IP54" },
            { label: "Weight", value: "198 g" },
          ],
        },
      ],
    },
    variants: [
      { group: "storage", value: "256GB", priceDelta: 0, stock: 24 },
      { group: "storage", value: "512GB", priceDelta: 9000, stock: 17 },
      { group: "colour", value: "Jet", hex: "#1c1e22", priceDelta: 0, stock: 20 },
      { group: "colour", value: "Sage", hex: "#9fb09a", priceDelta: 0, stock: 12 },
      { group: "colour", value: "Sand", hex: "#cbb392", priceDelta: 0, stock: 9 },
    ],
  },
  {
    product: {
      id: "p-pulse-mini",
      name: "Pulse Compact 5G",
      brand: "Pulse",
      category: "phones",
      tagline: "One-hand phone",
      description:
        "A 5.9-inch phone that fits properly in one hand. Small by today's standards, but with the same processor family as the flagship and a clean interface that has not been stuffed with extra apps.",
      price: 54900,
      rating: 4.3,
      reviewCount: 356,
      stock: 66,
      badges: ["Best seller"],
      variantGroups: ["storage", "colour"],
      isNew: true,
      releasedAt: "2026-08-02",
      specs: [
        {
          group: "Display",
          rows: [
            { label: "Panel", value: "5.9-inch OLED, 120Hz" },
            { label: "Resolution", value: "2400 × 1080" },
            { label: "Brightness", value: "1400 nits" },
          ],
        },
        {
          group: "Performance",
          rows: [
            { label: "Chip", value: "Pulse P3, 6-core" },
            { label: "RAM", value: "8GB" },
            { label: "Storage", value: "128GB – 512GB" },
          ],
        },
        {
          group: "Camera",
          rows: [
            { label: "Main", value: "50MP, OIS" },
            { label: "Ultra-wide", value: "12MP" },
          ],
        },
        {
          group: "Body",
          rows: [
            { label: "Dimensions", value: "146 × 69 × 8.1 mm" },
            { label: "Weight", value: "168 g" },
            { label: "Water resistance", value: "IP52" },
          ],
        },
      ],
    },
    variants: [
      { group: "storage", value: "128GB", priceDelta: 0, stock: 30 },
      { group: "storage", value: "256GB", priceDelta: 7000, stock: 26 },
      { group: "storage", value: "512GB", priceDelta: 17000, stock: 10 },
      { group: "colour", value: "Black", hex: "#202227", priceDelta: 0, stock: 28 },
      { group: "colour", value: "Mint", hex: "#a9cbbd", priceDelta: 0, stock: 21 },
      { group: "colour", value: "Lilac", hex: "#b3a5c9", priceDelta: 0, stock: 17 },
    ],
  },
  {
    product: {
      id: "p-vertex-fold",
      name: "Vertex Fold",
      brand: "Vertex",
      category: "phones",
      tagline: "Book-style foldable",
      description:
        "Folds open to a 7.8-inch tablet with almost no crease and a hinge rated for 400,000 folds. The crease-free inner display is the reason this exists — everything else is a solid Android phone around it.",
      price: 189900,
      compareAt: 209900,
      rating: 4.5,
      reviewCount: 142,
      stock: 8,
      badges: ["On sale"],
      variantGroups: ["storage", "colour"],
      releasedAt: "2026-04-01",
      specs: [
        {
          group: "Display",
          rows: [
            { label: "Inner", value: "7.8-inch foldable OLED, 120Hz" },
            { label: "Cover", value: "6.2-inch OLED, 120Hz" },
            { label: "Crease", value: "Near-invisible, water-fall hinge" },
          ],
        },
        {
          group: "Performance",
          rows: [
            { label: "Chip", value: "Vertex V9, 12-core" },
            { label: "RAM", value: "16GB" },
            { label: "Hinge rating", value: "400,000 folds" },
          ],
        },
        {
          group: "Camera",
          rows: [
            { label: "Main", value: "50MP, OIS" },
            { label: "Ultra-wide", value: "48MP" },
            { label: "Telephoto", value: "10MP, 3× optical" },
          ],
        },
        {
          group: "Body",
          rows: [
            { label: "Folded", value: "129 × 74 × 6.9 mm" },
            { label: "Weight", value: "239 g" },
            { label: "Water resistance", value: "IPX8" },
          ],
        },
      ],
    },
    variants: [
      { group: "storage", value: "256GB", priceDelta: 0, stock: 5 },
      { group: "storage", value: "512GB", priceDelta: 20000, stock: 3 },
      { group: "colour", value: "Ink", hex: "#232629", priceDelta: 0, stock: 4 },
      { group: "colour", value: "Porcelain", hex: "#dedbd4", priceDelta: 0, stock: 4 },
    ],
  },

  // ── Audio ─────────────────────────────────────────────────────────────────
  {
    product: {
      id: "p-lumen-studio-anc",
      name: "Lumen Studio ANC",
      brand: "Lumen",
      category: "audio",
      tagline: "Over-ear, adaptive ANC",
      description:
        "Flagship over-ear headphones with adaptive noise cancelling that samples the environment 48,000 times a second. Forty hours per charge, and the memory-foam earcups stay comfortable through a long-haul flight.",
      price: 44900,
      compareAt: 54900,
      rating: 4.7,
      reviewCount: 982,
      stock: 73,
      badges: ["On sale", "Best seller"],
      variantGroups: ["colour"],
      featured: true,
      releasedAt: "2026-05-02",
      specs: [
        {
          group: "Sound",
          rows: [
            { label: "Driver", value: "40mm beryllium-coated" },
            { label: "Frequency response", value: "4Hz – 40kHz" },
            { label: "Codecs", value: "LDAC, aptX Lossless, AAC, SBC" },
            { label: "Spatial audio", value: "Head-tracked, with gyro" },
          ],
        },
        {
          group: "Noise cancelling",
          rows: [
            { label: "Mode", value: "Adaptive, 8 microphones" },
            { label: "Sampling rate", value: "48kHz per second" },
            { label: "Transparency", value: "Adjustable, 0–100%" },
          ],
        },
        {
          group: "Battery",
          rows: [
            { label: "ANC on", value: "Up to 40 hours" },
            { label: "ANC off", value: "Up to 60 hours" },
            { label: "Quick charge", value: "5 min → 4 hours" },
          ],
        },
        {
          group: "Build",
          rows: [
            { label: "Weight", value: "254 g" },
            { label: "Earpad", value: "Memory foam, protein leather" },
            { label: "Folding", value: "Flat-folds into case" },
          ],
        },
      ],
    },
    variants: [
      { group: "colour", value: "Midnight", hex: "#1c2029", priceDelta: 0, stock: 30 },
      { group: "colour", value: "Sandstone", hex: "#cdbfae", priceDelta: 0, stock: 22 },
      { group: "colour", value: "Forest", hex: "#3d5245", priceDelta: 2000, stock: 14 },
      { group: "colour", value: "Ivory", hex: "#eae5db", priceDelta: 2000, stock: 7 },
    ],
  },
  {
    product: {
      id: "p-pulse-buds-pro",
      name: "Pulse Buds Pro",
      brand: "Pulse",
      category: "audio",
      tagline: "True wireless earbuds",
      description:
        "Small earbuds with genuinely good noise cancelling for the size, a transparency mode that sounds natural rather than tinny, and a case that charges from the USB-C port on the bottom.",
      price: 18900,
      compareAt: 22900,
      rating: 4.4,
      reviewCount: 1641,
      stock: 120,
      badges: ["On sale", "Best seller"],
      variantGroups: ["colour"],
      isNew: true,
      releasedAt: "2026-07-21",
      specs: [
        {
          group: "Sound",
          rows: [
            { label: "Driver", value: "11mm dual-magnet" },
            { label: "Codecs", value: "LDAC, AAC, SBC" },
            { label: "Multipoint", value: "Two devices at once" },
          ],
        },
        {
          group: "Noise cancelling",
          rows: [
            { label: "Mode", value: "Adaptive, 6 microphones" },
            { label: "Depth", value: "Up to 32 dB" },
          ],
        },
        {
          group: "Battery",
          rows: [
            { label: "Buds", value: "Up to 8 hours" },
            { label: "With case", value: "Up to 32 hours" },
            { label: "Wireless charging", value: "Qi, 10W" },
          ],
        },
        {
          group: "Fit & build",
          rows: [
            { label: "Weight", value: "4.6 g per bud" },
            { label: "Tip sizes", value: "XS / S / M / L included" },
            { label: "Water resistance", value: "IPX5" },
          ],
        },
      ],
    },
    variants: [
      { group: "colour", value: "Black", hex: "#1e2126", priceDelta: 0, stock: 52 },
      { group: "colour", value: "White", hex: "#eeeeec", priceDelta: 0, stock: 44 },
      { group: "colour", value: "Indigo", hex: "#404a80", priceDelta: 1500, stock: 24 },
    ],
  },
  {
    product: {
      id: "p-solace-soundbar",
      name: "Solace Soundbar 5.1",
      brand: "Solace",
      category: "audio",
      tagline: "Home theatre soundbar",
      description:
        "A 5.1-channel soundbar with wireless rear speakers and a wireless subwoofer. Dolby Atmos and DTS:X passthrough, and a night mode that keeps dialogue clear without waking the house.",
      price: 79900,
      rating: 4.6,
      reviewCount: 327,
      stock: 19,
      badges: ["New"],
      variantGroups: ["size"],
      isNew: true,
      releasedAt: "2026-08-19",
      specs: [
        {
          group: "Channels",
          rows: [
            { label: "Configuration", value: "5.1.2 Atmos" },
            { label: "Rear speakers", value: "Wireless, 2 included" },
            { label: "Subwoofer", value: "Wireless, 6.5-inch driver" },
          ],
        },
        {
          group: "Power",
          rows: [
            { label: "Total output", value: "520W RMS" },
            { label: "Modes", value: "Movie, Music, Voice, Night" },
          ],
        },
        {
          group: "Connectivity",
          rows: [
            { label: "HDMI", value: "HDMI 2.1, eARC" },
            { label: "Wireless", value: "Wi-Fi 6, Bluetooth 5.3" },
            { label: "Codecs", value: "Dolby Atmos, DTS:X, LPCM" },
          ],
        },
      ],
    },
    variants: [
      { group: "size", value: "43-inch bar", priceDelta: 0, stock: 11 },
      { group: "size", value: "55-inch bar", priceDelta: 12000, stock: 6 },
      { group: "size", value: "65-inch bar", priceDelta: 19000, stock: 2 },
    ],
  },
  {
    product: {
      id: "p-kestrel-monitor-ii",
      name: "Kestrel Monitor II",
      brand: "Kestrel",
      category: "audio",
      tagline: "Planar magnetic reference",
      description:
        "An open-back planar magnetic headphone for people who want to hear the recording rather than a signature. Requires a decent amplifier — the trade is honesty for portability.",
      price: 129900,
      rating: 4.9,
      reviewCount: 94,
      stock: 7,
      badges: ["Reference"],
      variantGroups: ["cable", "colour"],
      releasedAt: "2026-02-27",
      specs: [
        {
          group: "Sound",
          rows: [
            { label: "Transducer", value: "102mm planar magnetic" },
            { label: "Frequency response", value: "6Hz – 48kHz" },
            { label: "Impedance", value: "32 ohms" },
            { label: "Sensitivity", value: "100 dB/mW" },
          ],
        },
        {
          group: "Build",
          rows: [
            { label: "Weight", value: "485 g" },
            { label: "Pads", value: "Suede, interchangeable" },
            { label: "Cable", value: "Detachable, 4-pin XLR" },
          ],
        },
      ],
    },
    variants: [
      { group: "cable", value: "1.8m straight", priceDelta: 0, stock: 4 },
      { group: "cable", value: "3m coiled", priceDelta: 8000, stock: 3 },
      { group: "colour", value: "Black", hex: "#1b1d21", priceDelta: 0, stock: 5 },
      { group: "colour", value: "Silver", hex: "#c6c9ce", priceDelta: 0, stock: 2 },
    ],
  },

  // ── Cameras ───────────────────────────────────────────────────────────────
  {
    product: {
      id: "p-lumen-r7",
      name: "Lumen R7 Mirrorless",
      brand: "Lumen",
      category: "cameras",
      tagline: "Full-frame hybrid camera",
      description:
        "A 33MP full-frame body with 8-stop stabilisation and no low-pass filter, so the detail survives to the pixel. Autofocus tracks subjects reliably enough for sport, and it records 6.2K internal RAW.",
      price: 219900,
      compareAt: 234900,
      rating: 4.8,
      reviewCount: 213,
      stock: 9,
      badges: ["On sale", "Pro"],
      variantGroups: ["kit"],
      featured: true,
      releasedAt: "2026-06-26",
      specs: [
        {
          group: "Sensor",
          rows: [
            { label: "Sensor", value: "33MP full-frame BSI CMOS" },
            { label: "Low-pass filter", value: "None" },
            { label: "ISO range", value: "100–51,200 expandable" },
          ],
        },
        {
          group: "Stabilisation",
          rows: [
            { label: "Stops", value: "8 stops in-body" },
            { label: "Pixel shift", value: "160MP composite mode" },
          ],
        },
        {
          group: "Video",
          rows: [
            { label: "Internal", value: "6.2K 30p RAW, 4K 120p" },
            { label: "Codecs", value: "ProRes, BRAW, H.265 10-bit" },
            { label: "Colour", value: "15 stops of latitude, Log2" },
            { label: "Overheating", value: "None — active cooling" },
          ],
        },
        {
          group: "Autofocus",
          rows: [
            { label: "Points", value: "1,053 phase-detect" },
            { label: "Subject detect", value: "Human, animal, vehicle, aircraft" },
            { label: "Burst", value: "30 fps electronic" },
          ],
        },
        {
          group: "Body",
          rows: [
            { label: "Viewfinder", value: "9.44M-dot OLED, 120Hz" },
            { label: "Screen", value: "4.1-inch vari-angle touch" },
            { label: "Weather sealing", value: "IPX3, magnesium alloy" },
            { label: "Weight", value: "742 g with battery" },
          ],
        },
      ],
    },
    variants: [
      { group: "kit", value: "Body only", priceDelta: 0, stock: 4 },
      { group: "kit", value: "With 24–70mm f/2.8", priceDelta: 89900, stock: 3 },
      { group: "kit", value: "With 24–105mm f/4", priceDelta: 64900, stock: 2 },
    ],
  },
  {
    product: {
      id: "p-onyx-action-cam",
      name: "Onyx Action 5",
      brand: "Onyx",
      category: "cameras",
      tagline: "Action camera",
      description:
        "A rugged action camera that records 5.3K at 60fps with in-body stabilisation that genuinely works while walking. Waterproof to 12 metres without a case, and the sensor is large enough to survive a dim indoor skatepark.",
      price: 39900,
      compareAt: 44900,
      rating: 4.5,
      reviewCount: 876,
      stock: 88,
      badges: ["On sale", "Best seller"],
      variantGroups: ["bundle"],
      releasedAt: "2026-03-29",
      specs: [
        {
          group: "Sensor",
          rows: [
            { label: "Sensor", value: "1/1.9-inch CMOS" },
            { label: "Field of view", value: "155° wide, 120° medium" },
            { label: "Photo", value: "27MP stills" },
          ],
        },
        {
          group: "Video",
          rows: [
            { label: "Max resolution", value: "5.3K 60p" },
            { label: "Stabilisation", value: "Horizon lock, in-body" },
            { label: "Slow motion", value: "240p at 240fps" },
          ],
        },
        {
          group: "Build",
          rows: [
            { label: "Waterproof", value: "12 m without a case" },
            { label: "Freeze rating", value: "−20°C" },
            { label: "Battery", value: "Up to 2.5 hours" },
            { label: "Weight", value: "146 g" },
          ],
        },
      ],
    },
    variants: [
      { group: "bundle", value: "Camera only", priceDelta: 0, stock: 40 },
      { group: "bundle", value: "Adventure kit", priceDelta: 12000, stock: 32 },
      { group: "bundle", value: "Creator kit", priceDelta: 18000, stock: 16 },
    ],
  },
  {
    product: {
      id: "p-kestrel-drone",
      name: "Kestrel Air 3",
      brand: "Kestrel",
      category: "cameras",
      tagline: "Sub-250g camera drone",
      description:
        "A sub-250g drone that stays out of registration requirements in most regions but still records 4K/60 HDR from a gimbal-stabilised 1-inch sensor. Twenty-eight minutes of flight per battery.",
      price: 89900,
      rating: 4.6,
      reviewCount: 401,
      stock: 23,
      variantGroups: ["battery"],
      isNew: true,
      releasedAt: "2026-07-08",
      specs: [
        {
          group: "Camera",
          rows: [
            { label: "Sensor", value: "1-inch CMOS, 20MP" },
            { label: "Stabilisation", value: "3-axis mechanical gimbal" },
            { label: "Video", value: "4K 60p HDR, 10-bit" },
          ],
        },
        {
          group: "Flight",
          rows: [
            { label: "Max flight time", value: "28 minutes per battery" },
            { label: "Range", value: "10 km transmission" },
            { label: "Wind resistance", value: "Level 5, up to 38 km/h" },
          ],
        },
        {
          group: "Safety",
          rows: [
            { label: "Obstacle sensing", value: "Omnidirectional, binocular" },
            { label: "Weight", value: "249 g with battery" },
            { label: "Return to home", value: "Automatic, on low battery" },
          ],
        },
      ],
    },
    variants: [
      { group: "battery", value: "1 battery", priceDelta: 0, stock: 12 },
      { group: "battery", value: "3 batteries", priceDelta: 28000, stock: 8 },
      { group: "battery", value: "Fly More kit", priceDelta: 45000, stock: 3 },
    ],
  },
  {
    product: {
      id: "p-lumen-lens-2470",
      name: "Lumen 24–70mm f/2.8",
      brand: "Lumen",
      category: "cameras",
      tagline: "Standard zoom",
      description:
        "The workhorse zoom: fast enough for low light, sharp wide open, with a focus ring that can be switched to linear response for video. Weather-sealed at the same level as the R7 body.",
      price: 99900,
      rating: 4.8,
      reviewCount: 267,
      stock: 15,
      badges: ["Pro"],
      variantGroups: ["mount"],
      releasedAt: "2026-01-15",
      specs: [
        {
          group: "Optics",
          rows: [
            { label: "Focal length", value: "24–70mm" },
            { label: "Maximum aperture", value: "f/2.8 constant" },
            { label: "Elements", value: "18 in 12 groups" },
            { label: "Elements", value: "2 aspherical, 3 ED, 2 super-ED" },
          ],
        },
        {
          group: "Mechanics",
          rows: [
            { label: "Min focus", value: "0.21 m" },
            { label: "Filter size", value: "82 mm" },
            { label: "Focus", value: "Dual linear motors" },
            { label: "Weight", value: "695 g" },
          ],
        },
      ],
    },
    variants: [
      { group: "mount", value: "R-mount", priceDelta: 0, stock: 10 },
      { group: "mount", value: "E-mount", priceDelta: 0, stock: 5 },
    ],
  },

  // ── Wearables ─────────────────────────────────────────────────────────────
  {
    product: {
      id: "p-vertex-watch-ultra",
      name: "Vertex Watch Ultra 2",
      brand: "Vertex",
      category: "wearables",
      tagline: "Titanium multisport watch",
      description:
        "A titanium multisport watch with dual-band GPS that holds a track through a city canyon, a 36-hour battery in full GPS mode, and a sapphire crystal over the always-on display.",
      price: 89900,
      compareAt: 99900,
      rating: 4.7,
      reviewCount: 543,
      stock: 31,
      badges: ["On sale", "Best seller"],
      variantGroups: ["size", "colour"],
      featured: true,
      releasedAt: "2026-04-30",
      specs: [
        {
          group: "Display",
          rows: [
            { label: "Panel", value: "1.4-inch LTPO AMOLED" },
            { label: "Brightness", value: "3000 nits peak" },
            { label: "Crystal", value: "Sapphire, anti-reflective" },
            { label: "Always-on", value: "Yes, 1 Hz refresh" },
          ],
        },
        {
          group: "GPS",
          rows: [
            { label: "Bands", value: "Dual-band L1 + L5" },
            { label: "Accuracy", value: "Sub-metre, course data" },
            { label: "Maps", value: "Full offline topo maps" },
          ],
        },
        {
          group: "Battery",
          rows: [
            { label: "Smart mode", value: "Up to 21 days" },
            { label: "Full GPS", value: "Up to 36 hours" },
            { label: "Expedition mode", value: "Up to 60 days" },
          ],
        },
        {
          group: "Body",
          rows: [
            { label: "Material", value: "Grade 5 titanium" },
            { label: "Water resistance", value: "10 ATM, EN13319" },
            { label: "Weight", value: "61 g" },
          ],
        },
      ],
    },
    variants: [
      { group: "size", value: "41mm", priceDelta: 0, stock: 14 },
      { group: "size", value: "47mm", priceDelta: 4000, stock: 17 },
      { group: "colour", value: "Natural titanium", hex: "#b9b4a8", priceDelta: 0, stock: 15 },
      { group: "colour", value: "Black titanium", hex: "#2f3236", priceDelta: 0, stock: 10 },
      { group: "colour", value: "Slate", hex: "#5b6068", priceDelta: 2000, stock: 6 },
    ],
  },
  {
    product: {
      id: "p-pulse-band-8",
      name: "Pulse Band 8",
      brand: "Pulse",
      category: "wearables",
      tagline: "Everyday fitness tracker",
      description:
        "A tracker with a screen you can read outdoors, three weeks of battery, and sleep staging that matches what a clinical device reports closely enough to be useful. Light enough to forget you are wearing it.",
      price: 12900,
      compareAt: 15900,
      rating: 4.2,
      reviewCount: 2287,
      stock: 140,
      badges: ["On sale", "Best seller"],
      variantGroups: ["size", "colour"],
      releasedAt: "2026-02-06",
      specs: [
        {
          group: "Display",
          rows: [
            { label: "Panel", value: "1.47-inch AMOLED" },
            { label: "Brightness", value: "1500 nits peak" },
            { label: "Always-on", value: "Yes" },
          ],
        },
        {
          group: "Health",
          rows: [
            { label: "Heart rate", value: "Continuous, 8 PPG LEDs" },
            { label: "SpO2", value: "Blood oxygen, on demand" },
            { label: "ECG", value: "Single-lead, on wrist" },
            { label: "Sleep", value: "Staged, with naps" },
          ],
        },
        {
          group: "Battery",
          rows: [
            { label: "Typical use", value: "Up to 21 days" },
            { label: "With always-on", value: "Up to 14 days" },
          ],
        },
        {
          group: "Body",
          rows: [
            { label: "Weight", value: "21 g" },
            { label: "Water resistance", value: "5 ATM" },
            { label: "Strap", value: "22mm quick-release" },
          ],
        },
      ],
    },
    variants: [
      { group: "size", value: "Small", priceDelta: 0, stock: 60 },
      { group: "size", value: "Large", priceDelta: 0, stock: 80 },
      { group: "colour", value: "Black", hex: "#1d1f23", priceDelta: 0, stock: 70 },
      { group: "colour", value: "Ivory", hex: "#e9e5dd", priceDelta: 0, stock: 46 },
      { group: "colour", value: "Coral", hex: "#d4795f", priceDelta: 0, stock: 24 },
    ],
  },
  {
    product: {
      id: "p-onyx-smart-ring",
      name: "Onyx Ring 3",
      brand: "Onyx",
      category: "wearables",
      tagline: "Sleep and recovery ring",
      description:
        "A titanium ring that tracks recovery without a screen and without a subscription. Reads heart-rate variability, skin temperature and movement through the night; the app tells you when to back off training.",
      price: 29900,
      rating: 4.1,
      reviewCount: 519,
      stock: 54,
      variantGroups: ["size", "colour"],
      isNew: true,
      releasedAt: "2026-08-11",
      specs: [
        {
          group: "Sensors",
          rows: [
            { label: "Heart rate", value: "Infrared + green PPG" },
            { label: "Temperature", value: "Skin, ±0.1°C" },
            { label: "Movement", value: "3-axis accelerometer" },
          ],
        },
        {
          group: "Metrics",
          rows: [
            { label: "Sleep", value: "Stages, duration, consistency" },
            { label: "Recovery", value: "HRV, resting HR, skin temp" },
            { label: "Training", value: "Readiness score, strain" },
          ],
        },
        {
          group: "Body",
          rows: [
            { label: "Material", value: "Grade 5 titanium, zirconia inner" },
            { label: "Battery", value: "Up to 7 days" },
            { label: "Water resistance", value: "100 m" },
            { label: "Weight", value: "2.6 g" },
          ],
        },
      ],
    },
    variants: [
      { group: "size", value: "Size 7", priceDelta: 0, stock: 12 },
      { group: "size", value: "Size 8", priceDelta: 0, stock: 14 },
      { group: "size", value: "Size 9", priceDelta: 0, stock: 12 },
      { group: "size", value: "Size 10", priceDelta: 0, stock: 10 },
      { group: "size", value: "Size 11", priceDelta: 0, stock: 6 },
      { group: "colour", value: "Silver", hex: "#c9ccd0", priceDelta: 0, stock: 32 },
      { group: "colour", value: "Black", hex: "#22252a", priceDelta: 0, stock: 22 },
    ],
  },
  {
    product: {
      id: "p-aether-ar-glasses",
      name: "Aether AR Frame",
      brand: "Aether",
      category: "wearables",
      tagline: "Everyday AR glasses",
      description:
        "Lightweight AR glasses that put a 480p display in front of each eye without turning into a costume. Six hours of mixed use, with the compute handled by the phone in your pocket over a wireless link.",
      price: 139900,
      rating: 4.0,
      reviewCount: 128,
      stock: 11,
      badges: ["New", "Experimental"],
      variantGroups: ["lens"],
      isNew: true,
      releasedAt: "2026-09-01",
      specs: [
        {
          group: "Display",
          rows: [
            { label: "Per eye", value: "480p micro-OLED" },
            { label: "Field of view", value: "46° diagonal" },
            { label: "Brightness", value: "2000 nits" },
          ],
        },
        {
          group: "Build",
          rows: [
            { label: "Weight", value: "68 g" },
            { label: "Lens", value: "Prescription-ready inserts" },
            { label: "Tracking", value: "Inside-out, 6DoF" },
          ],
        },
        {
          group: "Battery",
          rows: [
            { label: "Mixed use", value: "Up to 6 hours" },
            { label: "Standby", value: "Up to 3 days" },
            { label: "Charging", value: "USB-C, 45 minutes" },
          ],
        },
      ],
    },
    variants: [
      { group: "lens", value: "Standard", priceDelta: 0, stock: 6 },
      { group: "lens", value: "Prescription inserts", priceDelta: 9000, stock: 5 },
    ],
  },

  // ── Accessories ───────────────────────────────────────────────────────────
  {
    product: {
      id: "p-aether-magsafe-stand",
      name: "Aether Mag Stand Pro",
      brand: "Aether",
      category: "accessories",
      tagline: "3-in-1 charging stand",
      description:
        "A weighted desk stand that charges phone, watch and earbuds at once. Folds flat enough to travel, and the charging puck holds a phone at a comfortable angle for video calls rather than at a useless angle in the dark.",
      price: 19900,
      compareAt: 24900,
      rating: 4.5,
      reviewCount: 1436,
      stock: 96,
      badges: ["On sale", "Best seller"],
      variantGroups: ["colour"],
      featured: true,
      releasedAt: "2026-05-20",
      specs: [
        {
          group: "Charging",
          rows: [
            { label: "Phone", value: "15W magnetic" },
            { label: "Watch", value: "5W fast charging" },
            { label: "Earbuds", value: "5W Qi" },
            { label: "Total", value: "25W combined" },
          ],
        },
        {
          group: "Build",
          rows: [
            { label: "Material", value: "Anodised aluminium" },
            { label: "Weight", value: "480 g" },
            { label: "Folded", value: "102 × 68 × 32 mm" },
          ],
        },
        {
          group: "Power",
          rows: [
            { label: "Input", value: "USB-C, 30W adapter included" },
            { label: "Cable", value: "1.5m braided USB-C" },
          ],
        },
      ],
    },
    variants: [
      { group: "colour", value: "Silver", hex: "#cdd0d4", priceDelta: 0, stock: 42 },
      { group: "colour", value: "Space grey", hex: "#4a4e55", priceDelta: 0, stock: 38 },
      { group: "colour", value: "Black", hex: "#1f2226", priceDelta: 0, stock: 16 },
    ],
  },
  {
    product: {
      id: "p-vertex-mech-keyboard",
      name: "Vertex 75 Mechanical",
      brand: "Vertex",
      category: "accessories",
      tagline: "75% mechanical keyboard",
      description:
        "A gasket-mounted 75% keyboard with hot-swap switches and a knob. Double-shot PBT keycaps survive being used daily, and the foam stack inside removes most of the hollow ping cheap boards have.",
      price: 17900,
      compareAt: 21900,
      rating: 4.7,
      reviewCount: 892,
      stock: 64,
      badges: ["On sale", "Best seller"],
      variantGroups: ["switch", "colour"],
      releasedAt: "2026-03-18",
      specs: [
        {
          group: "Switches",
          rows: [
            { label: "Type", value: "Hot-swap, 5-pin" },
            { label: "Included", value: "Factory-lubed linear" },
            { label: "Keycaps", value: "Double-shot PBT" },
          ],
        },
        {
          group: "Build",
          rows: [
            { label: "Mount", value: "Gasket, 5-layer foam" },
            { label: "Layout", value: "75%, 82 keys" },
            { label: "Knob", value: "Multi-function, push to mute" },
            { label: "Weight", value: "1.4 kg" },
          ],
        },
        {
          group: "Connectivity",
          rows: [
            { label: "Wired", value: "USB-C, detachable" },
            { label: "Wireless", value: "Bluetooth 5.3, 2.4 GHz" },
            { label: "Battery", value: "4000 mAh, 120 hours" },
          ],
        },
      ],
    },
    variants: [
      { group: "switch", value: "Linear", priceDelta: 0, stock: 30 },
      { group: "switch", value: "Tactile", priceDelta: 0, stock: 22 },
      { group: "switch", value: "Clicky", priceDelta: 1000, stock: 12 },
      { group: "colour", value: "Navy", hex: "#2b3a55", priceDelta: 0, stock: 26 },
      { group: "colour", value: "Beige", hex: "#d8cdb8", priceDelta: 0, stock: 24 },
      { group: "colour", value: "Charcoal", hex: "#33363b", priceDelta: 0, stock: 14 },
    ],
  },
  {
    product: {
      id: "p-solace-usb-c-hub",
      name: "Solace 11-in-1 Hub",
      brand: "Solace",
      category: "accessories",
      tagline: "Thunderbolt dock",
      description:
        "An eleven-port Thunderbolt dock with 140W of laptop charging over a single cable. Drives two 4K displays at 60Hz and includes 2.5GbE, which matters more than the port count suggests.",
      price: 24900,
      compareAt: 29900,
      rating: 4.4,
      reviewCount: 611,
      stock: 71,
      badges: ["On sale"],
      variantGroups: ["colour"],
      releasedAt: "2026-04-08",
      specs: [
        {
          group: "Ports",
          rows: [
            { label: "Display", value: "2× DisplayPort 1.4, 1× HDMI 2.1" },
            { label: "Data", value: "3× USB-A, 2× USB-C 10Gbps" },
            { label: "Network", value: "2.5GbE" },
            { label: "Media", value: "SDXC + microSD" },
            { label: "Power in", value: "Thunderbolt 5" },
          ],
        },
        {
          group: "Power",
          rows: [
            { label: "Laptop charging", value: "140W Power Delivery 3.1" },
            { label: "Adapter", value: "180W GaN included" },
          ],
        },
        {
          group: "Display",
          rows: [
            { label: "Dual 4K", value: "60Hz, 10-bit" },
            { label: "Single 8K", value: "60Hz, DSC" },
          ],
        },
      ],
    },
    variants: [
      { group: "colour", value: "Space grey", hex: "#4c5057", priceDelta: 0, stock: 40 },
      { group: "colour", value: "Silver", hex: "#c8cbd0", priceDelta: 0, stock: 31 },
    ],
  },
  {
    product: {
      id: "p-onyx-trail-bum",
      name: "Onyx Trail 24L",
      brand: "Onyx",
      category: "accessories",
      tagline: "Everyday hiking pack",
      description:
        "A 24-litre pack that works for a day commute and a weekend out. The back panel vents properly, and there is a real rain cover in the base pocket rather than one you have to buy separately.",
      price: 15900,
      rating: 4.6,
      reviewCount: 284,
      stock: 43,
      badges: ["New"],
      variantGroups: ["capacity"],
      isNew: true,
      releasedAt: "2026-08-25",
      specs: [
        {
          group: "Volume",
          rows: [
            { label: "Main compartment", value: "24 L" },
            { label: "Laptop sleeve", value: "Fits 16-inch" },
            { label: "Hydration", value: "2 L reservoir, fits" },
          ],
        },
        {
          group: "Back system",
          rows: [
            { label: "Panel", value: "Vented, adjustable" },
            { label: "Hip belt", value: "Padded, pockets both sides" },
            { label: "Load lifters", value: "Yes" },
          ],
        },
        {
          group: "Materials",
          rows: [
            { label: "Shell", value: "500D recycled ripstop" },
            { label: "Weight", value: "1.05 kg" },
            { label: "Water resistance", value: "DWR finish, PFAS-free" },
          ],
        },
      ],
    },
    variants: [
      { group: "capacity", value: "24L", priceDelta: 0, stock: 26 },
      { group: "capacity", value: "34L", priceDelta: 14000, stock: 17 },
    ],
  },
  {
    product: {
      id: "p-kestrel-monitor-stand",
      name: "Kestrel Monitor Arm",
      brand: "Kestrel",
      category: "accessories",
      tagline: "Single monitor arm",
      description:
        "A gas-spring monitor arm that holds position without drifting. Takes up to 12kg and fits most VESA mounts, with a cable channel that actually keeps cables out of the way.",
      price: 12900,
      compareAt: 15900,
      rating: 4.3,
      reviewCount: 457,
      stock: 78,
      badges: ["On sale"],
      variantGroups: ["mount"],
      releasedAt: "2026-02-14",
      specs: [
        {
          group: "Capacity",
          rows: [
            { label: "Max load", value: "12 kg" },
            { label: "Screen size", value: "17-inch to 34-inch" },
            { label: "VESA", value: "75×75, 100×100" },
          ],
        },
        {
          group: "Movement",
          rows: [
            { label: "Type", value: "Gas spring, tension adjustable" },
            { label: "Reach", value: "52 cm" },
            { label: "Rotation", value: "360°" },
            { label: "Tilt", value: "−5° to +35°" },
          ],
        },
        {
          group: "Install",
          rows: [
            { label: "Mount", value: "Clamp or grommet" },
            { label: "Cable management", value: "Integrated channel + clips" },
          ],
        },
      ],
    },
    variants: [
      { group: "mount", value: "Desk clamp", priceDelta: 0, stock: 44 },
      { group: "mount", value: "Grommet mount", priceDelta: 0, stock: 34 },
    ],
  },
  {
    product: {
      id: "p-aether-charger-100w",
      name: "Aether 100W Charger",
      brand: "Aether",
      category: "accessories",
      tagline: "Four-port GaN charger",
      description:
        "A four-port GaN charger that replaces three bricks. Charges a 16-inch laptop at full speed while still powering a phone, watch and pair of buds at once, and it is small enough to matter in a carry-on.",
      price: 6900,
      compareAt: 8900,
      rating: 4.6,
      reviewCount: 1902,
      stock: 210,
      badges: ["On sale", "Best seller"],
      variantGroups: ["plug"],
      releasedAt: "2026-01-08",
      specs: [
        {
          group: "Output",
          rows: [
            { label: "Total", value: "100W" },
            { label: "Ports", value: "2× USB-C, 2× USB-A" },
            { label: "Max single port", value: "65W USB-C" },
            { label: "Protocols", value: "PD 3.1, PPS, QC 4+" },
          ],
        },
        {
          group: "Build",
          rows: [
            { label: "Technology", value: "GaN II" },
            { label: "Size", value: "68 × 68 × 32 mm" },
            { label: "Weight", value: "185 g" },
            { label: "Cable", value: "1m USB-C braided included" },
          ],
        },
      ],
    },
    variants: [
      { group: "plug", value: "US plug", priceDelta: 0, stock: 130 },
      { group: "plug", value: "EU plug", priceDelta: 0, stock: 58 },
      { group: "plug", value: "UK plug", priceDelta: 0, stock: 22 },
    ],
  },
];

function buildVariants(drafts: VariantDraft[]): VariantOption[] {
  return drafts.map((v) => ({
    group: v.group,
    value: v.value,
    hex: v.hex,
    priceDelta: v.priceDelta,
    stock: v.stock,
  }));
}

export const PRODUCTS: Product[] = RAW.map(({ product, variants }) => ({
  ...product,
  slug: product.id.replace(/^p-/, "").replace(/-/g, "-"),
  badges: product.badges ?? [],
  variantGroups: product.variantGroups ?? [],
  variants: buildVariants(variants),
  featured: product.featured ?? false,
  isNew: product.isNew ?? false,
}));

export const PRODUCT_BY_ID = new Map(PRODUCTS.map((p) => [p.id, p]));

export function getProductBySlug(slug: string): Product | undefined {
  return PRODUCTS.find((p) => p.slug === slug);
}

export function getProduct(id: string): Product | undefined {
  return PRODUCT_BY_ID.get(id);
}

/** Total stock across every variant of a product, or its own stock if unvaried. */
export function totalStock(product: Product): number {
  if (product.variants.length === 0) return product.stock;
  return product.variants.reduce((sum, v) => sum + v.stock, 0);
}

/** Low-stock threshold used by the badge logic and admin inventory warnings. */
export const LOW_STOCK = 10;

export function priceFor(product: Product, variantValue?: string): number {
  if (!variantValue) return product.price;
  const v = product.variants.find((x) => x.value === variantValue);
  return product.price + (v?.priceDelta ?? 0);
}

export function stockFor(product: Product, variantValue?: string): number {
  if (!variantValue) {
    return product.variants.length === 0 ? product.stock : totalStock(product);
  }
  return product.variants.find((x) => x.value === variantValue)?.stock ?? 0;
}

/** The categories actually present in the catalog, for the nav. */
export function categoryCount(slug: Category): number {
  return PRODUCTS.filter((p) => p.category === slug).length;
}

export const PRICE_BOUNDS = {
  min: Math.min(...PRODUCTS.map((p) => p.price)),
  max: Math.max(...PRODUCTS.map((p) => p.price)),
};

// Referenced by the raw builders above for variant group labels; kept here so
// the label wording lives with the data rather than in a UI component.
export const VARIANT_LABELS: Record<string, string> = {
  storage: "Storage",
  memory: "Memory",
  colour: "Finish",
  graphics: "Graphics",
  keyboard: "Keyboard",
  kit: "Kit",
  bundle: "Bundle",
  cable: "Cable",
  size: "Size",
  lens: "Lenses",
  switch: "Switch",
  battery: "Batteries",
  plug: "Plug type",
  capacity: "Capacity",
  mount: "Mount",
};

export function variantLabel(group: string): string {
  return VARIANT_LABELS[group] ?? group;
}