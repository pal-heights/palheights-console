import CommentRow from "./CommentRow";
import styles from "./TrashedComments.module.css";
import { CommentAdminItem } from "./TrashedComments";

interface CommentsTableProps {
  comments: CommentAdminItem[];
  selectedIds: string[];
  onSelect: (id: string) => void;
  onSelectAll: () => void;
  onRestore: (id: string) => void;
  onPermaDelete: (id: string) => void;
  onView: (comment: CommentAdminItem) => void;
}

export default function CommentsTable({
  comments,
  selectedIds,
  onSelect,
  onSelectAll,
  onRestore,
  onPermaDelete,
  onView,
}: CommentsTableProps) {
  const allSelected =
    comments.length > 0 && comments.every((c) => selectedIds.includes(c._id));

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
              comment={comment}
              isSelected={selectedIds.includes(comment._id)}
              onSelect={onSelect}
              onRestore={onRestore}
              onPermaDelete={onPermaDelete}
              onView={onView}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
