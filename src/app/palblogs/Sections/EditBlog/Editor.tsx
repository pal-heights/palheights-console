"use client";

import { useState, useRef, useEffect, MutableRefObject } from "react";
import toast from "react-hot-toast";
import { Editor as TiptapEditor } from "@tiptap/react";

import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";
import CharacterCount from "@tiptap/extension-character-count";
import Highlight from "@tiptap/extension-highlight";
import Subscript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";

import {
  FaArrowRotateLeft,
  FaArrowRotateRight,
  FaBold,
  FaItalic,
  FaUnderline,
  FaStrikethrough,
  FaListUl,
  FaListOl,
  FaQuoteLeft,
  FaCode,
  FaAlignLeft,
  FaAlignCenter,
  FaAlignRight,
  FaAlignJustify,
  FaLink,
  FaLinkSlash,
  FaImage,
  FaHighlighter,
  FaSubscript,
  FaSuperscript,
  FaMinus,
  FaChevronDown,
  FaCheck,
  FaXmark,
} from "react-icons/fa6";
import {
  LuHeading1,
  LuHeading2,
  LuHeading3,
  LuHeading4,
  LuPilcrow,
  LuCode,
} from "react-icons/lu";

import styles from "./Editor.module.css";

// ─── Custom Dropdown ──────────────────────────────────────────────────────────

