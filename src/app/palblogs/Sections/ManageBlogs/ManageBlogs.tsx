"use client";

import { useEffect, useState } from "react";
import BlogsTable from "./BlogsTable";
import ActionRow from "./ActionRow";
import ConfirmDeleteModal from "./ConfirmDeleteModal";
import styles from "./ManageBlogs.module.css";
import StatusBlock from "./StatusBlock";
import toast from "react-hot-toast";
import Lottie from "lottie-react";
import loadingAnimation from "../../../../../public/loading.json";
import Info from "../../../Components/Info";

/* ---------- Types ---------- */

export interface BlogAdminItem {
  _id: string;
  slug: string;
  status: "draft" | "published";
  meta: {
    title: string;
    category: string;
  };
  tags?: string[];
  isDeleted: boolean;
  createdAt: string;
}

type StatusFilter = "all" | "published" | "draft";

/* ---------- Toast Styles ---------- */

const errorToast = {
  style: {
    background: "#7f1d1d",
    color: "#fff",
    borderRadius: "8px",
    fontSize: "14px",
  },
};

const successToast = {
  style: {
    background: "#14532d",
    color: "#fff",
    borderRadius: "8px",
    fontSize: "14px",
  },
};

/* ---------- Constants, Pagination ---------- */

const PER_PAGE = 10;

/* ---------- Component ---------- */

export default function ManageBlogs() {
  const [blogs, setBlogs] = useState<BlogAdminItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /* UI state */
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  /* Pagination */
  const [page, setPage] = useState(1);

  /* isAdmin */
  const [isAdmin, setIsAdmin] = useState(false);

  /* ---------- Fetch blogs ---------- */

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        const res = await fetch("/api/blogs/admin", {
          cache: "no-store",
        });

        if (!res.ok) throw new Error();

        const data = await res.json();
        setBlogs(data.blogs);
        setIsAdmin(data.isAdmin);
      } catch {
        setError("Unable to load blogs");
      } finally {
        setLoading(false);
      }
    };

    fetchBlogs();
  }, []);

  /* ---------- Filtering ---------- */

  const filteredBlogs = blogs.filter((blog) => {
    // Exclude trashed blogs from table display
    if (blog.isDeleted) return false;

    const q = search.toLowerCase();

    const matchesSearch =
      blog.meta.title.toLowerCase().includes(q) ||
      blog.meta.category.toLowerCase().includes(q) ||
      blog.slug.toLowerCase().includes(q) ||
      (blog.tags || []).some((t) => t.toLowerCase().includes(q));

    const matchesStatus =
      statusFilter === "all" || blog.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  /* Reset page & selection on filter/search */
  useEffect(() => {
    setPage(1);
    setSelectedIds([]);
  }, [search, statusFilter]);

  /* ---------- Pagination ---------- */

  const totalPages = Math.ceil(filteredBlogs.length / PER_PAGE);

  const paginatedBlogs = filteredBlogs.slice(
    (page - 1) * PER_PAGE,
    page * PER_PAGE,
  );

  /* ---------- Selection ---------- */

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const toggleSelectAll = () => {
    const pageIds = paginatedBlogs.map((b) => b._id);

    if (pageIds.length && pageIds.every((id) => selectedIds.includes(id))) {
      setSelectedIds((prev) => prev.filter((id) => !pageIds.includes(id)));
    } else {
      setSelectedIds((prev) => [...new Set([...prev, ...pageIds])]);
    }
  };

  /* ---------- Bulk actions ---------- */

  const applyBulkAction = async () => {
    if (!bulkAction || !selectedIds.length) return;

    /* ---------- Delete (allowed for all) ---------- */
    if (bulkAction === "delete") {
      setShowDeleteModal(true);
      return;
    }

    /* ---------- Publish / Unpublish (admin only) ---------- */
    if (!isAdmin) {
      toast.error("Only admin can publish or unpublish blogs", errorToast);
      return;
    }

    try {
      await Promise.all(
        selectedIds.map((id) =>
          fetch(`/api/blogs/${id}/status`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              status: bulkAction === "publish" ? "published" : "draft",
            }),
          }),
        ),
      );

      /* Update local state */
      setBlogs((prev) =>
        prev.map((blog) =>
          selectedIds.includes(blog._id)
            ? {
                ...blog,
                status: bulkAction === "publish" ? "published" : "draft",
              }
            : blog,
        ),
      );

      toast.success(
        bulkAction === "publish"
          ? "Blogs published successfully"
          : "Blogs moved to draft",
        successToast,
      );

      setSelectedIds([]);
      setBulkAction("");
    } catch {
      toast.error("Failed to update blog status", errorToast);
    }
  };

  const confirmDelete = async () => {
    try {
      await Promise.all(
        selectedIds.map((id) =>
          fetch(`/api/blogs/${id}`, { method: "DELETE" }),
        ),
      );

      setBlogs((prev) => prev.filter((b) => !selectedIds.includes(b._id)));

      toast.success(
        selectedIds.length === 1
          ? "Blog deleted successfully"
          : `${selectedIds.length} blogs deleted successfully`,
        successToast,
      );

      setSelectedIds([]);
      setBulkAction("");
    } catch {
      toast.error("Failed to delete blogs", errorToast);
    } finally {
      setShowDeleteModal(false);
    }
  };

  const confirmEdit = async () => {
    try {
      await Promise.all(
        selectedIds.map((id) =>
          fetch(`/api/blogs/${id}`, { method: "DELETE" }),
        ),
      );

      setBlogs((prev) => prev.filter((b) => !selectedIds.includes(b._id)));

      toast.success(
        selectedIds.length === 1
          ? "Blog deleted successfully"
          : `${selectedIds.length} blogs deleted successfully`,
        successToast,
      );

      setSelectedIds([]);
      setBulkAction("");
    } catch {
      toast.error("Failed to delete blogs", errorToast);
    } finally {
      setShowDeleteModal(false);
    }
  };

  /* ---------- Row delete (NEW) ---------- */

  const handleRowDelete = (id: string) => {
    setSelectedIds([id]); // single selection
    setShowDeleteModal(true);
  };
  const handleRowEdit = (id: string) => {
    setSelectedIds([id]);
    confirmEdit();
  };

  /* ---------- States ---------- */

  if (loading) {
    return (
      <div className={styles.state}>
        <Lottie
          animationData={loadingAnimation}
          loop
          autoplay
          style={{ width: 100, height: 100 }}
          rendererSettings={{ preserveAspectRatio: "xMidYMid slice" }}
        />
        <span>Loading blogs…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.stateError}>
        Something Went Wrong Contact Support {error}
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.leadsHeader}>
        <div>
        <h2>Manage Blogs</h2>
        <p>Organize blogs and manage their status effectively here</p>
        </div>
        <Info
  instructions={[
    [
      { text: "Click the " },
      { text: "Status", highlight: true },
      { text: " badge to change the blog's current status." },
    ],
    [
      { text: "Search blogs using the " },
      { text: "Title", highlight: true },
      { text: ", " },
      { text: "Slug", highlight: true },
      { text: ", " },
      { text: "Category", highlight: true },
      { text: ", or " },
      { text: "Tags", highlight: true },
      { text: "." },
    ],
    [
      { text: "Click the " },
      { text: "Edit", highlight: true },
      { text: " icon to modify the blog." },
    ],
    [
      { text: "Click the " },
      { text: "Trash", highlight: true },
      { text: " icon to move the blog to Trash." },
    ],
  ]}
