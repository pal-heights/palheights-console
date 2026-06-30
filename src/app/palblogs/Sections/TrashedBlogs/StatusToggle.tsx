"use client";

import styles from "./TrashedBlogs.module.css";

interface StatusToggleProps {
  blogId: string;
  status: "draft" | "published";
  disabled?: boolean; // optional, but we will always disable it in TrashedBlogs
}

export default function StatusToggle({ status }: StatusToggleProps) {
  // Permanently display status, no toggling
  return (
    <button
      type="button"
      disabled
      className={
        status === "published" ? styles.statusPublished : styles.statusDraft
      }
      data-tooltip={
        status === "published" ? "Restore to update" : "Restore to update"
      }
    >
      {status === "published" ? "Published" : "Draft"}
    </button>
  );
}
