import mongoose, { Document, Schema } from 'mongoose';

export interface IWishlistItem {
  productId: string;
  variantValue?: string;
}

export interface IWishlist extends Document {
  userId: string;
  items: IWishlistItem[];
  updatedAt: Date;
}

const WishlistItemSchema = new Schema<IWishlistItem>({
  productId: { type: String, required: true },
  variantValue: { type: String },
}, { _id: false });

const WishlistSchema = new Schema<IWishlist>({
  userId: { type: String, required: true, unique: true, index: true },
  items: [WishlistItemSchema],
  updatedAt: { type: Date, default: Date.now },
}, {
  timestamps: false,
});

export const Wishlist = mongoose.model<IWishlist>('Wishlist', WishlistSchema);