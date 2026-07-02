import styles from "./TrashedBlogs.module.css";
import StatusToggle from "./StatusToggle";
import { BlogAdminItem } from "./TrashedBlogs";
import { MdRestore } from "react-icons/md";
import { BiTrash } from "react-icons/bi";

interface BlogRowProps {
  isAdmin: boolean;
  blog: BlogAdminItem;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onRestore: (id: string) => void; // renamed prop
  onPermaDelete: (id: string) => void;
}

export default function BlogRow({
  blog,
  isSelected,
  onSelect,
  onRestore,
  onPermaDelete,
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

      <td className={styles.trashedActions}>
        <button
          type="button"
          onClick={() => onRestore(blog._id)}
          className={styles.restoreBtn}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            color="green"
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
          onClick={() => onPermaDelete(blog._id)}
          className={styles.restoreBtn}
        >
          <BiTrash color="red" size={17} />
        </button>
      </td>
    </tr>
  );
}
