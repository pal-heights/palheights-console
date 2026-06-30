"use client";

import styles from "./ManageComments.module.css";

interface ConfirmDeleteModalProps {
  count: number;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDeleteModal({
  count,
  onConfirm,
  onCancel,
}: ConfirmDeleteModalProps) {
  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <h3 className={styles.modalTitle}>
          Delete {count} blog{count > 1 ? "s" : ""}?
        </h3>

        <p className={styles.modalText}>
          This action will move the selected blog{count > 1 ? "s" : ""} to
          trash. You can restore them later.
        </p>

        <div className={styles.modalActions}>
          <button type="button" className={styles.cancelBtn} onClick={onCancel}>
            Cancel
          </button>

          <button
            type="button"
            className={styles.confirmDeleteBtn}
            onClick={onConfirm}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