/>
      </div>

      {/* Status Block */}
      <StatusBlock
        total={blogs.length}
        published={blogs.filter((b) => b.status === "published").length}
        draft={blogs.filter((b) => b.status === "draft").length}
        deleted={blogs.filter((b) => b.isDeleted).length}
      />

      {/* Action Row */}
      <ActionRow
        selectedCount={selectedIds.length}
        bulkAction={bulkAction}
        onBulkActionChange={setBulkAction}
        onApplyBulk={applyBulkAction}
        search={search}
        onSearchChange={setSearch}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
      />

      {!filteredBlogs.length ? (
        <div className={styles.state}>No blogs match your filters.</div>
      ) : (
        <>
          <BlogsTable
            isAdmin={isAdmin}
            blogs={paginatedBlogs}
            selectedIds={selectedIds}
            onSelect={toggleSelect}
            onSelectAll={toggleSelectAll}
            onDelete={handleRowDelete}
            onEdit={handleRowEdit}
          />

          {totalPages > 1 && (
            <div className={styles.pagination}>
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Prev
              </button>

              <span className={styles.pageInfo}>
                Page {page} of {totalPages}
              </span>

              <button
                disabled={page === totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {showDeleteModal && (
        <ConfirmDeleteModal
          count={selectedIds.length}
          onCancel={() => setShowDeleteModal(false)}
          onConfirm={confirmDelete}
        />
      )}
    </div>
  );
}
