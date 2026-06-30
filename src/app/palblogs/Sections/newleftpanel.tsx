// "use client";

// import { useState, useEffect } from "react";
// import { useRouter } from "next/navigation";
// import { LogOut } from "lucide-react";
// import styles from "./LeftPanel.module.css";

// type SectionKey =
//   | "add-blog"
//   | "manage-blogs"
//   | "manage-comments"
//   | "announcements"
//   | "trash-blogs"
//   | "trash-comments";

// interface LeftPanelProps {
//   activeSection: SectionKey;
//   onChange: (section: SectionKey) => void;
// }

// interface UserData {
//   name: string;
//   email: string;
//   role?: string;
// }

// export default function LeftPanel({ activeSection, onChange }: LeftPanelProps) {
//   const router = useRouter();
//   const [userData, setUserData] = useState<UserData | null>(null);
//   const [isLoggingOut, setIsLoggingOut] = useState(false);

//   useEffect(() => {
//     fetchUserData();
//   }, []);

//   const fetchUserData = async () => {
//     try {
//       // Try to fetch admin user data first
//       const adminResponse = await fetch("/api/admin/me");
//       if (adminResponse.ok) {
//         const data = await adminResponse.json();
//         setUserData({
//           name: data.user.username || data.user.email,
//           email: data.user.email,
//           role: "admin",
//         });
//         return;
//       }

//       // If not admin, try blog manager
//       const blogManagerResponse = await fetch("/api/blog-manager/me");
//       if (blogManagerResponse.ok) {
//         const data = await blogManagerResponse.json();
//         setUserData({
//           name: data.user.name || data.user.email,
//           email: data.user.email,
//           role: data.user.role,
//         });
//         return;
//       }
//     } catch (error) {
//       console.error("Error fetching user data:", error);
//     }
//   };

//   const handleLogout = async () => {
//     setIsLoggingOut(true);
//     try {
//       // Logout from both admin and blog-manager sessions
//       await fetch("/api/admin/logout", { method: "POST" });
//       await fetch("/api/blog-manager/logout", { method: "POST" });

//       // Redirect to home page
//       router.push("/");
//     } catch (error) {
//       console.error("Error logging out:", error);
//       setIsLoggingOut(false);
//     }
//   };

//   // Get first letter of name for avatar
//   const avatarLetter = userData?.name?.charAt(0).toUpperCase() || "U";

//   return (
//     <div className={styles.panelWrapper}>
//       <aside className={styles.panel}>
//         {/* User */}
//         <div className={styles.user}>
//           <div className={styles.avatar}>{avatarLetter}</div>
//           <div className={styles.name}>{userData?.name || "Loading..."}</div>
//           <div className={styles.email}>{userData?.email || ""}</div>
//           <button
//             className={styles.logout}
//             onClick={handleLogout}
//             disabled={isLoggingOut}
//           >
//             <LogOut size={16} />
//             {isLoggingOut ? "Logging out..." : "Logout"}
//           </button>
//         </div>

//         {/* Blog */}
//         <NavGroup title="Blog Management">
//           <NavItem
//             label="Add Blog"
//             active={activeSection === "add-blog"}
//             onClick={() => onChange("add-blog")}
//           />
//           <NavItem
//             label="Manage Blogs"
//             active={activeSection === "manage-blogs"}
//             onClick={() => onChange("manage-blogs")}
//           />
//         </NavGroup>

//         {/* Comments */}
//         <NavGroup title="Comment Management">
//           <NavItem
//             label="Manage Comments"
//             active={activeSection === "manage-comments"}
//             onClick={() => onChange("manage-comments")}
//           />
//         </NavGroup>

//         {/* Announcements */}
//         <NavGroup title="Announcements">
//           <NavItem
//             label="Announcements"
//             active={activeSection === "announcements"}
//             onClick={() => onChange("announcements")}
//           />
//         </NavGroup>

//         {/* Trash */}
//         <NavGroup title="Trash" danger>
//           <NavItem
//             label="Trashed Blogs"
//             danger
//             active={activeSection === "trash-blogs"}
//             onClick={() => onChange("trash-blogs")}
//           />
//           <NavItem
//             label="Trashed Comments"
//             danger
//             active={activeSection === "trash-comments"}
//             onClick={() => onChange("trash-comments")}
//           />
//         </NavGroup>
//       </aside>
//     </div>
//   );
// }

// /* helpers */

// function NavGroup({
//   title,
//   danger,
//   children,
// }: {
//   title: string;
//   danger?: boolean;
//   children: React.ReactNode;
// }) {
//   return (
//     <div className={styles.group}>
//       <div className={`${styles.groupTitle} ${danger ? styles.danger : ""}`}>
//         <hr className={`${styles.hr} ${danger ? styles.danger : ""}`} />
//         {title}
//         <hr className={`${styles.hr} ${danger ? styles.danger : ""}`} />
//       </div>
//       {children}
//     </div>
//   );
// }

// function NavItem({
//   label,
//   active,
//   danger,
//   onClick,
// }: {
//   label: string;
//   active?: boolean;
//   danger?: boolean;
//   onClick: () => void;
// }) {
//   return (
//     <button
//       onClick={onClick}
//       className={[
//         styles.item,
//         active ? styles.active : "",
//         danger ? styles.dangerItem : "",
//       ].join(" ")}
//     >
//       <span className={styles.indicator} />
//       {label}
//     </button>
//   );
// }

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  LogOut,
  Plus,
  FileText,
  MessageSquare,
  Bell,
  Trash2,
  ChevronLeft,
  ChevronRight,
  User,
} from "lucide-react";
import styles from "./LeftPanel.module.css";

