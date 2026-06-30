import mongoose from "mongoose";

const AnnouncementImageSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      required: true,
    },
  },
  { _id: false },
);

const AnnouncementSchema = new mongoose.Schema(
  {
    mode: {
      type: String,
      enum: ["single", "slider"],
      required: true,
    },

    images: {
      type: [AnnouncementImageSchema],
      default: [],
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  { timestamps: true },
);

export default mongoose.models.Announcement ||
  mongoose.model("Announcement", AnnouncementSchema);
