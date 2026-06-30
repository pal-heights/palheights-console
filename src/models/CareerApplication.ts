import mongoose, { Schema, models, model } from "mongoose";

const CareerApplicationSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
      maxlength: 20,
    },
    position: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    resume: {
      filename: { type: String, required: true }, // original file name
      mimetype: { type: String, required: true },
      size: { type: Number, required: true }, // in bytes
      key: { type: String, required: true }, // R2 path e.g. Applicants/uuid.webp
    },
  },
  { timestamps: true, collection: "applicants" },
);

export default models.CareerApplication ||
  model("CareerApplication", CareerApplicationSchema);
