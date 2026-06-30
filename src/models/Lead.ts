import mongoose, { Document, Schema } from "mongoose";

export type LeadStatus = "pending" | "in progress" | "completed";
export type AssignedBo = "none";

export interface ILead extends Document {
  fullName?: string;
  email: string;
  phoneNumber?: string;
  message?: string;
  assignedBo: AssignedBo;
  assignedTo?: mongoose.Types.ObjectId | null;
  status: LeadStatus;
  trash: boolean;
  verified: boolean;
  createdAt: Date;
  service?: string[];
  user?: mongoose.Types.ObjectId;
}

const LeadSchema = new Schema<ILead>(
  {
    fullName: {
      type: String,
      trim: true,
      required: false,
    },

    email: {
      type: String,
      required: true,
      trim: true,
    },

    phoneNumber: {
      type: String,
      trim: true,
      required: false,
    },

    message: {
      type: String,
      default: "No message provided",
    },

    service: {
      type: [String],
      default: [],
      required: false,
    },

    assignedBo: {
      type: String,
      enum: ["none"],
      default: "none",
    },

    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: "BOEUser",
      default: null,
    },

    status: {
      type: String,
      enum: ["pending", "in progress", "completed"],
      default: "pending",
    },

    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },

    trash: {
      type: Boolean,
      default: false,
    },

    verified: {
      type: Boolean,
      default: false,
    },

    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

export default mongoose.models.Lead ||
  mongoose.model<ILead>("Lead", LeadSchema);
