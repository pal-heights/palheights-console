import mongoose, { Document, Schema } from 'mongoose';

export type UserStatus = "active" | "blocked";
export type RequestStatus = "pending" | "in progress" | "completed" ;

export interface IUser extends Document {
  userName: string;
  email: string;
  phone: string;
  verified: boolean;
  status: UserStatus;
  requestStatus: RequestStatus;
  profilePicture: string;
  password: string;
  isAdmin: boolean;
  trash: boolean;
  leadsInitiated: Schema.Types.ObjectId[];
  createdAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    userName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    phone: { type: String, required: true },
    verified: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ["active", "blocked"],
      default: "active",
    },
    requestStatus: {
      type: String,
      enum: ["pending", "in progress", "completed"],
      default: "pending",
    },
    profilePicture: { type: String, default: "" },
    password: { type: String, required: true },
    isAdmin: { type: Boolean, default: false },
    trash: { type: Boolean, default: false },
    leadsInitiated: [{ type: Schema.Types.ObjectId, ref: 'Lead' }],
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
