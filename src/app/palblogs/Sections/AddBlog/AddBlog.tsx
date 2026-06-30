"use client";

import { useState, useRef } from "react";
import toast from "react-hot-toast";
import { Editor as TiptapEditor } from "@tiptap/react";

import FeatureImage from "./FeatureImage";
import BlogMeta from "./BlogMeta";
// import BlocksEditor from "./BlocksEditor";
import Editor from "./Editor";
import Info from "../../../Components/Info";

import styles from "./AddBlog.module.css";

/* ---------- Types ---------- */

export type BlockType =
  | "heading"
  | "paragraph"
  | "list"
  | "table"
  | "faq"
  | "divider"
  | "image"
  | "link";

export interface Block {
  id: string;
  type?: BlockType;
  data?: any;
}

/* ---------- Toast Styles ---------- */

const errorToast = {
  style: {
    background: "#7f1d1d",
    color: "#fff",
    borderRadius: "8px",
    fontSize: "14px",
  },
};

const successToast = {
  style: {
    background: "#14532d",
    color: "#fff",
    borderRadius: "8px",
    fontSize: "14px",
  },
};

/* ---------- Helpers ---------- */

const fileToBase64 = (file: File) =>
  new Promise<{ data: string; mime: string; size: number }>(
    (resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve({
          data: result.split(",")[1],
          mime: file.type,
          size: file.size,
        });
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    },
  );

/* ---------- Validation ---------- */

function validateBlock(block: Block): string | null {
  if (!block.type) return "Block type is missing";

  const d = block.data;

  switch (block.type) {
    case "heading":
      if (!d?.text?.trim()) return "Heading text is required";
      return null;

    case "paragraph":
      if (!d?.text?.trim()) return "Paragraph text is required";
      return null;

    case "list":
      if (!d?.items?.length) return "List must have items";
      if (d.items.some((i: string) => !i.trim()))
        return "List items cannot be empty";
      return null;

    case "table":
      if (!d?.rows?.length) return "Table must have rows";
      if (d.rows.some((r: string[]) => r.some((c) => !c.trim())))
        return "Table cells cannot be empty";
      return null;

    case "faq":
      if (!d?.title?.trim()) return "FAQ heading is required";
      if (!d?.description?.trim()) return "FAQ description is required";
      if (!d?.items?.length) return "FAQ must have at least one Q&A";
      if (d.items.some((i: any) => !i.q?.trim() || !i.a?.trim()))
        return "All FAQ questions and answers are required";
      return null;

    case "image":
      if (!d?.imageUrl?.trim()) return "Image URL is required";
      return null;

    case "link":
      if (!d?.text?.trim()) return "Link text is required";
      if (!d?.url?.trim()) return "Link URL is required";
      return null;

    case "divider":
      return null;

    default:
      return "Unknown block type";
  }
}

/* ---------- Component ---------- */

