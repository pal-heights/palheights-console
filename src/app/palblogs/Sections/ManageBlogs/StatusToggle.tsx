"use client";

import { useState } from "react";
import styles from "./ManageBlogs.module.css";

interface StatusToggleProps {
  blogId: string;
  status: "draft" | "published";
  disabled?: boolean;
}

export default function StatusToggle({
  blogId,
  status,
  disabled,
}: StatusToggleProps) {
  const [currentStatus, setCurrentStatus] = useState(status);
  const [loading, setLoading] = useState(false);

  const toggleStatus = async () => {
    const nextStatus = currentStatus === "published" ? "draft" : "published";

    try {
      setLoading(true);

      const res = await fetch(`/api/blogs/${blogId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });

      if (!res.ok) {
        throw new Error("Failed to update status");
      }

      setCurrentStatus(nextStatus);
    } catch (error) {
      console.error(error);
      // toast can be added later
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={toggleStatus}
      disabled={loading || disabled}
      data-tooltip={
        disabled
          ? "Only admin can publish blogs"
          : currentStatus === "published"
            ? "Unpublish blog"
            : "Publish blog"
      }
      className={
        currentStatus === "published"
          ? styles.statusPublished
          : styles.statusDraft
      }
    >
      {loading
        ? "Updating…"
        : currentStatus === "published"
          ? "Published"
          : "Draft"}
    </button>
  );
}
