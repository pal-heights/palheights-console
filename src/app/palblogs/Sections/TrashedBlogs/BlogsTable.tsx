import BlogRow from "./BlogRow";
import styles from "./TrashedBlogs.module.css";
import { BlogAdminItem } from "./TrashedBlogs";

interface BlogsTableProps {
  isAdmin: boolean;
  blogs: BlogAdminItem[];
  selectedIds: string[];
  onRestore: (id: string) => void; // renamed from onDelete
  onSelect: (id: string) => void;
  onSelectAll: () => void;
}

export default function BlogsTable({
  isAdmin,
  blogs,
  selectedIds,
  onSelect,
  onSelectAll,
  onRestore, // renamed prop
}: BlogsTableProps) {
  const allSelected = blogs.length > 0 && selectedIds.length === blogs.length;

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
            <th>Title</th>
            <th>Category</th>
            <th>Tags</th>
            <th>Status</th>
            <th>Created</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {blogs.map((blog) => (
            <BlogRow
              key={blog._id}
              blog={blog}
              isSelected={selectedIds.includes(blog._id)}
              onSelect={onSelect}
              onRestore={onRestore} // renamed prop
              isAdmin={isAdmin}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
