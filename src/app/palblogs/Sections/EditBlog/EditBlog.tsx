"use client";

import { useState, useRef, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Editor as TiptapEditor } from "@tiptap/react";
import Lottie from "lottie-react";
import loadingAnimation from "../../../../../public/loading.json";

import FeatureImage from "./FeatureImage";
import BlogMeta from "./BlogMeta";
import Editor from "./Editor";
import Info from "../../../Components/Info";

import styles from "./EditBlog.module.css";

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

/* ---------- Component ---------- */

export default function EditBlog() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  /* ---- Form state ---- */
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

  /* ---- Loading / saving state ---- */
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  /**
   * Which editor mode is this blog using?
   * "tiptap"  → blog was created with TipTap (has `content`)
   * "blocks"  → blog was created with the old block editor (has `blocks`)
   */
  const [editorMode, setEditorMode] = useState<"tiptap" | "blocks">("tiptap");

  /**
   * Initial TipTap JSON to seed the editor with.
   * We keep it separate so we can pass it to <Editor> once the fetch resolves.
   */
  const [initialContent, setInitialContent] = useState<any>(null);

  /* ---- Edit state ---- */
  const [isEdited, setIsEdited] = useState(false);
  const [showDiscardWarning, setShowDiscardWarning] = useState(false);
  const [pendingNav, setPendingNav] = useState<(() => void) | null>(null);

  const markEdited = () => setIsEdited(true);

  /* ---- Ref to TipTap editor instance ---- */
  const editorRef = useRef<TiptapEditor | null>(null);

  /* ---- Slugify helper ---- */
  const slugify = (text: string) =>
    text
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/[\s_]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-+|-+$/g, "");

  /* ---- Fetch existing blog data ---- */
  useEffect(() => {
    if (!id) return;

    const fetchBlog = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/blogs/${id}`);

        if (!res.ok) {
          toast.error("Failed to load blog", errorToast);
          router.push("/palblogs");
          return;
        }

        const blog = await res.json();

        /* Pre-fill all meta fields */
        setFeatureImageUrl(blog.featureImageUrl ?? "");
        setTitle(blog.meta?.title ?? "");
        setSlug(blog.slug ?? "");
        setDescription(blog.meta?.description ?? "");
        setMetaTitle(blog.meta?.seoTitle ?? "");
        setMetaDescription(blog.meta?.seoDescription ?? "");
        setMetaKeywords(blog.meta?.seoKeywords ?? "");
        setTags(blog.tags ?? []);
        setCategory(blog.meta?.category ?? "");

        /*
         * Determine which editor to use:
         * - If `content` is a non-null TipTap JSON object → TipTap mode
         * - Otherwise fall back to blocks mode
         */
        if (blog.content && typeof blog.content === "object") {
          setEditorMode("tiptap");
          setInitialContent(blog.content);
        } else if (blog.blocks?.length) {
          setEditorMode("blocks");
          setBlocks(blog.blocks);
        } else {
          // Empty new-style blog — default to TipTap
          setEditorMode("tiptap");
        }
      } catch (err) {
        toast.error("Something went wrong loading the blog", errorToast);
      } finally {
        setLoading(false);
      }
    };

    fetchBlog();
  }, [id, router]);

  /* ---- Title → auto-slug (only if user hasn't manually edited slug) ---- */
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

  /* ---- Event listeners for preventing data loss ---- */
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isEdited) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isEdited]);

  useEffect(() => {
    const handleLeftPanelNav = (e: any) => {
      if (isEdited) {
        setPendingNav(() => () => router.push("/palblogs"));
        setShowDiscardWarning(true);
      } else {
        router.push("/palblogs");
      }
    };
    window.addEventListener("left-panel-navigate", handleLeftPanelNav);
    return () =>
      window.removeEventListener("left-panel-navigate", handleLeftPanelNav);
  }, [isEdited, router]);

  /* ---- Save / update ---- */
  const handleSave = async () => {
    if (saving) return;

    /* Validation */
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

    /* Content validation — TipTap mode only */
    let editorJson: any = null;
    if (editorMode === "tiptap") {
      const editorInstance = editorRef.current;
      if (!editorInstance) {
        toast.error("Editor not ready", errorToast);
        return;
      }

      editorJson = editorInstance.getJSON();
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
    }

    try {
      setSaving(true);
      toast.loading("Updating blog…");

      const res = await fetch("/api/blogs/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
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
          // Send whichever format this blog uses; the other stays null / []
          content: editorMode === "tiptap" ? editorJson : null,
          blocks: editorMode === "blocks" ? blocks : [],
        }),
      });

      toast.dismiss();

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message ?? "Failed to update blog");
      }

      toast.success("Blog updated successfully", successToast);
      setIsEdited(false);
      router.push("/palblogs");
    } catch (err: any) {
      toast.dismiss();
      toast.error(
        err.message ?? "Something went wrong while updating",
        errorToast,
      );
    } finally {
      setSaving(false);
    }
  };

  /* ---- Loading skeleton ---- */
  if (loading) {
    return (
      <div className={styles.state}>
        <Lottie
          animationData={loadingAnimation}
          loop
          autoplay
          style={{ width: 100, height: 100 }}
          rendererSettings={{ preserveAspectRatio: "xMidYMid slice" }}
        />
        <span>Loading blog data…</span>
      </div>
    );
  }

  /* ---- Navigation handlers ---- */
  const handleCancel = () => {
    if (isEdited) {
      setPendingNav(() => () => router.push("/palblogs"));
      setShowDiscardWarning(true);
    } else {
      router.push("/palblogs");
    }
  };

  const handleDiscard = () => {
    setShowDiscardWarning(false);
    setIsEdited(false);
    if (pendingNav) {
      pendingNav();
    } else {
      router.push("/palblogs");
    }
  };

  /* ---- Render ---- */
  return (
    <div className={styles.container}>
      <div className={styles.leadsHeader}>
        <div>
          <h2>Edit Blog</h2>
          <p>Update and republish your blog post</p>
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

      {/* Show a banner when this blog was made with the old block editor */}
      {editorMode === "blocks" && (
        <div className={styles.legacyBanner}>
          <strong>Legacy block editor content</strong> — this blog was created
          with the old block editor. Block-based content is shown below. Editing
          block-by-block is not yet supported in this view; only the meta fields
          can be updated.
        </div>
      )}

      <FeatureImage
        urlValue={featureImageUrl}
        onUrlChange={(v) => {
          setFeatureImageUrl(v);
          markEdited();
        }}
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
        onTitleChange={(v) => {
          handleTitleChange(v);
          markEdited();
        }}
        onSlugChange={(v) => {
          handleSlugChange(v);
          markEdited();
        }}
        onDescriptionChange={(v) => {
          setDescription(v);
          markEdited();
        }}
        onCategoryChange={(v) => {
          setCategory(v);
          markEdited();
        }}
        onMetaTitleChange={(v) => {
          setMetaTitle(v);
          markEdited();
        }}
        onMetaDescriptionChange={(v) => {
          setMetaDescription(v);
          markEdited();
        }}
        onMetaKeywordsChange={(v) => {
          setMetaKeywords(v);
          markEdited();
        }}
        onTagsChange={(v) => {
          setTags(v);
          markEdited();
        }}
      />

      {/* Only render TipTap editor for tiptap-mode blogs */}
      {editorMode === "tiptap" && (
        <Editor
          editorRef={editorRef}
          initialContent={initialContent}
          onUpdate={markEdited}
        />
      )}

      <div className={styles.actions}>
        <button
          className={styles.cancelBtn}
          onClick={handleCancel}
          disabled={saving}
        >
          Cancel
        </button>
        <button
          className={styles.saveBtn}
          onClick={handleSave}
          disabled={saving || !isEdited}
        >
          {saving ? "Updating…" : "Update Blog"}
        </button>
      </div>

      {showDiscardWarning && (
        <div className={styles.warningModalBackdrop}>
          <div className={styles.warningModal}>
            <h3>Unsaved Changes!</h3>
            <p className={styles.warningMessage}>
              You have unsaved changes. Do you want to update the blog or
              discard them?
            </p>
            <div className={styles.warningActions}>
              <div className={styles.warningActionsLeft}>
                <button
                  className={styles.updateWarningBtn}
                  onClick={() => {
                    setShowDiscardWarning(false);
                    handleSave();
                  }}
                >
                  Update
                </button>

                <button
                  className={styles.discardWarningBtn}
                  onClick={handleDiscard}
                >
                  Discard
                </button>
              </div>
              <button
                className={styles.cancelWarningBtn}
                onClick={() => setShowDiscardWarning(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
