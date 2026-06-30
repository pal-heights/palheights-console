"use client";

import styles from "./TrashedComments.module.css";

export type DateSort = "desc" | "asc";

interface ActionRowProps {
  selectedCount: number;

  onRestoreSelected: () => void;
  onPermaDeleteSelected: () => void;

  search: string;
  onSearchChange: (v: string) => void;

  dateSort: DateSort;
  onDateSortChange: (v: DateSort) => void;
}

export default function ActionRow({
  selectedCount,
  onRestoreSelected,
  onPermaDeleteSelected,
  search,
  onSearchChange,
  dateSort,
  onDateSortChange,
}: ActionRowProps) {
  const disabled = selectedCount <= 1;

  return (
    <div className={styles.actionRow}>
      {/* LEFT — Restore */}
      <div className={styles.leftActions}>
        <button
          type="button"
          className={styles.restoreBtn}
          onClick={onRestoreSelected}
          disabled={disabled}
        >
          Restore Selected
        </button>
        <button
          type="button"
          className={styles.restoreBtn}
          onClick={onPermaDeleteSelected}
          disabled={disabled}
        >
          Delete Permanently
        </button>

        {selectedCount > 0 && (
          <span className={styles.selectedCount}>
            Selected: {selectedCount}
          </span>
        )}
      </div>

      {/* RIGHT — Search + Date Sort */}
      <div className={styles.rightControls}>
        <input
          type="text"
          placeholder="Search comments…"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className={styles.search}
        />

        <span className={styles.statusText}>Sort by date:</span>

        <select
          value={dateSort}
          onChange={(e) => onDateSortChange(e.target.value as DateSort)}
        >
          <option value="desc">Newest first</option>
          <option value="asc">Oldest first</option>
        </select>
      </div>
    </div>
  );
}
