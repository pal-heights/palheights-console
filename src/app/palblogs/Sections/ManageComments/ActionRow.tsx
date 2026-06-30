"use client";

import styles from "./ManageComments.module.css";

interface ActionRowProps {
  selectedCount: number;

  bulkAction: string;
  onBulkActionChange: (v: string) => void;
  onApplyBulk: () => void;

  search: string;
  onSearchChange: (v: string) => void;

  statusFilter: "all" | "active" | "deleted";
  onStatusFilterChange: (v: "all" | "active" | "deleted") => void;
}

export default function ActionRow({
  selectedCount,
  bulkAction,
  onBulkActionChange,
  onApplyBulk,
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
}: ActionRowProps) {
  const disabled = selectedCount === 0;

  return (
    <div className={styles.actionRow}>
      {/* LEFT — Bulk Actions */}
      <div className={styles.leftActions}>
        <select
          value={bulkAction}
          onChange={(e) => onBulkActionChange(e.target.value)}
          disabled={disabled}
        >
          <option value="">Bulk actions</option>
          <option value="delete">Delete</option>
          <option value="restore">Restore</option>
        </select>

        <button
          type="button"
          onClick={onApplyBulk}
          disabled={disabled || !bulkAction}
        >
          Apply
        </button>

        {selectedCount > 0 && (
          <span className={styles.selectedCount}>
            Selected: {selectedCount}
          </span>
        )}
      </div>

      {/* RIGHT — Search + Status Filter */}
      <div className={styles.rightControls}>
        <input
          type="text"
          placeholder="Search comments…"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className={styles.search}
        />

        <span className={styles.statusText}>Status :</span>

        <select
          value={statusFilter}
          onChange={(e) =>
            onStatusFilterChange(e.target.value as "all" | "active" | "deleted")
          }
        >
          <option value="all">All</option>
          <option value="active">Active</option>
          <option value="deleted">Deleted</option>
        </select>
      </div>
    </div>
  );
}
