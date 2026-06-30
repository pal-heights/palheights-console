"use client";

import styles from "./TrashedBlogs.module.css";

interface ConfirmRestoreModalProps {
  count: number;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmRestoreModal({
  count,
  onConfirm,
  onCancel,
}: ConfirmRestoreModalProps) {
  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <h3 className={styles.modalTitle}>
          Restore {count} blog{count > 1 ? "s" : ""}?
        </h3>

        <p className={styles.modalText}>
          This action will restore the selected blog{count > 1 ? "s" : ""} back
          to active blogs.
        </p>

        <div className={styles.modalActions}>
          <button type="button" className={styles.cancelBtn} onClick={onCancel}>
            Cancel
          </button>

          <button
            type="button"
            className={styles.confirmDeleteBtn} // you can keep styling, rename class later if needed
            onClick={onConfirm}
          >
            Restore
          </button>
        </div>
      </div>
    </div>
  );
}
