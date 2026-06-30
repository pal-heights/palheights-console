"use client";

import styles from "./StatusBlock.module.css";
import { FileText, Eye, Clock, Trash2 } from "lucide-react";

interface StatusBlockProps {
  total: number;
  published: number;
  draft: number;
  deleted: number;
}

export default function StatusBlock({
  total,
  published,
  draft,
  deleted,
}: StatusBlockProps) {
  return (
    <div className={styles.grid}>
      {/* Total Blogs */}
      <div className={styles.card}>
        <div className={styles.top}>
          <span className={styles.label}>TOTAL BLOGS</span>
          <span className={`${styles.icon} ${styles.blue}`}>
            <FileText size={18} />
          </span>
        </div>

        <div className={styles.value}>{total}</div>
        <div className={styles.meta}>All blogs in system</div>
      </div>

      {/* Published */}
      <div className={styles.card}>
        <div className={styles.top}>
          <span className={styles.label}>PUBLISHED</span>
          <span className={`${styles.icon} ${styles.success}`}>
            <Eye size={18} />
          </span>
        </div>

        <div className={styles.value}>{published}</div>
        <div className={styles.meta}>Visible on website</div>
      </div>

      {/* Draft */}
      <div className={styles.card}>
        <div className={styles.top}>
          <span className={styles.label}>DRAFTS</span>
          <span className={`${styles.icon} ${styles.warning}`}>
            <Clock size={18} />
          </span>
        </div>

        <div className={styles.value}>{draft}</div>
        <div className={styles.meta}>Awaiting publish</div>
      </div>

      {/* Deleted */}
      <div className={styles.card}>
        <div className={styles.top}>
          <span className={styles.label}>TRASHED</span>
          <span className={`${styles.icon} ${styles.danger}`}>
            <Trash2 size={18} />
          </span>
        </div>

        <div className={styles.value}>{deleted}</div>
        <div className={styles.meta}>Soft deleted blogs</div>
      </div>
    </div>
  );
}
