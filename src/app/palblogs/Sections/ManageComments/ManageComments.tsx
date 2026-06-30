"use client";

import { useEffect, useState } from "react";
import CommentsTable from "./CommentTable";
import ActionRow from "./ActionRow";
import ConfirmDeleteModal from "./ConfirmDeleteModal";
import styles from "./ManageComments.module.css";
import StatusBlock from "./StatusBlock";
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

type StatusFilter = "all" | "active" | "deleted";

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

export default function ManageComments() {
  const [comments, setComments] = useState<CommentAdminItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /* UI state */
  const [search, setSearch] = useState("");
  // Default to active so deleted comments are hidden by default
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("active");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [viewComment, setViewComment] = useState<CommentAdminItem | null>(null); // NEW

  /* Pagination */
  const [page, setPage] = useState(1);

  /* ---------- Fetch comments ---------- */
  useEffect(() => {
    const fetchComments = async () => {
      try {
        const res = await fetch("/api/comments/admin", { cache: "no-store" });
        if (!res.ok) throw new Error();

        const data = await res.json();
        setComments(data.comments);
      } catch {
        setError("Unable to load comments");
      } finally {
        setLoading(false);
      }
    };

    fetchComments();
  }, []);

  /* ---------- Filtering ---------- */
  const filteredComments = comments.filter((c) => {
    const q = search.toLowerCase();
    const matchesSearch =
      c.name.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      c.comment.toLowerCase().includes(q) ||
      c.blogSlug.toLowerCase().includes(q); // include slug in search

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" ? !c.isDeleted : c.isDeleted);

    return matchesSearch && matchesStatus;
  });

  useEffect(() => {
    setPage(1);
    setSelectedIds([]);
  }, [search, statusFilter]);

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

    if (pageIds.length && pageIds.every((id) => selectedIds.includes(id))) {
      setSelectedIds((prev) => prev.filter((id) => !pageIds.includes(id)));
    } else {
      setSelectedIds((prev) => [...new Set([...prev, ...pageIds])]);
    }
  };

  /* ---------- Bulk actions ---------- */
  const applyBulkAction = async () => {
    if (!bulkAction || !selectedIds.length) return;

    if (bulkAction === "delete") {
      setShowDeleteModal(true);
      return;
    }

    setBulkAction("");
  };

  /* ---------- Confirm delete ---------- */
  const confirmDelete = async () => {
    try {
      await Promise.all(
        selectedIds.map((id) =>
          fetch(`/api/comments/${id}`, { method: "DELETE" }),
        ),
      );

      setComments((prev) =>
        prev.map((c) =>
          selectedIds.includes(c._id) ? { ...c, isDeleted: true } : c,
        ),
      );

      toast.success(
        selectedIds.length === 1
          ? "Comment deleted successfully"
          : `${selectedIds.length} comments deleted successfully`,
        successToast,
      );

      setSelectedIds([]);
      setBulkAction("");
    } catch {
      toast.error("Failed to delete comments", errorToast);
    } finally {
      setShowDeleteModal(false);
    }
  };

  /* ---------- Row delete ---------- */
  const handleRowDelete = (id: string) => {
    setSelectedIds([id]);
    setShowDeleteModal(true);
  };

  /* ---------- View comment modal ---------- */
  const handleView = (comment: CommentAdminItem) => {
    setViewComment(comment);
  };

  const closeViewModal = () => setViewComment(null);

  if (loading) {
    return (
      <div className={styles.state}>
        <Lottie
          animationData={loadingAnimation}
          loop={true}
          autoplay={true}
          style={{ width: 100, height: 100 }}
        />
        Loading comments...
      </div>
    );
  }
  if (error)
    return (
      <div className={styles.stateError}>
        Something Went Wrong Contact Support {error}
      </div>
    );

  /* ---------- Render ---------- */
  return (
    <div className={styles.container}>
      <div className={styles.leadsHeader}>
        <h2>Manage Comments</h2>
        <p>Organize comments and manage their status effectively here</p>
      </div>

      {/* Status Block */}
      <StatusBlock
        total={comments.length}
        active={comments.filter((c) => !c.isDeleted).length}
        today={
          comments.filter(
            (c) =>
              new Date(c.createdAt) >=
              new Date(new Date().setHours(0, 0, 0, 0)),
          ).length
        }
        deleted={comments.filter((c) => c.isDeleted).length}
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

      {!filteredComments.length ? (
        <div className={styles.state}>No comments match your filters.</div>
      ) : (
        <>
          <CommentsTable
            comments={paginatedComments}
            selectedIds={selectedIds}
            onSelect={toggleSelect}
            onSelectAll={toggleSelectAll}
            onDelete={handleRowDelete}
            onView={handleView} // Pass view handler
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
                <strong>Blog Slug: </strong>
                <a
                  href={`https://palheights.com/${viewComment.blogSlug}`}
                  target="_blank"
                >
                  {viewComment.blogSlug.length > 25
                    ? `${viewComment.blogSlug.slice(0, 25)}...`
                    : viewComment.blogSlug}
                </a>
              </p>
              <p>
                <strong>Comment:</strong>
              </p>
              <p className={styles.commentText}>{viewComment.comment}</p>
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.closeBtn} onClick={closeViewModal}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
