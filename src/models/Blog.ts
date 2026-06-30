// import mongoose, { Schema, models, model } from "mongoose";

// /* ---------- Sub Schemas ---------- */

// const ImageSchema = new Schema(
//   {
//     data: { type: String, required: true }, // base64
//     mime: { type: String, required: true },
//     size: { type: Number, required: true },
//   },
//   { _id: false },
// );

// const BlockSchema = new Schema(
//   {
//     id: { type: String, required: true },
//     type: {
//       type: String,
//       enum: [
//         "heading",
//         "paragraph",
//         "list",
//         "table",
//         "faq",
//         "divider",
//         "image",
//         "link",
//       ],
//       required: true,
//     },
//     data: { type: Schema.Types.Mixed },
//   },
//   { _id: false },
// );

// /* ---------- Main Blog Schema ---------- */

// const BlogSchema = new Schema(
//   {
//     slug: { type: String, required: true, unique: true },

//     status: {
//       type: String,
//       enum: ["draft", "published"],
//       default: "draft",
//     },

//     isDeleted: {
//       type: Boolean,
//       default: false,
//     },

//     featureImage: {
//       type: ImageSchema,
//       required: false,
//     },

//     featureImageUrl: {
//       type: String,
//       required: true,
//     },

//     meta: {
//       title: { type: String, required: true },
//       description: { type: String, required: true },
//       category: { type: String, required: true },
//       seoTitle: { type: String, required: true, maxlength: 75 },
//       seoDescription: { type: String, required: true, maxlength: 220 },
//       seoKeywords: { type: String, required: true, maxlength: 300 },
//     },

//     tags: {
//       type: [String],
//       default: [],
//     },

//     blocks: {
//       type: [BlockSchema],
//       required: true,
//     },
//   },
//   {
//     timestamps: true,
//   },
// );

// /* ---------- Export ---------- */

// const Blog = models.Blog || model("Blog", BlogSchema);

// export default Blog;

import mongoose, { Schema, models, model } from "mongoose";

/* ---------- Sub Schemas ---------- */

const ImageSchema = new Schema(
  {
    data: { type: String, required: true },
    mime: { type: String, required: true },
    size: { type: Number, required: true },
  },
  { _id: false },
);

const BlockSchema = new Schema(
  {
    id: { type: String, required: true },
    type: {
      type: String,
      enum: [
        "heading",
        "paragraph",
        "list",
        "table",
        "faq",
        "divider",
        "image",
        "link",
      ],
      required: true,
    },
    data: { type: Schema.Types.Mixed },
  },
  { _id: false },
);

/* ---------- Main Blog Schema ---------- */

const BlogSchema = new Schema(
  {
    slug: { type: String, required: true, unique: true },

    status: {
      type: String,
      enum: ["draft", "published"],
      default: "draft",
    },

    isDeleted: {
      type: Boolean,
      default: false,
    },

    featureImage: {
      type: ImageSchema,
      required: false,
    },

    featureImageUrl: {
      type: String,
      required: true,
    },

    meta: {
      title: { type: String, required: true },
      description: { type: String, required: true },
      category: { type: String, required: true },
      seoTitle: { type: String, required: true, maxlength: 75 },
      seoDescription: { type: String, required: true, maxlength: 220 },
      seoKeywords: { type: String, required: true, maxlength: 300 },
    },

    tags: {
      type: [String],
      default: [],
    },

    // TipTap JSON document
    content: {
      type: Schema.Types.Mixed,
      default: null,
    },

    blocks: {
      type: [BlockSchema],
      required: false,
    },
  },
  {
    timestamps: true,
  },
);

/* ---------- Export ---------- */

const Blog = models.Blog || model("Blog", BlogSchema);

export default Blog;
