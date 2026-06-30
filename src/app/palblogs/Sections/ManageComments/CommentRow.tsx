import styles from "./ManageComments.module.css";
import { CommentAdminItem } from "./ManageComments";

interface CommentRowProps {
  comment: CommentAdminItem;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onView: (comment: CommentAdminItem) => void;
}

export default function CommentRow({
  comment,
  isSelected,
  onSelect,
  onDelete,
  onView,
}: CommentRowProps) {
  const handleDelete = () => {
    onDelete(comment._id);
  };

  const handleView = () => {
    onView(comment);
  };

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

      {/* Comment (View button triggers modal) */}
      <td>
        <button
          type="button"
          className={styles.viewCommentBtn}
          onClick={handleView}
        >
          View
        </button>
      </td>

      {/* Status */}
      <td>
        <span
          className={
            comment.isDeleted ? styles.statusDeleted : styles.statusActive
          }
        >
          {comment.isDeleted ? "Deleted" : "Active"}
        </span>
      </td>

      {/* Created */}
      <td>{new Date(comment.createdAt).toLocaleDateString()}</td>

      {/* Actions */}
      <td>
        <button
          type="button"
          onClick={handleDelete}
          className={styles.deleteBtn}
        >
          Delete
        </button>
      </td>
    </tr>
  );
}
