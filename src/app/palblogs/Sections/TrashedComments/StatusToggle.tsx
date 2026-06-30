"use client";

import styles from "./TrashedComments.module.css";

interface CommentStatusProps {
  isDeleted: boolean;
}

export default function CommentStatus({ isDeleted }: CommentStatusProps) {
  return (
    <span
      className={isDeleted ? styles.statusDeleted : styles.statusActive}
      data-tooltip={
        isDeleted ? "This comment is deleted" : "This comment is active"
      }
    >
      {isDeleted ? "Deleted" : "Active"}
    </span>
  );
}
