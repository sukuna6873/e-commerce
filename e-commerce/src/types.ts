export type Category =
  | "laptops"
  | "phones"
  | "audio"
  | "cameras"
  | "wearables"
  | "accessories";

export interface CategoryMeta {
  slug: Category;
  name: string;
  tagline: string;
}

export interface VariantOption {
  /** e.g. "storage" or "colour" */
  group: string;
  value: string;
  /** hex used for colourway swatches */
  hex?: string;
  /** price delta in cents applied to the base price */
  priceDelta?: number;
  stock: number;
}

export interface SpecRow {
  label: string;
  value: string;
}

export interface SpecGroup {
  group: string;
  rows: SpecRow[];
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  brand: string;
  category: Category;
  tagline: string;
  description: string;
  /** price in cents */
  price: number;
  /** pre-discount price in cents, absent when not on sale */
  compareAt?: number;
  rating: number;
  reviewCount: number;
  stock: number;
  badges: string[];
  variantGroups: string[];
  variants: VariantOption[];
  specs: SpecGroup[];
  featured: boolean;
  isNew: boolean;
  releasedAt: string;
}

export interface Review {
  id: string;
  productId: string;
  author: string;
  rating: number;
  title: string;
  body: string;
  createdAt: string;
  verifiedPurchase: boolean;
  helpfulCount: number;
}

export interface CartLine {
  id: string;
  productId: string;
  variantGroup?: string;
  variantValue?: string;
  quantity: number;
  addedAt: string;
}

export interface Address {
  id: string;
  /** Owner. The two seeded demo addresses belong to `u-alex`. */
  userId: string;
  label: string;
  fullName: string;
  line1: string;
  line2?: string;
  city: string;
  region: string;
  postcode: string;
  country: string;
  phone: string;
  isDefault: boolean;
}

export type OrderStatus =
  | "placed"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled";

export interface OrderItem {
  productId: string;
  name: string;
  brand: string;
  variantGroup?: string;
  variantValue?: string;
  /** unit price captured at purchase time, in cents */
  unitPrice: number;
  quantity: number;
}

export interface OrderEvent {
  status: OrderStatus;
  at: string;
  note: string;
}

export interface Order {
  id: string;
  number: string;
  userId: string;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  tax: number;
  discount: number;
  total: number;
  status: OrderStatus;
  placedAt: string;
  events: OrderEvent[];
  shippingAddress: Address;
  billingSameAsShipping: boolean;
  paymentBrand: string;
  paymentLast4: string;
}

export type Role = "customer" | "admin";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatarHue: number;
  createdAt: string;
}

export type SortKey =
  | "featured"
  | "price-asc"
  | "price-desc"
  | "rating"
  | "newest"
  | "name";

export interface ProductQuery {
  search?: string;
  categories?: Category[];
  brands?: string[];
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  inStockOnly?: boolean;
  onSaleOnly?: boolean;
  sort?: SortKey;
  page?: number;
  perPage?: number;
}

export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}