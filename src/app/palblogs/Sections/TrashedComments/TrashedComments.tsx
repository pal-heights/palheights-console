"use client";

import { useEffect, useState } from "react";
import CommentsTable from "./CommentTable";
import ActionRow from "./ActionRow";
import StatusBlock from "./StatusBlock";
import styles from "./TrashedComments.module.css";
import toast from "react-hot-toast";
import Lottie from "lottie-react";
import loadingAnimation from "../../../../../public/loading.json";

export interface CommentAdminItem {
  _id: string;
  blogId: string;
  blogSlug: string;
  name: string;
  email: string;
  comment: string;
  isDeleted: boolean;
  createdAt: string;
}

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

const PER_PAGE = 10;

export default function TrashedComments() {
  const [comments, setComments] = useState<CommentAdminItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /* UI state */
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [dateSort, setDateSort] = useState<"asc" | "desc">("desc");
  const [viewComment, setViewComment] = useState<CommentAdminItem | null>(null);

  /* Pagination */
  const [page, setPage] = useState(1);

  /* ---------- Fetch ONLY trashed comments ---------- */
  useEffect(() => {
    const fetchComments = async () => {
      try {
        const res = await fetch("/api/comments/admin", { cache: "no-store" });
        if (!res.ok) throw new Error();

        const data = await res.json();
        setComments(data.comments.filter((c: CommentAdminItem) => c.isDeleted));
      } catch {
        setError("Unable to load trashed comments");
      } finally {
        setLoading(false);
      }
    };

    fetchComments();
  }, []);

  /* ---------- Search + Date Sort ---------- */
  const filteredComments = comments
    .filter((c) => {
      const q = search.toLowerCase();
      return (
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.comment.toLowerCase().includes(q) ||
        c.blogSlug.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      const aTime = new Date(a.createdAt).getTime();
      const bTime = new Date(b.createdAt).getTime();
      return dateSort === "asc" ? aTime - bTime : bTime - aTime;
    });

  useEffect(() => {
    setPage(1);
    setSelectedIds([]);
  }, [search, dateSort]);

  /* ---------- Pagination ---------- */
  const totalPages = Math.ceil(filteredComments.length / PER_PAGE);
  const paginatedComments = filteredComments.slice(
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
    const pageIds = paginatedComments.map((c) => c._id);

    if (pageIds.every((id) => selectedIds.includes(id))) {
      setSelectedIds((prev) => prev.filter((id) => !pageIds.includes(id)));
    } else {
      setSelectedIds((prev) => [...new Set([...prev, ...pageIds])]);
    }
  };

  /* ---------- Restore (bulk) ---------- */
  const restoreSelected = async () => {
    if (!selectedIds.length) return;

    try {
      await Promise.all(
        selectedIds.map((id) =>
          fetch(`/api/comments/${id}`, { method: "PATCH" }),
        ),
      );

      setComments((prev) => prev.filter((c) => !selectedIds.includes(c._id)));

      setSelectedIds([]);
      toast.success("Comments restored successfully", successToast);
    } catch {
      toast.error("Failed to restore comments", errorToast);
    }
  };

  const permaDeleteSelected = async () => {
    if (!selectedIds.length) return;

    try {
      await Promise.all(
        selectedIds.map((id) =>
          fetch(`/api/comments/${id}/perma-delete`, {
            method: "DELETE",
          }),
        ),
      );

      setComments((prev) => prev.filter((c) => !selectedIds.includes(c._id)));

      setSelectedIds([]);
      toast.success("Comments permanently deleted", successToast);
    } catch {
      toast.error("Failed to permanently delete comments", errorToast);
    }
  };

  /* ---------- Row restore ---------- */
  const handleRestore = async (id: string) => {
    try {
      await fetch(`/api/comments/${id}`, { method: "PATCH" });
      setComments((prev) => prev.filter((c) => c._id !== id));
      toast.success("Comment restored", successToast);
    } catch {
      toast.error("Restore failed", errorToast);
    }
  };

  const handlePermaDelete = async (id: string) => {
    try {
      await fetch(`/api/comments/${id}/perma-delete`, {
        method: "DELETE",
      });
      setComments((prev) => prev.filter((c) => c._id !== id));
      toast.success("Comment permanently deleted", successToast);
    } catch {
      toast.error("Permanent delete failed", errorToast);
    }
  };

  /* ---------- View ---------- */
  const handleView = (comment: CommentAdminItem) => {
    setViewComment(comment);
  };

  const closeViewModal = () => setViewComment(null);

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
        <span>Loading comments…</span>
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
        <h2>Trashed Comments</h2>
        <p>Manage trashed comments here</p>
      </div>

      <StatusBlock
        total={comments.length}
        active={0}
        today={0}
        deleted={comments.length}
      />

      <ActionRow
        selectedCount={selectedIds.length}
        onRestoreSelected={restoreSelected}
        onPermaDeleteSelected={permaDeleteSelected}
        search={search}
        onSearchChange={setSearch}
        dateSort={dateSort}
        onDateSortChange={setDateSort}
      />

      {!filteredComments.length ? (
        <div className={styles.state}>No trashed comments</div>
      ) : (
        <>
          <CommentsTable
            comments={paginatedComments}
            selectedIds={selectedIds}
            onSelect={toggleSelect}
            onSelectAll={toggleSelectAll}
            onRestore={handleRestore}
            onPermaDelete={handlePermaDelete}
            onView={handleView}
          />

          {totalPages > 1 && (
            <div className={styles.pagination}>
              <button disabled={page === 1} onClick={() => setPage(page - 1)}>
                Prev
              </button>
              <span>
                Page {page} of {totalPages}
              </span>
              <button
                disabled={page === totalPages}
                onClick={() => setPage(page + 1)}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {/* View Comment Modal */}
      {viewComment && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3>Comment by {viewComment.name}</h3>
              <button className={styles.modalClose} onClick={closeViewModal}>
                ×
              </button>
            </div>
            <div className={styles.modalBody}>
              <p>
                <strong>Email:</strong> {viewComment.email}
              </p>
              <p>
                <strong>Blog Slug:</strong> {viewComment.blogSlug}
              </p>
              <p className={styles.commentText}>{viewComment.comment}</p>
              <p>
                <strong>Created:</strong>{" "}
                {new Date(viewComment.createdAt).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
