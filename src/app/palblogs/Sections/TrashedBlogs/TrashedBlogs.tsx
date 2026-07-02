"use client";

import { useEffect, useState } from "react";
import BlogsTable from "./BlogsTable";
import ActionRow from "./ActionRow";
import ConfirmDeleteModal from "./ConfirmDeleteModal";
import styles from "./TrashedBlogs.module.css";
import StatusBlock from "./StatusBlock";
import toast from "react-hot-toast";
import Lottie from "lottie-react";
import loadingAnimation from "../../../../../public/loading.json";

/* ---------- Types ---------- */
export interface BlogAdminItem {
  _id: string;
  slug: string;
  status: "draft" | "published";
  meta: {
    title: string;
    category: string;
    tags?: string[];
  };
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

/* ---------- Constants ---------- */
const PER_PAGE = 10;

/* ---------- Component ---------- */
export default function TrashedBlogs() {
  const [blogs, setBlogs] = useState<BlogAdminItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [page, setPage] = useState(1);
  const [isAdmin, setIsAdmin] = useState(false);

  /* ---------- Fetch all blogs ---------- */
  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        const res = await fetch("/api/blogs/admin", { cache: "no-store" });
        if (!res.ok) throw new Error();
        const data = await res.json();

        // Store all blogs for StatusBlock
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

  /* ---------- Filtering for table only ---------- */
  const filteredBlogs = blogs.filter((blog) => {
    // Only show trashed blogs in table
    if (!blog.isDeleted) return false;

    const q = search.toLowerCase();
    const matchesSearch =
      blog.meta.title.toLowerCase().includes(q) ||
      blog.meta.category.toLowerCase().includes(q) ||
      blog.slug.toLowerCase().includes(q) ||
      (blog.meta.tags || []).some((t) => t.toLowerCase().includes(q));

    const matchesStatus =
      statusFilter === "all" || blog.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  /* Reset selection on filter/search */
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

  /* ---------- Bulk restore / delete ---------- */
  const restoreSelected = () => {
    if (!selectedIds.length) return;
    setShowRestoreModal(true);
  };

  const permaDeleteSelected = async () => {
    if (!selectedIds.length) return;
    
    if (confirm(`Are you sure you want to permanently delete ${selectedIds.length > 1 ? "these blogs" : "this blog"}? This action cannot be undone.`)) {
      try {
        await Promise.all(
          selectedIds.map((id) =>
            fetch(`/api/blogs/${id}/delete`, {
              method: "DELETE",
            }),
          ),
        );

        setBlogs((prev) => prev.filter((b) => !selectedIds.includes(b._id)));
        setSelectedIds([]);
        toast.success("Blogs permanently deleted", successToast);
      } catch {
        toast.error("Failed to permanently delete blogs", errorToast);
      }
    }
  };

  const confirmRestore = async () => {
    try {
      await Promise.all(
        selectedIds.map((id) => fetch(`/api/blogs/${id}`, { method: "PATCH" })),
      );

      setBlogs((prev) =>
        prev.map((blog) =>
          selectedIds.includes(blog._id) ? { ...blog, isDeleted: false } : blog,
        ),
      );

      toast.success(
        selectedIds.length === 1
          ? "Blog restored successfully"
          : `${selectedIds.length} blogs restored successfully`,
        successToast,
      );

      setSelectedIds([]);
    } catch {
      toast.error("Failed to restore blogs", errorToast);
    } finally {
      setShowRestoreModal(false);
    }
  };

  /* ---------- Row restore / delete ---------- */
  const handleRowRestore = (id: string) => {
    setSelectedIds([id]);
    setShowRestoreModal(true);
  };

  const handleRowPermaDelete = async (id: string) => {
    if (confirm("Are you sure you want to permanently delete this blog? This action cannot be undone.")) {
      try {
        await fetch(`/api/blogs/${id}/delete`, {
          method: "DELETE",
        });
        setBlogs((prev) => prev.filter((b) => b._id !== id));
        toast.success("Blog permanently deleted", successToast);
      } catch {
        toast.error("Permanent delete failed", errorToast);
      }
    }
  };

  /* ---------- Loading/Error states ---------- */
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

  if (error)
    return (
      <div className={styles.stateError}>
        Something Went Wrong Contact Support {error}
      </div>
    );

  return (
    <div className={styles.container}>
      <div className={styles.leadsHeader}>
        <h2>Trashed Blogs</h2>
        <p>Manage trashed blogs here</p>
      </div>

      {/* Status Block shows all trashed blogs totals */}
      <StatusBlock
        total={blogs.length}
        published={blogs.filter((b) => b.status === "published").length}
        draft={blogs.filter((b) => b.status === "draft").length}
        deleted={blogs.filter((b) => b.isDeleted).length}
      />

      {/* Action Row */}
      <ActionRow
        selectedCount={selectedIds.length}
        onRestoreSelected={restoreSelected}
        onPermaDeleteSelected={permaDeleteSelected}
        search={search}
        onSearchChange={setSearch}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
      />

      {!filteredBlogs.length ? (
        <div className={styles.state}>No trashed blogs found.</div>
      ) : (
        <>
          <BlogsTable
            isAdmin={isAdmin}
            blogs={paginatedBlogs}
            selectedIds={selectedIds}
            onSelect={toggleSelect}
            onSelectAll={toggleSelectAll}
            onRestore={handleRowRestore}
            onPermaDelete={handleRowPermaDelete}
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

      {showRestoreModal && (
        <ConfirmDeleteModal
          count={selectedIds.length}
          onCancel={() => setShowRestoreModal(false)}
          onConfirm={confirmRestore}
        />
      )}
    </div>
  );
}
