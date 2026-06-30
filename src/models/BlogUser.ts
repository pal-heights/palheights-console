import mongoose, { Schema, models, model } from "mongoose";
import bcrypt from "bcryptjs";

const BlogUserSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
      select: false, // never return password by default
    },

    role: {
      type: String,
      enum: ["blog-manager", "blog-writer"],
      default: "blog-manager",
    },

    isBanned: {
      type: Boolean,
      default: false,
    },

    isDeleted: {
      type: Boolean,
      default: false,
    },

    lastLoginAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

/* ---------- Hash password ---------- */
BlogUserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

/* ---------- Methods ---------- */
BlogUserSchema.methods.comparePassword = function (plain: string) {
  return bcrypt.compare(plain, this.password);
};

const BlogUser = models.BlogUser || model("BlogUser", BlogUserSchema);

export default BlogUser;