type SectionKey =
  | "add-blog"
  | "manage-blogs"
  | "manage-comments"
  | "announcements"
  | "trash-blogs"
  | "trash-comments";

interface LeftPanelProps {
  activeSection: SectionKey;
  onChange: (section: SectionKey) => void;
}

interface UserData {
  name: string;
  email: string;
  role?: string;
}

export default function LeftPanel({ activeSection, onChange }: LeftPanelProps) {
  const router = useRouter();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  /* 🔥 collapsed state */
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const adminResponse = await fetch("/api/admin/me");
      if (adminResponse.ok) {
        const data = await adminResponse.json();
        setUserData({
          name: data.user.username || data.user.email,
          email: data.user.email,
          role: "admin",
        });
        return;
      }

      const blogManagerResponse = await fetch("/api/blog-manager/me");
      if (blogManagerResponse.ok) {
        const data = await blogManagerResponse.json();
        setUserData({
          name: data.user.name || data.user.email,
          email: data.user.email,
          role: data.user.role,
        });
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await fetch("/api/admin/logout", { method: "POST" });
      await fetch("/api/blog-manager/logout", { method: "POST" });
      router.push("/");
    } catch {
      setIsLoggingOut(false);
    }
  };

  const avatarLetter = userData?.name?.charAt(0).toUpperCase() || "U";

  return (
    <div
      className={`${styles.panelWrapper} ${collapsed ? styles.collapsed : ""}`}
    >
      <aside className={`${styles.panel} ${collapsed ? styles.collapsed : ""}`}>
        {/* Toggle Button */}
        <button
          type="button"
          className={styles.toggle}
          onClick={() => setCollapsed((v) => !v)}
          title={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>

        {/* User */}
        <div className={styles.user}>
          <div className={styles.avatar}>
            {collapsed ? <User size={20} /> : avatarLetter}
          </div>
          {!collapsed && (
            <div className={styles.userInfo}>
              <div className={styles.name}>
                {userData?.name || "Loading..."}
              </div>
              <div className={styles.email}>{userData?.email || ""}</div>
              <button
                className={styles.logout}
                onClick={handleLogout}
                disabled={isLoggingOut}
              >
                <LogOut size={14} />
                {isLoggingOut ? "..." : "Logout"}
              </button>
            </div>
          )}
        </div>

        {/* Blog */}
        <NavGroup title="Blog" collapsed={collapsed}>
          <NavItem
            label="Add Blog"
            icon={<Plus size={18} />}
            collapsed={collapsed}
            active={activeSection === "add-blog"}
            onClick={() => onChange("add-blog")}
          />
          <NavItem
            label="Manage Blogs"
            icon={<FileText size={18} />}
            collapsed={collapsed}
            active={activeSection === "manage-blogs"}
            onClick={() => onChange("manage-blogs")}
          />
        </NavGroup>

        {/* Comments */}
        <NavGroup title="Comments" collapsed={collapsed}>
          <NavItem
            label="Manage Comments"
            icon={<MessageSquare size={18} />}
            collapsed={collapsed}
            active={activeSection === "manage-comments"}
            onClick={() => onChange("manage-comments")}
          />
        </NavGroup>

        {/* Announcements */}
        <NavGroup title="Alerts" collapsed={collapsed}>
          <NavItem
            label="Announcements"
            icon={<Bell size={18} />}
            collapsed={collapsed}
            active={activeSection === "announcements"}
            onClick={() => onChange("announcements")}
          />
        </NavGroup>

        {/* Trash */}
        <NavGroup title="Trash" danger collapsed={collapsed}>
          <NavItem
            label="Trashed Blogs"
            icon={<Trash2 size={18} />}
            danger
            collapsed={collapsed}
            active={activeSection === "trash-blogs"}
            onClick={() => onChange("trash-blogs")}
          />
          <NavItem
            label="Trashed Comments"
            icon={<Trash2 size={18} />}
            danger
            collapsed={collapsed}
            active={activeSection === "trash-comments"}
            onClick={() => onChange("trash-comments")}
          />
        </NavGroup>
      </aside>
    </div>
  );
}

/* helpers */

function NavGroup({
  title,
  danger,
  collapsed,
  children,
}: {
  title: string;
  danger?: boolean;
  collapsed?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={styles.group}>
      {!collapsed ? (
        <div className={`${styles.groupTitle} ${danger ? styles.danger : ""}`}>
          <hr className={`${styles.hr} ${danger ? styles.danger : ""}`} />
          <span>{title}</span>
          <hr className={`${styles.hr} ${danger ? styles.danger : ""}`} />
        </div>
      ) : (
        <div className={styles.collapsedGroupSpacer} />
      )}
      {children}
    </div>
  );
}

function NavItem({
  label,
  icon,
  active,
  danger,
  collapsed,
  onClick,
}: {
  label: string;
  icon: React.ReactNode;
  active?: boolean;
  danger?: boolean;
  collapsed?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        styles.item,
        active ? styles.active : "",
        danger ? styles.dangerItem : "",
        collapsed ? styles.collapsedItem : "",
      ].join(" ")}
      title={collapsed ? label : undefined}
    >
      <span className={styles.indicator} />
      <span className={styles.iconWrapper}>{icon}</span>
      {!collapsed && <span className={styles.label}>{label}</span>}
    </button>
  );
}