export default function AddBlog() {
  const [featureImageUrl, setFeatureImageUrl] = useState("");
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(false);
  const [description, setDescription] = useState("");
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [metaKeywords, setMetaKeywords] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [category, setCategory] = useState("");
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [saving, setSaving] = useState(false);
  const [editorHasContent, setEditorHasContent] = useState(false);

  const isFormValid =
    featureImageUrl.trim() !== "" &&
    title.trim() !== "" &&
    slug.trim() !== "" &&
    description.trim() !== "" &&
    metaTitle.trim() !== "" &&
    metaDescription.trim() !== "" &&
    metaKeywords.trim() !== "" &&
    tags.length > 0 &&
    category.trim() !== "" &&
    editorHasContent;

  // Ref to access the TipTap editor instance from Editor.tsx
  const editorRef = useRef<TiptapEditor | null>(null);

  const slugify = (text: string) =>
    text
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/[\s_]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-+|-+$/g, "");

  const handleTitleChange = (value: string) => {
    setTitle(value);
    if (!isSlugManuallyEdited) {
      setSlug(slugify(value));
    }
  };

  const handleSlugChange = (value: string) => {
    setSlug(slugify(value));
    setIsSlugManuallyEdited(true);
  };

  const handleSave = async () => {
    if (saving) return;

    /* Blog-level validation */
    if (!featureImageUrl.trim()) {
      toast.error("Feature image URL is required", errorToast);
      return;
    }
    if (!title.trim()) {
      toast.error("Blog title is required", errorToast);
      return;
    }
    if (!slug.trim()) {
      toast.error("Slug is required", errorToast);
      return;
    }
    if (!description.trim()) {
      toast.error("Blog description is required", errorToast);
      return;
    }
    if (!metaTitle.trim()) {
      toast.error("Meta title is required", errorToast);
      return;
    }
    if (metaTitle.length > 75) {
      toast.error("Meta title cannot exceed 75 characters", errorToast);
      return;
    }
    if (!metaDescription.trim()) {
      toast.error("Meta description is required", errorToast);
      return;
    }
    if (metaDescription.length > 220) {
      toast.error("Meta description cannot exceed 220 characters", errorToast);
      return;
    }
    if (!metaKeywords.trim()) {
      toast.error("Meta keywords are required", errorToast);
      return;
    }
    if (metaKeywords.length > 300) {
      toast.error("Meta keywords cannot exceed 300 characters", errorToast);
      return;
    }
    if (!tags.length) {
      toast.error("At least one tag is required", errorToast);
      return;
    }
    if (!category.trim()) {
      toast.error("Category is required", errorToast);
      return;
    }

    // Validate editor content
    const editorInstance = editorRef.current;
    if (!editorInstance) {
      toast.error("Editor not ready", errorToast);
      return;
    }

    const editorJson = editorInstance.getJSON();
    const isEmpty =
      !editorJson.content ||
      editorJson.content.length === 0 ||
      (editorJson.content.length === 1 &&
        editorJson.content[0].type === "paragraph" &&
        !editorJson.content[0].content);

    if (isEmpty) {
      toast.error("Blog content cannot be empty", errorToast);
      return;
    }

    // if (!blocks.length) {
    //   toast.error("At least one content block is required", errorToast);
    //   return;
    // }

    // for (let i = 0; i < blocks.length; i++) {
    //   const error = validateBlock(blocks[i]);
    //   if (error) {
    //     toast.error(`Block ${i + 1}: ${error}`, errorToast);
    //     return;
    //   }
    // }

    try {
      setSaving(true);
      toast.loading("Saving blog…");

      const res = await fetch("/api/blogs/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          featureImageUrl,
          meta: {
            title,
            description,
            category,
            seoTitle: metaTitle,
            seoDescription: metaDescription,
            seoKeywords: metaKeywords,
          },
          tags,
          content: editorJson, // TipTap JSON
          blocks,
        }),
      });

      toast.dismiss();

      if (!res.ok) {
        throw new Error("Failed to save blog");
      }

      toast.success("Blog saved successfully", successToast);

      // Reset all fields
      setFeatureImageUrl("");
      setTitle("");
      setSlug("");
      setIsSlugManuallyEdited(false);
      setDescription("");
      setMetaTitle("");
      setMetaDescription("");
      setMetaKeywords("");
      setCategory("");
      setTags([]);
      setBlocks([]);
      editorInstance.commands.clearContent();
    } catch (err) {
      toast.dismiss();
      toast.error("Something went wrong while saving", errorToast);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.leadsHeader}>
        <div className={styles.headerContent}>
          <div>
            <h2>Add New Blog</h2>
            <p>Add a new well structured blog to your website here</p>
          </div>
          <Info
            instructions={[
              [
                { text: "Use only " },
                { text: "Direct Cloudflare Links", highlight: true },
                { text: " for all images and media assets." },
              ],
              [
                { text: "To keep blog optimized " },
                { text: "use below 500 kb size", highlight: true },
                { text: " images." },
              ],
              [
                { text: "Feature Image should use a " },
                { text: "4:3/16:9 Aspect Ratio", highlight: true },
                { text: "." },
              ],
              [
                { text: "Images inside the blog content can use " },
                { text: "any aspect ratio", highlight: true },
                { text: "." },
              ],
              [
                { text: "Separate " },
                { text: "Tags", highlight: true },
                { text: " with commas (" },
                { text: "tag1, tag2, tag3", highlight: true },
                { text: ")." },
              ],
              [
                { text: "Separate " },
                { text: "Keywords", highlight: true },
                { text: " with commas (" },
                { text: "keyword1, keyword2", highlight: true },
                { text: ")." },
              ],
              [
                { text: "The blog can only be saved after " },
                { text: "all required fields are filled", highlight: true },
                { text: "." },
              ],
            ]}
          />
        </div>
      </div>

      <FeatureImage
        urlValue={featureImageUrl}
        onUrlChange={setFeatureImageUrl}
      />

      <BlogMeta
        title={title}
        slug={slug}
        description={description}
        category={category}
        metaTitle={metaTitle}
        metaDescription={metaDescription}
        metaKeywords={metaKeywords}
        tags={tags}
        onTitleChange={handleTitleChange}
        onSlugChange={handleSlugChange}
        onDescriptionChange={setDescription}
        onCategoryChange={setCategory}
        onMetaTitleChange={setMetaTitle}
        onMetaDescriptionChange={setMetaDescription}
        onMetaKeywordsChange={setMetaKeywords}
        onTagsChange={setTags}
      />

      {/* Pass editorRef so we can call getJSON() on save */}
      <Editor editorRef={editorRef} onUpdate={setEditorHasContent} />

      {/* <BlocksEditor blocks={blocks} onChange={setBlocks} /> */}

      <div className={styles.actions}>
        <button
          className={styles.saveBtn}
          onClick={handleSave}
          disabled={saving || !isFormValid}
        >
          {saving ? "Saving…" : "Save Blog"}
        </button>
      </div>
    </div>
  );
}
