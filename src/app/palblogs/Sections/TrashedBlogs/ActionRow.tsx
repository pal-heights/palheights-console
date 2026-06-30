"use client";

import styles from "./TrashedBlogs.module.css";

interface ActionRowProps {
  selectedCount: number;
  onApplyBulk: () => void;

  search: string;
  onSearchChange: (v: string) => void;

  statusFilter: "all" | "published" | "draft";
  onStatusFilterChange: (v: "all" | "published" | "draft") => void;
}

export default function ActionRow({
  selectedCount,
  onApplyBulk,
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
}: ActionRowProps) {
  const disabled = selectedCount === 0;

  return (
    <div className={styles.actionRow}>
      {/* LEFT — Restore Selected */}
      <div className={styles.leftActions}>
        <button type="button" onClick={onApplyBulk} disabled={disabled}>
          Restore Selected
        </button>

        {selectedCount > 0 && (
          <span className={styles.selectedCount}>
            Selected: {selectedCount}
          </span>
        )}
      </div>

      {/* RIGHT — Search + Filter */}
      <div className={styles.rightControls}>
        <input
          type="text"
          placeholder="Search blogs…"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className={styles.search}
        />
        <span className={styles.statusText}>Status : </span>
        <select
          value={statusFilter}
          onChange={(e) =>
            onStatusFilterChange(
              e.target.value as "all" | "published" | "draft",
            )
          }
        >
          <option value="all">All</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
        </select>
      </div>
    </div>
  );
}