interface DropdownItem {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

interface DropdownProps {
  items: DropdownItem[];
  value: string;
  onChange: (value: string) => void;
  triggerIcon?: React.ReactNode;
  title?: string;
}

function Dropdown({
  items,
  value,
  onChange,
  triggerIcon,
  title,
}: DropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = items.find((i) => i.value === value);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className={styles.dropdown} ref={ref} title={title}>
      <button
        type="button"
        className={`${styles.dropdownTrigger} ${open ? styles.dropdownOpen : ""}`}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className={styles.dropdownIcon}>
          {triggerIcon ?? current?.icon}
        </span>
        <span className={styles.dropdownLabel}>{current?.label}</span>
        <FaChevronDown
          className={`${styles.dropdownChevron} ${open ? styles.chevronUp : ""}`}
        />
      </button>

      {open && (
        <div className={styles.dropdownMenu} role="listbox">
          {items.map((item) => (
            <button
              key={item.value}
              type="button"
              role="option"
              aria-selected={item.value === value}
              className={`${styles.dropdownItem} ${item.value === value ? styles.dropdownItemActive : ""}`}
              onClick={() => {
                onChange(item.value);
                setOpen(false);
              }}
            >
              {item.icon && (
                <span className={styles.dropdownItemIcon}>{item.icon}</span>
              )}
              <span>{item.label}</span>
              {item.value === value && (
                <FaCheck className={styles.dropdownItemCheck} />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Icon Button ──────────────────────────────────────────────────────────────

interface IconBtnProps {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
  btnRef?: React.RefObject<HTMLButtonElement>;
}

function IconBtn({
  onClick,
  active,
  disabled,
  title,
  children,
  btnRef,
}: IconBtnProps) {
  return (
    <button
      ref={btnRef}
      type="button"
      className={`${styles.iconButton} ${active ? styles.active : ""}`}
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-pressed={active}
    >
      {children}
    </button>
  );
}

// ─── Link Popover ─────────────────────────────────────────────────────────────

interface LinkPopoverProps {
  isActive: boolean;
  currentUrl: string;
  onConfirm: (url: string) => void;
  onRemove: () => void;
  onClose: () => void;
}

function LinkPopover({
  isActive,
  currentUrl,
  onConfirm,
  onRemove,
  onClose,
}: LinkPopoverProps) {
  const [value, setValue] = useState(currentUrl || "https://");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setValue(currentUrl || "https://");
    setTimeout(() => inputRef.current?.focus(), 50);
  }, [currentUrl]);

  // Close on outside click
  const wrapRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    // slight delay so the button click that opened it doesn't immediately close it
    const t = setTimeout(
      () => document.addEventListener("mousedown", handler),
      10,
    );
    return () => {
      clearTimeout(t);
      document.removeEventListener("mousedown", handler);
    };
  }, [onClose]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      onConfirm(value);
    }
    if (e.key === "Escape") onClose();
  };

  return (
    <div className={styles.popover} ref={wrapRef}>
      <div className={styles.popoverRow}>
        <input
          ref={inputRef}
          className={styles.popoverInput}
          type="url"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="https://example.com"
          spellCheck={false}
        />
        <button
          type="button"
          className={styles.popoverConfirm}
          onClick={() => onConfirm(value)}
          title="Apply link"
        >
          <FaCheck />
        </button>
        {isActive && (
          <button
            type="button"
            className={styles.popoverRemove}
            onClick={onRemove}
            title="Remove link"
          >
            <FaLinkSlash />
          </button>
        )}
        <button
          type="button"
          className={styles.popoverClose}
          onClick={onClose}
          title="Cancel"
        >
          <FaXmark />
        </button>
      </div>
    </div>
  );
}

// ─── Image Modal ──────────────────────────────────────────────────────────────

interface ImageModalProps {
  onConfirm: (url: string, alt: string) => void;
  onClose: () => void;
}

function ImageModal({ onConfirm, onClose }: ImageModalProps) {
  const [url, setUrl] = useState("");
  const [alt, setAlt] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Lock body scroll while modal is open
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  const handleSubmit = () => {
    const trimmedUrl = url.trim();
    if (!trimmedUrl) return;
    if (
      !trimmedUrl.startsWith(
        "https://pub-df2be1f0ac924e4f81cce390b6cc6cee.r2.dev/",
      )
    ) {
      toast.error(
        "Only Cloudflare images are allowed. Please use a Cloudflare image.",
        {
          style: {
            background: "#7f1d1d",
            color: "#fff",
            borderRadius: "8px",
            fontSize: "14px",
          },
        },
      );
      return;
    }
    onConfirm(trimmedUrl, alt.trim());
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
    if (e.key === "Escape") onClose();
  };

  return (
    <div className={styles.modalBackdrop} onMouseDown={onClose}>
      <div className={styles.modal} onMouseDown={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <span className={styles.modalTitle}>Insert Image</span>
          <button
            type="button"
            className={styles.modalCloseBtn}
            onClick={onClose}
            title="Close"
          >
            <FaXmark />
          </button>
        </div>

        <div className={styles.modalBody}>
          <label className={styles.modalLabel}>
            Image URL <span className={styles.modalRequired}>*</span>
          </label>
          <input
            ref={inputRef}
            className={styles.modalInput}
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="https://example.com/image.jpg"
            spellCheck={false}
          />

          <label className={styles.modalLabel}>
            Alt text <span className={styles.modalOptional}>(optional)</span>
          </label>
          <input
            className={styles.modalInput}
            type="text"
            value={alt}
            onChange={(e) => setAlt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe the image"
          />
        </div>

        <div className={styles.modalFooter}>
          <button
            type="button"
            className={styles.modalCancel}
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className={styles.modalConfirm}
            onClick={handleSubmit}
            disabled={!url.trim()}
          >
            Insert Image
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Static data ──────────────────────────────────────────────────────────────

const headingItems: DropdownItem[] = [
  { value: "paragraph", label: "Paragraph", icon: <LuPilcrow /> },
  { value: "h1", label: "Heading 1", icon: <LuHeading1 /> },
  { value: "h2", label: "Heading 2", icon: <LuHeading2 /> },
  { value: "h3", label: "Heading 3", icon: <LuHeading3 /> },
  { value: "h4", label: "Heading 4", icon: <LuHeading4 /> },
];

const alignItems: DropdownItem[] = [
  { value: "left", label: "Align Left", icon: <FaAlignLeft /> },
  { value: "center", label: "Align Center", icon: <FaAlignCenter /> },
  { value: "right", label: "Align Right", icon: <FaAlignRight /> },
  { value: "justify", label: "Justify", icon: <FaAlignJustify /> },
];

// ─── Editor ───────────────────────────────────────────────────────────────────

interface EditorProps {
  editorRef?: MutableRefObject<import("@tiptap/react").Editor | null>;
  initialContent?: any;
  onUpdate?: () => void;
}

export default function Editor({
  editorRef,
  initialContent,
  onUpdate,
}: EditorProps) {
  const [heading, setHeading] = useState("paragraph");
  const [alignment, setAlignment] = useState("left");
  const [linkOpen, setLinkOpen] = useState(false);
  const [imageOpen, setImageOpen] = useState(false);
  const [words, setWords] = useState(0);
  const [chars, setChars] = useState(0);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3, 4] } }),
      Underline,
      Highlight,
      Subscript.extend({ excludes: "superscript" }),
      Superscript.extend({ excludes: "subscript" }),
      CharacterCount,
      Link.configure({ openOnClick: false, autolink: true, linkOnPaste: true }),
      Image,
      Placeholder.configure({ placeholder: "Start writing your blog…" }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: initialContent ?? "<p></p>",
    onCreate({ editor }) {
      setWords(editor.storage.characterCount?.words() ?? 0);
      setChars(editor.storage.characterCount?.characters() ?? 0);
    },
    onUpdate({ editor }) {
      syncToolbar(editor);
      setWords(editor.storage.characterCount?.words() ?? 0);
      setChars(editor.storage.characterCount?.characters() ?? 0);
      onUpdate?.();
    },
    onSelectionUpdate({ editor }) {
      syncToolbar(editor);
    },
  });

  // Expose editor instance to parent via ref
  if (editorRef) editorRef.current = editor ?? null;

  if (!editor) return null;

  function syncToolbar(ed = editor) {
    if (ed.isActive("heading", { level: 1 })) setHeading("h1");
    else if (ed.isActive("heading", { level: 2 })) setHeading("h2");
    else if (ed.isActive("heading", { level: 3 })) setHeading("h3");
    else if (ed.isActive("heading", { level: 4 })) setHeading("h4");
    else setHeading("paragraph");

    if (ed.isActive({ textAlign: "center" })) setAlignment("center");
    else if (ed.isActive({ textAlign: "right" })) setAlignment("right");
    else if (ed.isActive({ textAlign: "justify" })) setAlignment("justify");
    else setAlignment("left");
  }

  const handleHeading = (value: string) => {
    setHeading(value);
    const chain = editor.chain().focus();
    if (value === "paragraph") {
      chain.setParagraph().run();
      return;
    }
    chain
      .toggleHeading({ level: Number(value.replace("h", "")) as 1 | 2 | 3 | 4 })
      .run();
  };

  const handleAlignment = (value: string) => {
    setAlignment(value);
    editor.chain().focus().setTextAlign(value).run();
  };

  const handleLinkConfirm = (url: string) => {
    if (!url || url === "https://") {
      editor.chain().focus().unsetLink().run();
    } else {
      editor
        .chain()
        .focus()
        .extendMarkRange("link")
        .setLink({ href: url })
        .run();
    }
    setLinkOpen(false);
  };

  const handleLinkRemove = () => {
    editor.chain().focus().unsetLink().run();
    setLinkOpen(false);
  };

  const handleImageConfirm = (url: string, alt: string) => {
    editor.chain().focus().setImage({ src: url, alt }).run();
    setImageOpen(false);
  };

  const currentLinkUrl = editor.getAttributes("link").href ?? "";

  return (
    <div className={styles.wrapper}>
      {/* ── Toolbar ── */}
      <div
        className={styles.toolbar}
        role="toolbar"
        aria-label="Text formatting"
      >
        <IconBtn
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          title="Undo (Ctrl+Z)"
        >
          <FaArrowRotateLeft />
        </IconBtn>
        <IconBtn
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          title="Redo (Ctrl+Y)"
        >
          <FaArrowRotateRight />
        </IconBtn>

        <Dropdown
          items={headingItems}
          value={heading}
          onChange={handleHeading}
          title="Block type"
        />

        <IconBtn
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive("bold")}
          title="Bold (Ctrl+B)"
        >
          <FaBold />
        </IconBtn>
        <IconBtn
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive("italic")}
          title="Italic (Ctrl+I)"
        >
          <FaItalic />
        </IconBtn>
        <IconBtn
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          active={editor.isActive("underline")}
          title="Underline (Ctrl+U)"
        >
          <FaUnderline />
        </IconBtn>
        <IconBtn
          onClick={() => editor.chain().focus().toggleStrike().run()}
          active={editor.isActive("strike")}
          title="Strikethrough"
        >
          <FaStrikethrough />
        </IconBtn>
        <IconBtn
          onClick={() => editor.chain().focus().toggleHighlight().run()}
          active={editor.isActive("highlight")}
          title="Highlight"
        >
          <FaHighlighter />
        </IconBtn>

        <IconBtn
          onClick={() => editor.chain().focus().toggleSubscript().run()}
          active={editor.isActive("subscript")}
          title="Subscript"
        >
          <FaSubscript />
        </IconBtn>
        <IconBtn
          onClick={() => editor.chain().focus().toggleSuperscript().run()}
          active={editor.isActive("superscript")}
          title="Superscript"
        >
          <FaSuperscript />
        </IconBtn>

        <IconBtn
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive("bulletList")}
          title="Bullet list"
        >
          <FaListUl />
        </IconBtn>
        <IconBtn
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive("orderedList")}
          title="Numbered list"
        >
          <FaListOl />
        </IconBtn>

