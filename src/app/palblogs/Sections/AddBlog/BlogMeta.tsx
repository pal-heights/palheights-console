"use client";

import { useState, useEffect } from "react";
import styles from "./BlogMeta.module.css";
import toast from "react-hot-toast";
import { FiX, FiChevronDown } from "react-icons/fi";
interface BlogMetaProps {
  title: string;
  slug: string;
  description: string;
  category: string;
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string;
  tags: string[];
  onTitleChange: (v: string) => void;
  onSlugChange: (v: string) => void;
  onDescriptionChange: (v: string) => void;
  onCategoryChange: (v: string) => void;
  onMetaTitleChange: (v: string) => void;
  onMetaDescriptionChange: (v: string) => void;
  onMetaKeywordsChange: (v: string) => void;
  onTagsChange: (v: string[]) => void;
}

export default function BlogMeta({
  title,
  slug,
  description,
  category,
  metaTitle,
  metaDescription,
  metaKeywords,
  tags,
  onTitleChange,
  onSlugChange,
  onDescriptionChange,
  onCategoryChange,
  onMetaTitleChange,
  onMetaDescriptionChange,
  onMetaKeywordsChange,
  onTagsChange,
}: BlogMetaProps) {
  const [tagInput, setTagInput] = useState("");
  const [keywordInput, setKeywordInput] = useState("");

  const [categories, setCategories] = useState<{ _id: string; name: string }[]>(
    [],
  );
  const [isFetchingCategories, setIsFetchingCategories] = useState(true);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleDeleteCategory = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await fetch("/api/blog-category/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        setCategories((prev) => prev.filter((cat) => cat._id !== id));
        if (category && categories.find(c => c._id === id)?.name === category) {
          onCategoryChange("");
        }
        toast.success("Category deleted");
      } else {
        const data = await res.json();
        toast.error(data.message || "Failed to delete category");
      }
    } catch (error) {
      console.error("Failed to delete category", error);
      toast.error("Failed to delete category");
    }
  };

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch("/api/blog-category");
        if (res.ok) {
          const data = await res.json();
          setCategories(data.categories || []);
        }
      } catch (error) {
        console.error("Failed to fetch categories", error);
      } finally {
        setIsFetchingCategories(false);
      }
    };
    fetchCategories();
  }, []);

  const handleAddCategory = async () => {
    if (!newCategoryName.trim() || isAddingCategory) return;

    try {
      setIsAddingCategory(true);
      const res = await fetch("/api/blog-category", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newCategoryName }),
      });

      const data = await res.json();

      if (res.ok) {
        setCategories((prev) =>
          [...prev, data.category].sort((a, b) => a.name.localeCompare(b.name)),
        );
        onCategoryChange(data.category.name);
        setNewCategoryName("");
        toast.success("Category added successfully");
      } else {
        toast.error(data.message || "Failed to add category");
      }
    } catch (error) {
      console.error("Failed to add category", error);
      toast.error("Failed to add category");
    } finally {
      setIsAddingCategory(false);
    }
  };

  const keywords = metaKeywords
    .split(",")
    .map((keyword) => keyword.trim())
    .filter(Boolean);

  const addTag = (value: string) => {
    const tag = value.trim().toLowerCase();
    if (!tag) return;
    if (tags.includes(tag)) return;
    if (tags.length >= 8) return;

    onTagsChange([...tags, tag]);
    setTagInput("");
  };

  const removeTag = (tag: string) => {
    onTagsChange(tags.filter((t) => t !== tag));
  };

  const addKeyword = (value: string) => {
    const keyword = value.trim().toLowerCase();
    if (!keyword) return;
    if (keywords.includes(keyword)) return;

    const nextKeywords = [...keywords, keyword];
    onMetaKeywordsChange(nextKeywords.join(", "));
    setKeywordInput("");
  };

  const removeKeyword = (keyword: string) => {
    const nextKeywords = keywords.filter((k) => k !== keyword);
    onMetaKeywordsChange(nextKeywords.join(", "));
  };

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "," || e.key === "Enter") {
      e.preventDefault();
      addTag(tagInput);
    }

    if (e.key === "Backspace" && !tagInput && tags.length) {
      removeTag(tags[tags.length - 1]);
    }
  };

  const handleKeywordKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "," || e.key === "Enter") {
      e.preventDefault();
      addKeyword(keywordInput);
    }

    if (e.key === "Backspace" && !keywordInput && keywords.length) {
      removeKeyword(keywords[keywords.length - 1]);
    }
  };

  const handleKeywordChange = (value: string) => {
    if (value.includes(",")) {
      const newKeywords = value
        .split(",")
        .map((keyword) => keyword.trim().toLowerCase())
        .filter(Boolean);

      const uniqueKeywords = Array.from(new Set([...keywords, ...newKeywords]));

      onMetaKeywordsChange(uniqueKeywords.join(", "));
      setKeywordInput("");
      return;
    }

    setKeywordInput(value);
  };

  return (
    <div className={styles.meta}>
      <div className={styles.blogWrapper}>
        {/* Blog Title */}
        <div className={styles.seoGroup}>
          <label className={styles.seoLabel} htmlFor="blogTitle">
            Blog Title
          </label>
          <input
            id="blogTitle"
            className={styles.title}
            type="text"
            placeholder="Enter blog title"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            maxLength={100}
            required
          />
          <div className={styles.counterRow}>
            <span className={styles.counterText}>{title.length}/100</span>
            {title.length > 100 ? (
              <span className={styles.errorText}>
                Blog title must be 100 characters or less.
              </span>
            ) : null}
          </div>
        </div>

        {/* Blog Short Description */}
        <div className={styles.seoGroup}>
          <label className={styles.seoLabel} htmlFor="blogDescription">
            Blog Short Description
          </label>
          <textarea
            id="blogDescription"
            className={styles.description}
            placeholder="Enter short description"
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            rows={3}
            maxLength={500}
          />
          <div className={styles.counterRow}>
            <span className={styles.counterText}>{description.length}/500</span>
            {description.length > 500 ? (
              <span className={styles.errorText}>
                Short description must be 500 characters or less.
              </span>
            ) : null}
          </div>
        </div>

        {/* Blog Category */}
        <div className={styles.seoGroup}>
          <label className={styles.seoLabel} htmlFor="blogCategory">
            Blog Category
          </label>
          <div className={styles.categoryContainer}>
            <div className={styles.customDropdown}>
              <button
                type="button"
                className={styles.dropdownButton}
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                disabled={isFetchingCategories}
              >
                {isFetchingCategories
                  ? "Loading categories..."
                  : categories.length === 0
                    ? "No categories available"
                    : category || "Select a category"}
                <FiChevronDown />
              </button>
              {isDropdownOpen && !isFetchingCategories && categories.length > 0 && (
                <div className={styles.dropdownList}>
                  {categories.map((cat) => (
                    <div
                      key={cat._id}
                      className={styles.dropdownItem}
                      onClick={() => {
                        onCategoryChange(cat.name);
                        setIsDropdownOpen(false);
                      }}
                    >
                      <span className={styles.dropdownItemText}>{cat.name}</span>
                      <button
                        type="button"
                        className={styles.deleteCategoryBtn}
                        onClick={(e) => handleDeleteCategory(cat._id, e)}
                        title="Delete category"
                      >
                        <FiX size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className={styles.addCategoryWrapper}>
              <input
                className={styles.newCategoryInput}
                type="text"
                placeholder="Enter new category"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                disabled={isAddingCategory}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddCategory();
                  }
                }}
              />
              <button
                type="button"
                className={styles.addCategoryBtn}
                onClick={handleAddCategory}
                disabled={isAddingCategory || !newCategoryName.trim()}
              >
                {isAddingCategory ? "Adding..." : "Add Category"}
              </button>
            </div>
          </div>
        </div>

        {/* Blog Tags */}
        <div className={styles.seoGroup}>
          <label className={styles.seoLabel}>Blog Tags</label>
          <div className={styles.tagsWrap}>
            {tags.map((tag) => (
              <span key={tag} className={styles.tag}>
                {tag}
                <button
                  type="button"
                  className={styles.removeTag}
                  onClick={() => removeTag(tag)}
                >
                  ×
                </button>
              </span>
            ))}

            <input
              className={styles.tagInput}
              type="text"
              placeholder="Enter blog tags"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagKeyDown}
              maxLength={30}
              required
            />
          </div>
        </div>
      </div>
      <div className={styles.metaWrapper}>
        {/* Meta Slug */}
        <div className={styles.seoGroup}>
          <label className={styles.seoLabel} htmlFor="slug">
            Slug
          </label>
          <input
            id="slug"
            className={styles.slug}
            type="text"
            placeholder="Enter slug"
            value={slug}
            onChange={(e) => onSlugChange(e.target.value)}
            required
          />
        </div>

        {/* Meta Title */}
        <div className={styles.seoGroup}>
          <label className={styles.seoLabel} htmlFor="metaTitle">
            Meta Title
          </label>
          <input
            id="metaTitle"
            className={styles.seoInput}
            type="text"
            placeholder="Enter meta title"
            value={metaTitle}
            onChange={(e) => onMetaTitleChange(e.target.value)}
            maxLength={75}
            required
          />
          <div className={styles.counterRow}>
            <span className={styles.counterText}>{metaTitle.length}/75</span>
            {metaTitle.length > 75 ? (
              <span className={styles.errorText}>
                Meta title must be 75 characters or less.
              </span>
            ) : null}
          </div>
        </div>

        {/* Meta Description */}
        <div className={styles.seoGroup}>
          <label className={styles.seoLabel} htmlFor="metaDescription">
            Meta Description
          </label>
          <textarea
            id="metaDescription"
            className={styles.seoTextarea}
            placeholder="Enter meta description"
            value={metaDescription}
            onChange={(e) => onMetaDescriptionChange(e.target.value)}
            rows={3}
            maxLength={220}
          />
          <div className={styles.counterRow}>
            <span className={styles.counterText}>
              {metaDescription.length}/220
            </span>
            {metaDescription.length > 220 ? (
              <span className={styles.errorText}>
                Meta description must be 220 characters or less.
              </span>
            ) : null}
          </div>
        </div>

        {/* Meta Keywords */}
        <div className={styles.seoGroup}>
          <label className={styles.seoLabel} htmlFor="metaKeywords">
            Meta Keywords
          </label>
          <input
            id="metaKeywords"
            className={styles.seoInput}
            type="text"
            placeholder="Enter meta keywords (comma separated)"
            value={keywordInput}
            onChange={(e) => handleKeywordChange(e.target.value)}
            onKeyDown={handleKeywordKeyDown}
            maxLength={300}
            required
          />

          <div className={styles.tagsWrap}>
            {keywords.map((keyword) => (
              <span key={keyword} className={styles.tag}>
                {keyword}
                <button
                  type="button"
                  className={styles.removeTag}
                  onClick={() => removeKeyword(keyword)}
                >
                  ×
                </button>
              </span>
            ))}
          </div>

          <div className={styles.counterRow}>
            <span className={styles.counterText}>
              {metaKeywords.length}/300
            </span>
            {metaKeywords.length > 300 ? (
              <span className={styles.errorText}>
                Meta keywords must be 300 characters or less.
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
