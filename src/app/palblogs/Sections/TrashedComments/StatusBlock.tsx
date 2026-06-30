"use client";

import styles from "./StatusBlock.module.css";
import { MessageSquare, CheckCircle, Calendar, Trash2 } from "lucide-react";

interface StatusBlockProps {
  total: number;
  active: number;
  today: number;
  deleted: number;
}

export default function StatusBlock({
  total,
  active,
  today,
  deleted,
}: StatusBlockProps) {
  return (
    <div className={styles.grid}>
      {/* Total Comments */}
      <div className={styles.card}>
        <div className={styles.top}>
          <span className={styles.label}>TOTAL COMMENTS</span>
          <span className={`${styles.icon} ${styles.blue}`}>
            <MessageSquare size={18} />
          </span>
        </div>

        <div className={styles.value}>{total}</div>
        <div className={styles.meta}>All comments in system</div>
      </div>

      {/* Active */}
      <div className={styles.card}>
        <div className={styles.top}>
          <span className={styles.label}>ACTIVE</span>
          <span className={`${styles.icon} ${styles.success}`}>
            <CheckCircle size={18} />
          </span>
        </div>

        <div className={styles.value}>{active}</div>
        <div className={styles.meta}>Visible on website</div>
      </div>

      {/* Today */}
      <div className={styles.card}>
        <div className={styles.top}>
          <span className={styles.label}>TODAY</span>
          <span className={`${styles.icon} ${styles.warning}`}>
            <Calendar size={18} />
          </span>
        </div>

        <div className={styles.value}>{today}</div>
        <div className={styles.meta}>New comments today</div>
      </div>

      {/* Deleted */}
      <div className={styles.card}>
        <div className={styles.top}>
          <span className={styles.label}>DELETED</span>
          <span className={`${styles.icon} ${styles.danger}`}>
            <Trash2 size={18} />
          </span>
        </div>

        <div className={styles.value}>{deleted}</div>
        <div className={styles.meta}>Soft deleted comments</div>
      </div>
    </div>
  );
}
