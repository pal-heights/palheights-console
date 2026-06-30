import styles from "./TrashedBlogs.module.css";
import StatusToggle from "./StatusToggle";
import { BlogAdminItem } from "./TrashedBlogs";

interface BlogRowProps {
  isAdmin: boolean;
  blog: BlogAdminItem;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onRestore: (id: string) => void; // renamed prop
}

export default function BlogRow({
  blog,
  isSelected,
  onSelect,
  onRestore,
}: BlogRowProps) {
  const handleRestore = () => {
    onRestore(blog._id);
  };

  return (
    <tr className={styles.row}>
      {/* Checkbox */}
      <td className={styles.checkbox}>
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onSelect(blog._id)}
          className={styles.checkboxInput}
        />
      </td>

      <td className={styles.titleCell}>
        <div className={styles.title}>{blog.meta.title}</div>
        <div className={styles.slug}>{blog.slug}</div>
      </td>

      <td className={styles.category}>{blog.meta.category}</td>

      <td className={styles.category}>
        {blog.meta.tags && blog.meta.tags.length > 0
          ? blog.meta.tags.join(", ")
          : "—"}
      </td>

      <td>
        <StatusToggle disabled blogId={blog._id} status={blog.status} />
      </td>

      <td className={styles.created}>
        {new Date(blog.createdAt).toLocaleDateString()}
      </td>

      <td>
        <button
          type="button"
          onClick={handleRestore}
          className={styles.deleteBtn}
        >
          Restore
        </button>
      </td>
    </tr>
  );
}
