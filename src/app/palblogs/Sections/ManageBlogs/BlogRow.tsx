// import styles from "./ManageBlogs.module.css";
// import StatusToggle from "./StatusToggle";
// import { BlogAdminItem } from "./ManageBlogs";
// import { HiOutlineTrash } from "react-icons/hi";
// import { HiOutlinePencilSquare } from "react-icons/hi2";

// interface BlogRowProps {
//   isAdmin: boolean;
//   blog: BlogAdminItem;
//   isSelected: boolean;
//   onSelect: (id: string) => void;
//   onDelete: (id: string) => void;
//   onEdit: (id: string) => void;
// }

// export default function BlogRow({
//   isAdmin,
//   blog,
//   isSelected,
//   onSelect,
//   onDelete,
//   onEdit,
// }: BlogRowProps) {
//   const handleEdit = () => {
//     onEdit(blog._id);
//   };

//   const handleDelete = () => {
//     onDelete(blog._id);
//   };
//   return (
//     <tr className={styles.row}>
//       {/* Checkbox */}
//       <td className={styles.checkbox}>
//         <input
//           type="checkbox"
//           checked={isSelected}
//           onChange={() => onSelect(blog._id)}
//           className={styles.checkboxInput}
//         />
//       </td>

//       <td className={styles.titleCell}>
//         <div className={styles.title}>{blog.meta.title}</div>
//         <div className={styles.slug}>{blog.slug}</div>
//       </td>

//       <td className={styles.category}>{blog.meta.category}</td>

//       <td className={styles.category}>
//         <button></button>
//         {blog.tags && blog.tags.length > 0
//           ? `${blog.tags[0]}, ${blog.tags[1]}...`
//           : "—"}
//       </td>

//       <td>
//         <StatusToggle
//           disabled={!isAdmin}
//           blogId={blog._id}
//           status={blog.status}
//         />
//       </td>

//       <td className={styles.created}>
//         {new Date(blog.createdAt).toLocaleDateString()}
//       </td>

//       <td>
//         {/* <button type="button" onClick={handleEdit} className={styles.editBtn}>
//           Edit
//         </button> */}
//         <div className={styles.actionWrap}>
//           <button
//             type="button"
//             onClick={handleDelete}
//             className={styles.deleteBtn}
//           >
//             <HiOutlineTrash size={20} />
//           </button>

//           <button type="button" onClick={handleEdit} className={styles.editBtn}>
//             <HiOutlinePencilSquare size={20} />
//           </button>
//         </div>
//       </td>
//     </tr>
//   );
// }

import styles from "./ManageBlogs.module.css";
import StatusToggle from "./StatusToggle";
import { BlogAdminItem } from "./ManageBlogs";
import { HiOutlineTrash } from "react-icons/hi";
import { HiOutlinePencilSquare } from "react-icons/hi2";
import { useRouter } from "next/navigation";

interface BlogRowProps {
  isAdmin: boolean;
  blog: BlogAdminItem;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string) => void;
}

export default function BlogRow({
  isAdmin,
  blog,
  isSelected,
  onSelect,
  onDelete,
  onEdit,
}: BlogRowProps) {
  const router = useRouter();

  const handleEdit = () => {
    router.push(`/palblogs/edit/${blog._id}`);
  };

  const handleDelete = () => {
    onDelete(blog._id);
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
        <button></button>
        {blog.tags && blog.tags.length > 0
          ? `${blog.tags[0]}, ${blog.tags[1]}...`
          : "—"}
      </td>

      <td>
        <StatusToggle
          disabled={!isAdmin}
          blogId={blog._id}
          status={blog.status}
        />
      </td>

      <td className={styles.created}>
        {new Date(blog.createdAt).toLocaleDateString()}
      </td>

      <td>
        <div className={styles.actionWrap}>
          <button
            type="button"
            onClick={handleDelete}
            className={styles.deleteBtn}
          >
            <HiOutlineTrash size={20} />
          </button>

          <button type="button" onClick={handleEdit} className={styles.editBtn}>
            <HiOutlinePencilSquare size={20} />
          </button>
        </div>
      </td>
    </tr>
  );
}
