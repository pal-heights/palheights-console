import mongoose, { Document, Schema } from 'mongoose';

export interface IBOEUser extends Document {
  userName: string;
  email: string;
  password: string;
  isBoe: boolean;
  assignedLeads: mongoose.Types.ObjectId[];
  takenOverLeads: mongoose.Types.ObjectId[];
  trash: boolean;
  isVerified: boolean;
  createdAt: Date;
  status: boolean;
}

const BOEUserSchema = new Schema<IBOEUser>({
  userName: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  isBoe: { type: Boolean, default: true },
  assignedLeads: [{ type: Schema.Types.ObjectId, ref: 'Lead' }],
  takenOverLeads: [{ type: Schema.Types.ObjectId, ref: 'Lead' }],
  trash: { type: Boolean, default: false },
  isVerified: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  status: {
    type: Boolean,
    default: true,
  },
});

export default mongoose.models.BOEUser || mongoose.model<IBOEUser>('BOEUser', BOEUserSchema); 