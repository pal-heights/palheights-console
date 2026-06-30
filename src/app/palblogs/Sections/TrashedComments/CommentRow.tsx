import styles from "./TrashedComments.module.css";
import { CommentAdminItem } from "./TrashedComments";
import { BiTrash } from "react-icons/bi";

interface CommentRowProps {
  comment: CommentAdminItem;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onRestore: (id: string) => void;
  onPermaDelete: (id: string) => void;
  onView: (comment: CommentAdminItem) => void;
}

export default function CommentRow({
  comment,
  isSelected,
  onSelect,
  onRestore,
  onPermaDelete,
  onView,
}: CommentRowProps) {
  return (
    <tr className={styles.row}>
      {/* Checkbox */}
      <td className={styles.checkbox}>
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onSelect(comment._id)}
          className={styles.checkboxInput}
        />
      </td>

      {/* Name */}
      <td>{comment.name}</td>

      {/* Email */}
      <td>{comment.email}</td>

      {/* Blog Slug */}
      <td>{comment.blogSlug}</td>

      {/* Comment */}
      <td>
        <button
          type="button"
          className={styles.viewCommentBtn}
          onClick={() => onView(comment)}
        >
          View
        </button>
      </td>

      {/* Status (always deleted) */}
      <td>
        <span className={styles.statusDeleted}>Deleted</span>
      </td>

      {/* Created */}
      <td>{new Date(comment.createdAt).toLocaleDateString()}</td>

      {/* Actions */}
      <td
        style={{
          display: "flex",
          gap: "10px",
          alignItems: "center",
        }}
      >
        <button
          type="button"
          onClick={() => onRestore(comment._id)}
          className={styles.restoreBtn}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="22 12 18 12 15 15 18 18 22 18"></polyline>
            <path d="M5.45 5.45A9 9 0 0 0 21 12h-3a6 6 0 0 1-6-6V3a9 9 0 0 0-9 9"></path>
          </svg>
        </button>
        <button
          type="button"
          onClick={() => onPermaDelete(comment._id)}
          className={styles.restoreBtn}
        >
          <BiTrash color="red" size={17} />
        </button>
      </td>
    </tr>
  );
}