        <IconBtn
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          active={editor.isActive("blockquote")}
          title="Block quote"
        >
          <FaQuoteLeft />
        </IconBtn>
        <IconBtn
          onClick={() => editor.chain().focus().toggleCode().run()}
          active={editor.isActive("code")}
          title="Inline code"
        >
          <FaCode />
        </IconBtn>
        <IconBtn
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          active={editor.isActive("codeBlock")}
          title="Code block"
        >
          <LuCode />
        </IconBtn>
        <IconBtn
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          title="Horizontal rule"
        >
          <FaMinus />
        </IconBtn>

        <Dropdown
          items={alignItems}
          value={alignment}
          onChange={handleAlignment}
          triggerIcon={alignItems.find((a) => a.value === alignment)?.icon}
          title="Text alignment"
        />

        {/* Link — popover anchor */}
        <div className={styles.popoverAnchor}>
          <IconBtn
            onClick={() => setLinkOpen((v) => !v)}
            active={editor.isActive("link") || linkOpen}
            title={editor.isActive("link") ? "Edit link" : "Insert link"}
          >
            <FaLink />
          </IconBtn>

          {linkOpen && (
            <LinkPopover
              isActive={editor.isActive("link")}
              currentUrl={currentLinkUrl}
              onConfirm={handleLinkConfirm}
              onRemove={handleLinkRemove}
              onClose={() => setLinkOpen(false)}
            />
          )}
        </div>

        <IconBtn onClick={() => setImageOpen(true)} title="Insert image">
          <FaImage />
        </IconBtn>
      </div>

      {/* ── Editor ── */}
      <div className={styles.editorScroll}>
        <div className={styles.editor} onClick={() => editor.commands.focus()}>
          <EditorContent editor={editor} />
        </div>
      </div>

      {/* ── Status bar ── */}
      <div className={styles.statusBar}>
        <span>
          {words} {words === 1 ? "word" : "words"}
        </span>
        <span>
          {chars} {chars === 1 ? "character" : "characters"}
        </span>
      </div>

      {/* ── Image Modal ── */}
      {imageOpen && (
        <ImageModal
          onConfirm={handleImageConfirm}
          onClose={() => setImageOpen(false)}
        />
      )}
    </div>
  );
}
