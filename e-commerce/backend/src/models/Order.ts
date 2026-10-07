import mongoose, { Document, Schema } from 'mongoose';

export interface IOrderItem {
  productId: string;
  variantValue: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  name: string;
  image?: string;
}

export interface IOrderAddress {
  label: string;
  name: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface IOrderTotals {
  subtotal: number;
  shipping: number;
  tax: number;
  discount: number;
  total: number;
}

export interface IPaymentInfo {
  method: 'card' | 'upi' | 'cod';
  last4?: string;
  brand?: string;
  upiId?: string;
}

export interface ITimelineEvent {
  status: string;
  timestamp: Date;
  note?: string;
}

export interface IOrder extends Document {
  id: string;
  userId: string;
  items: IOrderItem[];
  totals: IOrderTotals;
  status: 'placed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  shippingAddress: IOrderAddress;
  billingAddress: IOrderAddress;
  payment: IPaymentInfo;
  timeline: ITimelineEvent[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const OrderItemSchema = new Schema<IOrderItem>({
  productId: { type: String, required: true },
  variantValue: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  unitPrice: { type: Number, required: true, min: 0 },
  totalPrice: { type: Number, required: true, min: 0 },
  name: { type: String, required: true },
  image: { type: String },
}, { _id: false });

const OrderAddressSchema = new Schema<IOrderAddress>({
  label: { type: String, required: true },
  name: { type: String, required: true },
  phone: { type: String, required: true },
  line1: { type: String, required: true },
  line2: { type: String },
  city: { type: String, required: true },
  state: { type: String, required: true },
  postalCode: { type: String, required: true },
  country: { type: String, required: true },
}, { _id: false });

const OrderTotalsSchema = new Schema<IOrderTotals>({
  subtotal: { type: Number, required: true, min: 0 },
  shipping: { type: Number, required: true, min: 0 },
  tax: { type: Number, required: true, min: 0 },
  discount: { type: Number, required: true, min: 0, default: 0 },
  total: { type: Number, required: true, min: 0 },
}, { _id: false });

const PaymentInfoSchema = new Schema<IPaymentInfo>({
  method: { type: String, enum: ['card', 'upi', 'cod'], required: true },
  last4: { type: String },
  brand: { type: String },
  upiId: { type: String },
}, { _id: false });

const TimelineEventSchema = new Schema<ITimelineEvent>({
  status: { type: String, required: true },
  timestamp: { type: Date, required: true, default: Date.now },
  note: { type: String },
}, { _id: false });

const OrderSchema = new Schema<IOrder>({
  id: { type: String, required: true, unique: true },
  userId: { type: String, required: true, index: true },
  items: [OrderItemSchema],
  totals: { type: OrderTotalsSchema, required: true },
  status: { type: String, enum: ['placed', 'processing', 'shipped', 'delivered', 'cancelled'], required: true, default: 'placed', index: true },
  shippingAddress: { type: OrderAddressSchema, required: true },
  billingAddress: { type: OrderAddressSchema, required: true },
  payment: { type: PaymentInfoSchema, required: true },
  timeline: [TimelineEventSchema],
  notes: { type: String },
}, {
  timestamps: true,
});

OrderSchema.index({ userId: 1, createdAt: -1 });
OrderSchema.index({ status: 1 });
OrderSchema.index({ 'items.productId': 1 });
OrderSchema.index({ createdAt: -1 });

export const Order = mongoose.model<IOrder>('Order', OrderSchema);