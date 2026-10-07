import mongoose, { Document, Schema } from 'mongoose';

export interface IAdmin extends Document {
  email: string;
  username: string;
  passwordHash: string;
  role: 'superadmin' | 'admin' | 'moderator';
  permissions: string[];
  lastLoginAt?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const AdminSchema = new Schema<IAdmin>({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  username: { type: String, required: true, unique: true, trim: true, minlength: 3, maxlength: 30 },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['superadmin', 'admin', 'moderator'], required: true, default: 'admin' },
  permissions: { type: [String], default: [] },
  lastLoginAt: { type: Date },
  isActive: { type: Boolean, default: true },
}, {
  timestamps: true,
});

AdminSchema.index({ role: 1 });
AdminSchema.index({ isActive: 1 });

export const Admin = mongoose.model<IAdmin>('Admin', AdminSchema);