import CommentRow from "./CommentRow";
import styles from "./ManageComments.module.css";
import { CommentAdminItem } from "./ManageComments";

interface CommentsTableProps {
  comments: CommentAdminItem[]; // paginated comments
  selectedIds: string[];
  onDelete: (id: string) => void;
  onSelect: (id: string) => void;
  onSelectAll: () => void;
  onView: (comment: CommentAdminItem) => void;
}

export default function CommentsTable({
  comments,
  selectedIds,
  onSelect,
  onSelectAll,
  onDelete,
  onView,
}: CommentsTableProps) {
  const allSelected =
    comments.length > 0 && selectedIds.length === comments.length;

  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th className={styles.checkbox}>
              <input
                type="checkbox"
                checked={allSelected}
                onChange={onSelectAll}
                className={styles.checkboxInput}
              />
            </th>
            <th>Name</th>
            <th>Email</th>
            <th>Blog Slug</th>
            <th>Comment</th>
            <th>Status</th>
            <th>Created</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {comments.map((comment) => (
            <CommentRow
              key={comment._id}
              comment={comment} // ✅ pass a single comment
              isSelected={selectedIds.includes(comment._id)}
              onSelect={onSelect}
              onDelete={onDelete}
              onView={onView}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
