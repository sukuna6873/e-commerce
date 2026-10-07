import mongoose, { Document, Schema } from 'mongoose';

export interface IVariantOption {
  group: string;
  value: string;
  hex?: string;
  priceDelta: number;
  stock: number;
  sku?: string;
}

export interface ISpecs {
  [key: string]: string;
}

export interface IProduct extends Document {
  id: string;
  name: string;
  slug: string;
  category: string;
  brand: string;
  basePrice: number;
  compareAtPrice?: number;
  description: string;
  specs: ISpecs;
  badges: string[];
  variants: IVariantOption[];
  images: string[];
  rating: number;
  reviewCount: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const VariantOptionSchema = new Schema<IVariantOption>({
  group: { type: String, required: true },
  value: { type: String, required: true },
  hex: { type: String },
  priceDelta: { type: Number, required: true, default: 0 },
  stock: { type: Number, required: true, default: 0 },
  sku: { type: String },
}, { _id: false });

const ProductSchema = new Schema<IProduct>({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, lowercase: true },
  category: { type: String, required: true, index: true },
  brand: { type: String, required: true, trim: true, index: true },
  basePrice: { type: Number, required: true, min: 0 },
  compareAtPrice: { type: Number, min: 0 },
  description: { type: String, required: true },
  specs: { type: Schema.Types.Mixed, default: {} },
  badges: [{ type: String }],
  variants: [VariantOptionSchema],
  images: [{ type: String }],
  rating: { type: Number, default: 0, min: 0, max: 5 },
  reviewCount: { type: Number, default: 0, min: 0 },
  isActive: { type: Boolean, default: true, index: true },
}, {
  timestamps: true,
});

ProductSchema.index({ category: 1, isActive: 1 });
ProductSchema.index({ basePrice: 1 });
ProductSchema.index({ rating: -1 });
ProductSchema.index({ createdAt: -1 });
ProductSchema.index({ 'variants.sku': 1 }, { unique: true, sparse: true });
ProductSchema.index({ name: 'text', description: 'text', brand: 'text' });

export const Product = mongoose.model<IProduct>('Product', ProductSchema);