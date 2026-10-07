import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  email: string;
  name: string;
  role: 'customer' | 'admin';
  avatarHue: number;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  name: { type: String, required: true, trim: true },
  role: { type: String, enum: ['customer', 'admin'], required: true, default: 'customer' },
  avatarHue: { type: Number, required: true, min: 0, max: 360 },
}, {
  timestamps: true,
});

UserSchema.index({ role: 1 });

export const User = mongoose.model<IUser>('User', UserSchema);