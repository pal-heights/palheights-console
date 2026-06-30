"use client";

import { useState, useEffect } from "react";
// import dynamic from "next/dynamic";
import Link from "next/link";
import AuthManager from "./AuthManager";
import styles from "./AdminDashboard.module.css";
// import UserManagement from "./UserManagement";
import DashboardPanel from "./DashboardPanel";
import BOEUser from "../../../models/boe/BOEUser"; // Only if needed for SSR, otherwise use fetch
import signUpStyles from "./SignUpPanel.module.css";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { FiDownload } from "react-icons/fi";

// Import the Lead interface from the schema
interface ILead {
  _id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  message: string;
  service: string[]; // Changed to array
  assignedBo: "none" | "BOE1" | "BOE2" | "BOE3" | "BOE4" | "BOE5";
  assignedTo?: string | null; // Allow null for unassigned
  status: "pending" | "assigned" | "completed" | "in progress";
  trash?: boolean;
  verified?: boolean; // Added verified property
  createdAt: string;
  client?: {
    // Making client optional as it's not in the DB schema
    name: string;
    initials: string;
  };
}

type User = {
  _id: string;
  userName: string; // Changed from 'name'
  username?: string;
  email: string;
  phone: string;
  status:
    | "Active"
    | "Inactive"
    | "Pending"
    | "Suspended"
    | "Verified"
    | "active"
    | "inactive"
    | "suspended"
    | "blocked"; // Added backend values
  verified: boolean; // Corrected from isVerified
  isVerified?: boolean; // Added
  createdAt: string; // Changed from 'created'
  requestStatus?:
    | "Pending"
    | "In Progress"
    | "Completed"
    | "pending"
    | "in progress"
    | "completed"
    | "blocked"; // Added
  trash?: boolean; // Added for filtering
  profilePicture?: string; // Added for profile picture
  leadsInitiated?: ILead[]; // Added to hold populated lead data
  assignedLeads?: string[]; // Added to hold assigned lead IDs
};

type BackofficeItem = {
  id: string;
  name: string;
  email: string;
  phone: string;
  assigned: string;
  status: "Completed" | "In Progress" | "Pending" | "On Hold" | "Cancelled";
  isVerified: boolean; // Add this line
  created: string;
};

interface IApplicant {
  _id: string;
  name: string;
  email: string;
  phone: string;
  position: string;
  message: string;
  resume: {
    filename: string;
    mimetype: string;
    size: number;
    url: string;
  };
  appliedAt: string;
}

type Tab =
  | "Leads"
  | "Unverified Leads"
  | "Backoffice"
  | "User Profile"
  | "Lead Details"
  | "Trashed Leads"
  // | "Trashed Users"
  | "Blog Managers"
  | "Applicants"
  | "Admin Management";

// Function to get random BOE assignment
const getRandomBOE = () => {
  const boeOptions = ["BOE1", "BOE2", "BOE3", "BOE4", "BOE5"];
  return boeOptions[Math.floor(Math.random() * boeOptions.length)];
};

function useLogoutWarning() {
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Try to detect refresh (not perfect, but works in most browsers)
      const navEntries = performance.getEntriesByType("navigation");
      const navType =
        (navEntries[0] as PerformanceNavigationTiming)?.type ||
        (performance as any).navigation?.type;
      if (navType === "reload") {
        // Allow refresh without warning
        return;
      }
      e.preventDefault();
      // Most browsers ignore custom messages, but you can set one for legacy support:
      e.returnValue = "Make sure to LOGOUT for security reasons.";
      return "Make sure to LOGOUT for security reasons.";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>("Leads");
  const [mounted, setMounted] = useState(false);
  const [isLeadsLoading, setIsLeadsLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [filterAssigned, setFilterAssigned] = useState<string>("");
  const [showActionMenu, setShowActionMenu] = useState<string | null>(null);
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [selectedBackoffice, setSelectedBackoffice] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [showAuthPopup, setShowAuthPopup] = useState(false);
  const [showMessagePopup, setShowMessagePopup] = useState<string | null>(null);
  const [showAssignedDropdown, setShowAssignedDropdown] = useState<
    string | null
  >(null);
  const [showStatusDropdown, setShowStatusDropdown] = useState<string | null>(
    null,
  );
  const [showUserStatusDropdown, setShowUserStatusDropdown] = useState<
    string | null
  >(null);
  const [showRequestStatusDropdown, setShowRequestStatusDropdown] = useState<
    string | null
  >(null);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [leadAssignments, setLeadAssignments] = useState<{
    [key: string]: string;
  }>({});
  const [leadStatuses, setLeadStatuses] = useState<{ [key: string]: string }>(
    {},
  );
  const [userStatuses, setUserStatuses] = useState<{ [key: string]: string }>(
    {},
  );
  const [requestStatuses, setRequestStatuses] = useState<{
    [key: string]: string;
  }>({});
  const [dropdownPositions, setDropdownPositions] = useState<{
    [key: string]: "up" | "down";
  }>({});
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [profileStatus, setProfileStatus] = useState("Active");
  const [profileRequestStatus, setProfileRequestStatus] = useState("Pending");
  const [leadDetailsStatus, setLeadDetailsStatus] = useState("pending");
  const [leadDetailsAssigned, setLeadDetailsAssigned] = useState("BOE1");
  const [boeUsers, setBoeUsers] = useState<any[]>([]);
  const [showAddBOEForm, setShowAddBOEForm] = useState(false);
  const [boeForm, setBoeForm] = useState({
    username: "",
    email: "",
    password: "",
  });
  const [boeFormError, setBoeFormError] = useState("");
  const [boeFormLoading, setBoeFormLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [leads, setLeads] = useState<ILead[]>([]);
  const [selectedLeadForDetails, setSelectedLeadForDetails] =
    useState<ILead | null>(null);
  const [selectedUserForDetails, setSelectedUserForDetails] =
    useState<User | null>(null);
  const [leadsCurrentPage, setLeadsCurrentPage] = useState(1);
  const [leadsTotalPages, setLeadsTotalPages] = useState(1);
  const [usersCurrentPage, setUsersCurrentPage] = useState(1);
  const [usersTotalPages, setUsersTotalPages] = useState(1);
  const [selectAllUsers, setSelectAllUsers] = useState(false);
  const [userFilterStatus, setUserFilterStatus] = useState<string>("");
  const [userFilterRequestStatus, setUserFilterRequestStatus] =
    useState<string>("");
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [adminUsers, setAdminUsers] = useState<any[]>([]);
  const [showAddAdminForm, setShowAddAdminForm] = useState(false);
  const [adminForm, setAdminForm] = useState({
    username: "",
    email: "",
    password: "",
  });
  const [adminFormError, setAdminFormError] = useState("");
  const [adminFormLoading, setAdminFormLoading] = useState(false);
  const [currentAdminId, setCurrentAdminId] = useState<string | null>(null);
  const [currentAdmin, setCurrentAdmin] = useState<{
    username: string;
    email: string;
  } | null>(null);
  const [blogUsers, setBlogUsers] = useState<any[]>([]);
  const [showAddBlogUserForm, setShowAddBlogUserForm] = useState(false);
  const [blogUserForm, setBlogUserForm] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [blogUserFormError, setBlogUserFormError] = useState("");
  const [blogUserFormLoading, setBlogUserFormLoading] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [selectedBlogUserForPassword, setSelectedBlogUserForPassword] =
    useState<any | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [passwordChangeError, setPasswordChangeError] = useState("");
  const [passwordChangeLoading, setPasswordChangeLoading] = useState(false);
  const [copiedCell, setCopiedCell] = useState<{
    id: string;
    field: string;
  } | null>(null);
  const [showMobileOverlay, setShowMobileOverlay] = useState(false);
  const [initiatedLeads, setInitiatedLeads] = useState<ILead[]>([]);
  const [applicants, setApplicants] = useState<IApplicant[]>([]);
  const [applicantsLoading, setApplicantsLoading] = useState(false);
  const [applicantsSearch, setApplicantsSearch] = useState("");
  const [selectedApplicants, setSelectedApplicants] = useState<string[]>([]);
  const [selectAllApplicants, setSelectAllApplicants] = useState(false);
  const [applicantsSortOrder, setApplicantsSortOrder] = useState<
    "newest" | "oldest"
  >("newest");
  const [showApplicantMsgPopup, setShowApplicantMsgPopup] =
    useState<IApplicant | null>(null);

  useEffect(() => {
    setMounted(true);
    fetchLeads(1); // Fetch all leads initially
    fetchUsers(1); // Fetch all users initially
    fetch("/api/boe/list")
      .then((res) => res.json())
      .then((data) => {
        // Map username to userName for BOE users to match frontend expectations
        const mappedUsers = (data.users || []).map((user: any) => ({
          ...user,
          userName: user.userName || user.username || "Unknown User",
        }));
        setBoeUsers(mappedUsers);
      });

    const checkMobile = () => {
      const isMobile = window.innerWidth < 1024;
      setShowMobileOverlay(isMobile);
      setIsMobile(isMobile);
    };
    window.addEventListener("resize", checkMobile);
    checkMobile();
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    if (selectedUserForDetails) {
      const updatedUser = users.find(
        (u) => u._id === selectedUserForDetails._id,
      );
      if (
        updatedUser &&
        JSON.stringify(updatedUser) !== JSON.stringify(selectedUserForDetails)
      ) {
        setSelectedUserForDetails(updatedUser);
      }
    }
  }, [users, selectedUserForDetails]);

  useEffect(() => {
    if (activeTab === "Unverified Leads") {
      fetchUnverifiedLeads(1); // Always fetch page 1 for unverified leads (no pagination)
    } else if (activeTab === "Leads") {
      fetchLeads(leadsCurrentPage);
    } else if (activeTab === "Trashed Leads") {
      fetchTrashedLeads(leadsCurrentPage);
    }

    // Fetch stats when Leads tab is active
    if (activeTab === "Leads") {
      fetchLeadsStats();
    }
  }, [leadsCurrentPage, activeTab]);

  // useEffect(() => {
  //   if (activeTab === "Trashed Users") {
  //     fetchUsers(usersCurrentPage);
  //   }
  // }, [usersCurrentPage, activeTab]);

  useEffect(() => {
    fetchAdminUsers();
    fetchBlogUsers();
  }, []);

  useEffect(() => {
    if (activeTab === "Applicants") {
      fetchApplicants();
    }
  }, [activeTab]);

  useEffect(() => {
    fetch("/api/admin/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.user && data.user._id) {
          setCurrentAdminId(data.user._id);
        }
      });
  }, []);

  useEffect(() => {
    fetch("/api/admin/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.user) {
          setCurrentAdmin({
            username: data.user.username,
            email: data.user.email,
          });
        }
      });
  }, []);

  const fetchLeads = (page: number) => {
    setIsLeadsLoading(true);
    fetch(
      `/api/lead/list?page=${page}&limit=100&include_trashed=true&verified=true`,
    ) // Fetch only verified leads
      .then((res) => res.json())
      .then((data) => {
        const leadsData = data.leads || [];
        setLeads(leadsData);
        setLeadsTotalPages(data.totalPages || 1);
      })
      .finally(() => setIsLeadsLoading(false));
  };

  const fetchUnverifiedLeads = (page: number) => {
    setIsLeadsLoading(true);
    fetch(
      `/api/lead/list?page=1&limit=10000&include_trashed=true&verified=false`,
    ) // Fetch ALL unverified leads without pagination
      .then((res) => res.json())
      .then((data) => {
        const leadsData = data.leads || [];
        setLeads(leadsData);
        setLeadsTotalPages(1); // Set to 1 since we're not paginating
      })
      .finally(() => setIsLeadsLoading(false));
  };

  // Fetch trashed leads (both verified and unverified)
  const fetchTrashedLeads = (page: number) => {
    setIsLeadsLoading(true);
    fetch(`/api/lead/list?page=${page}&limit=100&include_trashed=true`) // Fetch ALL trashed leads (no verified filter)
      .then((res) => res.json())
      .then((data) => {
        const leadsData = data.leads || [];
        setLeads(leadsData);
        setLeadsTotalPages(data.totalPages || 1);
      })
      .finally(() => setIsLeadsLoading(false));
  };

  // State for stats data
  const [leadsStats, setLeadsStats] = useState<any>(null);
  const [usersStats, setUsersStats] = useState<any>(null);

  // Fetch stats for all verified leads (for Leads tab)
  const fetchLeadsStats = () => {
    fetch(
      `/api/lead/list?page=1&limit=10000&include_trashed=true&verified=true`,
    ) // Fetch ALL verified leads for stats
      .then((res) => res.json())
      .then((data) => {
        const allLeads = data.leads || [];
        const stats = {
          last30Days: allLeads.filter(
            (l: any) =>
              new Date(l.createdAt) >
              new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          ).length,
          thisWeek: allLeads.filter(
            (l: any) =>
              new Date(l.createdAt) >
              new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          ).length,
          total: allLeads.length,
          pending: allLeads.filter((l: any) => l.status === "pending").length,
          pendingThisWeek: allLeads.filter(
            (l: any) =>
              l.status === "pending" &&
              new Date(l.createdAt) >
                new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          ).length,
          pendingThisMonth: allLeads.filter(
            (l: any) =>
              l.status === "pending" &&
              new Date(l.createdAt) >
                new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          ).length,
          assigned: allLeads.filter((l: any) => !!l.assignedTo).length,
          notAssigned: allLeads.filter((l: any) => !l.assignedTo).length,
          completed: allLeads.filter((l: any) => l.status === "completed")
            .length,
          notCompleted: allLeads.filter((l: any) => l.status !== "completed")
            .length,
        };
        setLeadsStats(stats);
      });
  };

  // Fetch stats for all users
  const fetchUsersStats = () => {
    fetch(`/api/user/list?page=1&limit=10000&include_trashed=true`) // Fetch ALL users for stats
      .then((res) => res.json())
      .then((data) => {
        const allUsers = data.users || [];
        const stats = {
          total: allUsers.length,
          newToday: allUsers.filter(
            (u: any) =>
              new Date(u.createdAt) >
              new Date(Date.now() - 24 * 60 * 60 * 1000),
          ).length,
          last30Days: allUsers.filter(
            (u: any) =>
              new Date(u.createdAt) >
              new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          ).length,
          suspended: allUsers.filter(
            (u: any) =>
              u.status === "Suspended" ||
              u.status === "suspended" ||
              u.status === "blocked",
          ).length,
          suspendedToday: allUsers.filter(
            (u: any) =>
              (u.status === "Suspended" ||
                u.status === "suspended" ||
                u.status === "blocked") &&
              new Date(u.createdAt) >
                new Date(Date.now() - 24 * 60 * 60 * 1000),
          ).length,
          suspendedLast30Days: allUsers.filter(
            (u: any) =>
              (u.status === "Suspended" ||
                u.status === "suspended" ||
                u.status === "blocked") &&
              new Date(u.createdAt) >
                new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          ).length,
        };
        setUsersStats(stats);
      });
  };

  const fetchUsers = (page: number) => {
    fetch(`/api/user/list?page=${page}&limit=100&include_trashed=true`) // Fetch all users, including trashed ones
      .then((res) => res.json())
      .then((data) => {
        const usersData = data.users || [];
        setUsers(usersData);
        setUsersTotalPages(data.totalPages || 1);
      });
  };

  const fetchAdminUsers = () => {
    fetch("/api/admin/list")
      .then((res) => res.json())
      .then((data) => setAdminUsers(data.admins || []));
  };

  const fetchBlogUsers = () => {
    fetch("/api/blog-user/list")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setBlogUsers(data.users || []);
        }
      })
      .catch((error) => {
        console.error("Error fetching blog users:", error);
      });
  };

  const fetchApplicants = () => {
    setApplicantsLoading(true);
    fetch("/api/applicants/get")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setApplicants(data.data || []);
        }
      })
      .catch((error) => {
        console.error("Error fetching applicants:", error);
      })
      .finally(() => setApplicantsLoading(false));
  };

  const handleDownloadResume = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error("Network response was not ok");
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(objectUrl);
    } catch (error) {
      console.error("Download failed, opening in new tab:", error);
      window.open(url, "_blank");
    }
  };

  const handleDeleteApplicant = async (id: string) => {
    if (
      !window.confirm(
        "Are you sure you want to permanently delete this applicant?",
      )
    )
      return;
    try {
      const res = await fetch("/api/applicants/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        setApplicants((prev) => prev.filter((a) => a._id !== id));
        setSelectedApplicants((prev) => prev.filter((sid) => sid !== id));
      } else {
        const data = await res.json();
        alert(`Failed to delete: ${data.error || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error deleting applicant:", error);
      alert("Error deleting applicant.");
    }
  };

  const handleApplicantsBulkDownloadCSV = () => {
    const toExport =
      selectedApplicants.length > 0
        ? applicants.filter((a) => selectedApplicants.includes(a._id))
        : applicants;
    if (toExport.length === 0) {
      alert("No applicants to export.");
      return;
    }
    let csv = "data:text/csv;charset=utf-8,";
    csv +=
      "Name,Email,Phone,Position,Message,Resume Filename,Resume URL,Applied At\r\n";
    toExport.forEach((a) => {
      csv += `"${a.name}","${a.email}","${a.phone}","${a.position}","${(a.message || "").replace(/"/g, '""')}","${a.resume.filename}","${a.resume.url}","${formatDate(a.appliedAt)}"\r\n`;
    });
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csv));
    link.setAttribute("download", "applicants_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setSelectedApplicants([]);
  };

  const renderApplicantsTab = () => {
    const now = Date.now();
    const last30Days = applicants.filter(
      (a) => new Date(a.appliedAt) > new Date(now - 30 * 24 * 60 * 60 * 1000),
    ).length;
    const thisWeek = applicants.filter(
      (a) => new Date(a.appliedAt) > new Date(now - 7 * 24 * 60 * 60 * 1000),
    ).length;
    const today = applicants.filter(
      (a) => new Date(a.appliedAt) > new Date(now - 24 * 60 * 60 * 1000),
    ).length;

    const positionCounts: { [key: string]: number } = {};
    applicants.forEach((a) => {
      positionCounts[a.position] = (positionCounts[a.position] || 0) + 1;
    });
    const topPosition =
      Object.entries(positionCounts).sort((x, y) => y[1] - x[1])[0]?.[0] || "—";

    const filtered = applicants
      .filter((a) => {
        const q = applicantsSearch.toLowerCase().trim();
        if (!q) return true;
        return (
          a.name.toLowerCase().includes(q) ||
          a.email.toLowerCase().includes(q) ||
          a.phone.includes(q) ||
          a.position.toLowerCase().includes(q) ||
          (a.message || "").toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        const ta = new Date(a.appliedAt).getTime();
        const tb = new Date(b.appliedAt).getTime();
        return applicantsSortOrder === "newest" ? tb - ta : ta - tb;
      });

    if (applicantsLoading) {
      return (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "400px",
            width: "100%",
            gap: "16px",
          }}
        >
          <div style={{ width: "120px", height: "120px" }}>
            <DotLottieReact src="/loading.lottie" loop autoplay />
          </div>
          <p style={{ fontSize: "1rem", fontWeight: 500, color: "#64748b" }}>
            Fetching applicants...
          </p>
        </div>
      );
    }

    return (
      <div className={styles.leadsContainer}>
        {/* Header */}
        <div
          className={styles.leadsHeader}
          style={
            isMobile
              ? {
                  flexDirection: "column",
                  alignItems: "flex-start",
                  gap: "1rem",
                }
              : {}
          }
        >
          <div className={styles.headerLeft}>
            <h2>Applicants</h2>
            <p>Manage career applications submitted through the careers form</p>
          </div>
          <div className={styles.headerRight}>
            <button
              className={styles.exportBtn}
              onClick={handleApplicantsBulkDownloadCSV}
            >
              Export All
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7,10 12,15 17,10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
            </button>
          </div>
        </div>

        {/* Stats */}
        <div
          className={styles.statsContainer}
          style={isMobile ? { gridTemplateColumns: "1fr", gap: "1rem" } : {}}
        >
          <div className={styles.statCard}>
            <div className={styles.statHeader}>
              <span className={styles.statTitle}>
                APPLICATIONS (LAST 30 DAYS)
              </span>
              <div
                className={styles.statIcon}
                style={{ backgroundColor: "#3b82f6" }}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
            </div>
            <div className={styles.statMainValue}>{last30Days}</div>
            <div className={styles.statSubLine}>
              <div>
                <span className={styles.statSubLabel}>This Week: </span>
                <span className={styles.statSubValue}>{thisWeek}</span>
              </div>
              <div>
                <span
                  className={styles.statSubLabel}
                  style={{ marginLeft: "24px" }}
                >
                  Total:{" "}
                </span>
                <span className={styles.statSubValue}>{applicants.length}</span>
              </div>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statHeader}>
              <span className={styles.statTitle}>TODAY</span>
              <div
                className={styles.statIcon}
                style={{ backgroundColor: "#10b981" }}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              </div>
            </div>
            <div className={styles.statMainValue}>{today}</div>
            <div className={styles.statSubLine}>
              <div>
                <span className={styles.statSubLabel}>New Today</span>
              </div>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statHeader}>
              <span className={styles.statTitle}>TOP POSITION</span>
              <div
                className={styles.statIcon}
                style={{ backgroundColor: "#6f42c1" }}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                  <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
                </svg>
              </div>
            </div>
            <div
              className={styles.statMainValue}
              style={{ fontSize: "1.1rem" }}
            >
              {topPosition}
            </div>
            <div className={styles.statSubLine}>
              <div>
                <span className={styles.statSubLabel}>Most Applied For</span>
              </div>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statHeader}>
              <span className={styles.statTitle}>TOTAL APPLICANTS</span>
              <div
                className={styles.statIcon}
                style={{ backgroundColor: "#f59e0b" }}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                  <polyline points="10 9 9 9 8 9" />
                </svg>
              </div>
            </div>
            <div className={styles.statMainValue}>{applicants.length}</div>
            <div className={styles.statSubLine}>
              <div>
                <span className={styles.statSubLabel}>All Time</span>
              </div>
            </div>
          </div>
        </div>

        {/* Table Controls */}
        <div
          className={styles.tableControls}
          style={isMobile ? { flexDirection: "column", gap: "1rem" } : {}}
        >
          <div className={styles.leftControls}>
            <button
              className={styles.bulkBtn}
              style={{ color: "#10b981", borderColor: "#10b981" }}
              onClick={handleApplicantsBulkDownloadCSV}
              disabled={selectedApplicants.length === 0}
            >
              Download CSV
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7,10 12,15 17,10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
            </button>
          </div>
          <div
            className={styles.rightControls}
            style={isMobile ? { width: "100%" } : {}}
          >
            <input
              type="text"
              placeholder="Search applicants..."
              className={styles.searchInput}
              value={applicantsSearch}
              onChange={(e) => setApplicantsSearch(e.target.value)}
            />
            <div className={styles.filterContainer}>
              <span className={styles.filterLabel}>Sort :</span>
              <select
                className={styles.filterDropdown}
                value={applicantsSortOrder}
                onChange={(e) =>
                  setApplicantsSortOrder(e.target.value as "newest" | "oldest")
                }
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
              </select>
            </div>
          </div>
        </div>

        <div className={styles.scrollGuide}>
          <span className={styles.scrollText}>
            Scroll right using SHIFT + Mouse Wheel or Trackpad
          </span>
        </div>

        {/* Table */}
        <div className={styles.tableContainer}>
          <table className={styles.leadsTable}>
            <thead>
              <tr>
                <th>
                  <input
                    type="checkbox"
                    className={styles.checkbox}
                    checked={selectAllApplicants}
                    onChange={() => {
                      if (selectAllApplicants) {
                        setSelectedApplicants([]);
                      } else {
                        setSelectedApplicants(filtered.map((a) => a._id));
                      }
                      setSelectAllApplicants(!selectAllApplicants);
                    }}
                  />
                </th>
                <th>Applicant</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Position</th>
                <th>Message</th>
                <th>Resume</th>
                <th>Applied At</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    style={{
                      textAlign: "center",
                      padding: "40px",
                      color: "#6b7280",
                    }}
                  >
                    No applicants found.
                  </td>
                </tr>
              ) : (
                filtered.map((applicant) => (
                  <tr key={applicant._id}>
                    <td data-label="Select">
                      <input
                        type="checkbox"
                        className={styles.checkbox}
                        checked={selectedApplicants.includes(applicant._id)}
                        onChange={() => {
                          if (selectedApplicants.includes(applicant._id)) {
                            setSelectedApplicants((prev) =>
                              prev.filter((id) => id !== applicant._id),
                            );
                          } else {
                            setSelectedApplicants((prev) => [
                              ...prev,
                              applicant._id,
                            ]);
                          }
                        }}
                      />
                    </td>
                    <td className={styles.customerCell} data-label="Applicant">
                      <div className={styles.avatar}>
                        {applicant.name
                          .split(" ")
                          .map((n: string) => n[0])
                          .join("")
                          .toUpperCase()
                          .slice(0, 2)}
                      </div>
                      {applicant.name}
                    </td>
                    <td
                      className={styles.emailCell}
                      onClick={() => handleEmailClick(applicant.email)}
                      style={{ cursor: "pointer", color: "#2563eb" }}
                      data-label="Email"
                    >
                      {applicant.email}
                    </td>
                    <td
                      onClick={() => {
                        if (!applicant.phone) return;
                        handlePhoneClick(applicant.phone);
                      }}
                      style={{
                        cursor: applicant.phone ? "pointer" : "default",
                        color: applicant.phone ? "#2563eb" : "#6b7280",
                      }}
                      data-label="Phone"
                    >
                      {applicant.phone || "—"}
                    </td>
                    <td data-label="Position">
                      <span
                        style={{
                          background: "#ede9fe",
                          color: "#6d28d9",
                          borderRadius: "6px",
                          padding: "2px 10px",
                          fontWeight: 500,
                          fontSize: "0.85rem",
                        }}
                      >
                        {applicant.position}
                      </span>
                    </td>
                    <td data-label="Message">
                      {applicant.message ? (
                        <button
                          onClick={() => setShowApplicantMsgPopup(applicant)}
                          style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            color: "#6b7280",
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                            padding: 0,
                            fontSize: "inherit",
                          }}
                          title={applicant.message}
                        >
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                          </svg>
                          View
                        </button>
                      ) : (
                        <span style={{ color: "#9ca3af" }}>None</span>
                      )}
                    </td>
                    <td data-label="Resume">
                      <button
                        onClick={() =>
                          handleDownloadResume(
                            applicant.resume.url,
                            applicant.resume.filename,
                          )
                        }
                        className={styles.actionIcon}
                        style={{
                          color: "#3b82f6",
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                          padding: "4px 10px",
                          border: "1px solid #3b82f6",
                          borderRadius: "6px",
                          background: "rgba(59,130,246,0.06)",
                          cursor: "pointer",
                          fontWeight: 500,
                          fontSize: "0.82rem",
                          whiteSpace: "nowrap",
                        }}
                        title={`Download ${applicant.resume.filename}`}
                      >
                        <FiDownload size={14} />
                        Download
                      </button>
                    </td>
                    <td data-label="Applied At">
                      {formatDate(applicant.appliedAt)}
                    </td>
                    <td data-label="Action">
                      <button
                        onClick={() => handleDeleteApplicant(applicant._id)}
                        className={styles.actionIcon}
                        style={{ color: "#ef4444" }}
                        title="Delete Applicant"
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="#ef4444"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="3,6 5,6 21,6" />
                          <path d="m19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2" />
                          <line x1="10" y1="11" x2="10" y2="17" />
                          <line x1="14" y1="11" x2="14" y2="17" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;

      // Check if click is outside dropdown areas
      if (!target.closest(".dropdown-container")) {
        setShowAssignedDropdown(null);
        setShowStatusDropdown(null);
        setShowUserStatusDropdown(null);
        setShowRequestStatusDropdown(null);
        setShowActionMenu(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // To display service in initiated leads
  const user = selectedUserForDetails;
  useEffect(() => {
    if (user && user.leadsInitiated && user.leadsInitiated.length > 0) {
      const leadIds = user.leadsInitiated.map((l: any) =>
        typeof l === "string" ? l : l._id,
      );
      fetch(`/api/lead/listByIds?ids=${leadIds.join(",")}`)
        .then((res) => res.json())
        .then((data) => {
          setInitiatedLeads(data.leads || []);
        });
    } else {
      setInitiatedLeads([]);
    }
  }, [user]);

  useLogoutWarning();

  if (!mounted) {
    return null;
  }

  const handleExport = (type: "leads" | "users") => {
    if (type === "leads") {
      const leadsToExport = leads.filter((lead) => !lead.trash);
      if (leadsToExport.length === 0) {
        alert("No active leads to export.");
        return;
      }
      let csvContent = "data:text/csv;charset=utf-8,";
      csvContent +=
        "Lead ID,Full Name,Email,Phone Number,Message,Service,Assigned To,Status,Created At\r\n";
      leadsToExport.forEach((lead) => {
        const assignedUser =
          boeUsers.find((u) => u._id === lead.assignedTo)?.userName || "None";
        const service = Array.isArray(lead.service)
          ? lead.service.join("; ")
          : lead.service;
        csvContent += `${lead._id},${lead.fullName},${lead.email},${
          lead.phoneNumber
        },"${lead.message}","${service}",${assignedUser},${
          lead.status
        },${formatDate(lead.createdAt)}\r\n`;
      });
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", "active_leads.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else if (type === "users") {
      const usersToExport = users.filter((user) => !user.trash);
      if (usersToExport.length === 0) {
        alert("No active users to export.");
        return;
      }
      let csvContent = "data:text/csv;charset=utf-8,";
      csvContent +=
        "Verified,User ID,Name,Email,Status,Request Status,Total Leads,Created At\r\n";
      usersToExport.forEach((user) => {
        // Request Status: Service:Status for each lead
        let requestStatus = "";
        if (user.leadsInitiated && user.leadsInitiated.length > 0) {
          requestStatus = user.leadsInitiated
            .map((l) => {
              let service = "";
              if (Array.isArray(l.service)) {
                service = l.service.length > 0 ? l.service.join("; ") : "";
              } else if (typeof l.service === "string") {
                if ((l.service as string).trim() !== "") {
                  service = l.service as string;
                }
              }
              if (!service) {
                service = l._id || "Unknown";
              }
              return `${service}:${l.status}`;
            })
            .join(" | ");
        }
        csvContent += `${user.verified ? "Yes" : "No"},${user._id},${
          user.userName
        },${user.email},${user.status},"${requestStatus}",${
          user.leadsInitiated ? user.leadsInitiated.length : 0
        },${formatDate(user.createdAt)}\r\n`;
      });
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", "active_users.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleBulkAction = async (
    action: "trash" | "download" | "restore" | "deletePermanently",
    type: "leads" | "users",
  ) => {
    const selectedIds = type === "leads" ? selectedLeads : selectedUsers;
    if (selectedIds.length === 0) {
      alert(
        `Please select at least one ${type === "leads" ? "lead" : "user"}.`,
      );
      return;
    }

    if (type === "leads") {
      if (action === "trash") {
        try {
          const res = await fetch("/api/lead/bulk-update", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ leadIds: selectedIds, action: "trash" }),
          });
          if (res.ok) {
            setLeads((prev) =>
              prev.map((l) =>
                selectedIds.includes(l._id) ? { ...l, trash: true } : l,
              ),
            );
            setSelectedLeads([]);
          }
        } catch (error) {
          console.error("Failed to bulk trash leads", error);
        }
      } else if (action === "restore") {
        try {
          const res = await fetch("/api/lead/bulk-update", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              leadIds: selectedIds,
              updates: { trash: false },
            }),
          });
          if (res.ok) {
            setLeads((prev) =>
              prev.map((l) =>
                selectedIds.includes(l._id) ? { ...l, trash: false } : l,
              ),
            );
            setSelectedLeads([]);
          }
        } catch (error) {
          console.error(`Failed to bulk ${action} leads`, error);
        }
      } else if (action === "deletePermanently") {
        try {
          const res = await fetch("/api/lead/bulk-update", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ leadIds: selectedIds }),
          });
          if (res.ok) {
            setLeads((prev) =>
              prev.filter((l) => !selectedIds.includes(l._id)),
            );
            setSelectedLeads([]);
            alert("Leads deleted successfully");
          }
        } catch (error) {
          console.error("Failed to bulk delete leads permanently", error);
        }
      } else if (action === "download") {
        const leadsToDownload = leads.filter((lead) =>
          selectedIds.includes(lead._id),
        );
        let csvContent = "data:text/csv;charset=utf-8,";
        csvContent +=
          "Lead ID,Full Name,Email,Phone Number,Message,Service,Assigned To,Status,Created At\r\n";
        leadsToDownload.forEach((lead) => {
          const assignedUser =
            boeUsers.find((u) => u._id === lead.assignedTo)?.userName || "None";
          const service = Array.isArray(lead.service)
            ? lead.service.join("; ")
            : lead.service;
          csvContent += `${lead._id},${lead.fullName},${lead.email},${
            lead.phoneNumber
          },"${lead.message}","${service}",${assignedUser},${
            lead.status
          },${formatDate(lead.createdAt)}\r\n`;
        });
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "leads_export.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } else if (type === "users") {
      if (action === "trash") {
        try {
          const res = await fetch("/api/user/bulk-update", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userIds: selectedIds, action: "trash" }),
          });
          if (res.ok) {
            setUsers((prev) =>
              prev.map((u) =>
                selectedIds.includes(u._id) ? { ...u, trash: true } : u,
              ),
            );
            setSelectedUsers([]);
          }
        } catch (error) {
          console.error("Failed to bulk trash users", error);
        }
      } else if (action === "restore") {
        try {
          const res = await fetch("/api/user/bulk-update", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userIds: selectedIds,
              updates: { trash: false },
            }),
          });
          if (res.ok) {
            setUsers((prev) =>
              prev.map((u) =>
                selectedIds.includes(u._id) ? { ...u, trash: false } : u,
              ),
            );
            setSelectedUsers([]);
          }
        } catch (error) {
          console.error(`Failed to bulk ${action} users`, error);
        }
      } else if (action === "deletePermanently") {
        try {
          const res = await fetch("/api/user/permanent-delete", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userIds: selectedIds }),
          });
          if (res.ok) {
            setUsers((prev) =>
              prev.filter((u) => !selectedIds.includes(u._id)),
            );
            setSelectedUsers([]);
          }
        } catch (error) {
          console.error("Failed to bulk delete users permanently", error);
        }
      } else if (action === "download") {
        const usersToDownload = users.filter((user) =>
          selectedIds.includes(user._id),
        );
        let csvContent = "data:text/csv;charset=utf-8,";
        csvContent +=
          "Verified,User ID,Name,Email,Status,Request Status,Total Leads,Created At\r\n";
        usersToDownload.forEach((user) => {
          let requestStatus = "";
          if (user.leadsInitiated && user.leadsInitiated.length > 0) {
            requestStatus = user.leadsInitiated
              .map((l) => {
                let service = "";
                if (Array.isArray(l.service)) {
                  service = l.service.length > 0 ? l.service.join("; ") : "";
                } else if (typeof l.service === "string") {
                  if ((l.service as string).trim() !== "") {
                    service = l.service as string;
                  }
                }
                if (!service) {
                  service = l._id || "Unknown";
                }
                return `${service}:${l.status}`;
              })
              .join(" | ");
          }
          csvContent += `${user.verified ? "Yes" : "No"},${user._id},${
            user.userName
          },${user.email},${user.status},"${requestStatus}",${
            user.leadsInitiated ? user.leadsInitiated.length : 0
          },${formatDate(user.createdAt)}\r\n`;
        });
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "users_export.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    }

    setShowBulkActions(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Customer":
        return "#10b981";
      case "Qualified":
        return "#f59e0b";
      case "Working":
        return "#3b82f6";
      case "Contacted":
        return "#8b5cf6";
      case "Proposal Sent":
        return "#ef4444";
      case "Active":
        return "#10b981";
      case "Verified":
        return "#059669";
      case "Inactive":
        return "#6b7280";
      case "Pending":
        return "#ef4444"; // Red for pending
      case "Suspended":
        return "#ef4444";
      case "Completed":
        return "#10b981"; // Green for completed
      case "In Progress":
        return "#f59e0b"; // Yellow for in progress
      case "On Hold":
        return "#f59e0b";
      case "Cancelled":
        return "#ef4444";
      case "pending":
        return "#ef4444"; // Red for pending
      case "assigned":
        return "#3b82f6";
      case "completed":
        return "#10b981"; // Green for completed
      case "in progress":
        return "#f59e0b"; // Yellow for in progress
      default:
        return "#6b7280";
    }
  };

  const handleActionClick = (leadId: string, action: string) => {
    console.log(`Action ${action} clicked for lead ${leadId}`);
    setShowActionMenu(null);
    // Handle the action logic here
  };

  const handleSelectAll = (leadsToSelect: ILead[]) => {
    if (selectAll) {
      setSelectedLeads([]);
    } else {
      setSelectedLeads(leadsToSelect.map((lead) => lead._id));
    }
    setSelectAll(!selectAll);
  };

  const handleSelectLead = (leadId: string) => {
    if (selectedLeads.includes(leadId)) {
      setSelectedLeads(selectedLeads.filter((id) => id !== leadId));
    } else {
      setSelectedLeads([...selectedLeads, leadId]);
    }
  };

  const handleAssignmentChange = async (
    leadId: string,
    assignedToId: string | null,
  ) => {
    // If assignedToId is null, unassign the lead from any BO user
    const updates: Partial<ILead> = {
      assignedTo: assignedToId === "" ? null : assignedToId,
    };
    if (assignedToId) {
      updates.status = "in progress";
    }

    try {
      const res = await fetch("/api/lead/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId, updates }),
      });
      if (res.ok) {
        const updatedLead = await res.json();
        setLeads((prev) =>
          prev.map((l) =>
            l._id === leadId
              ? {
                  ...l,
                  assignedTo: assignedToId === "" ? null : assignedToId,
                  status: assignedToId ? "in progress" : "pending",
                }
              : l,
          ),
        );
        setShowAssignedDropdown(null);
      }
    } catch (error) {
      console.error("Failed to update lead assignment", error);
    }
  };

  const handleStatusChange = (leadId: string, status: string) => {
    setLeadStatuses((prev) => ({ ...prev, [leadId]: status }));
    setShowStatusDropdown(null);
  };

  const handleAssignmentDropdownClick = (
    e: React.MouseEvent,
    leadId: string,
  ) => {
    e.preventDefault();
    e.stopPropagation();
    setShowStatusDropdown(null); // Close status dropdown if open
    setShowAssignedDropdown(showAssignedDropdown === leadId ? null : leadId);
  };

  const handleStatusDropdownClick = (e: React.MouseEvent, leadId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setShowAssignedDropdown(null); // Close assigned dropdown if open
    setShowStatusDropdown(showStatusDropdown === leadId ? null : leadId);
  };

  const handleAssignmentChangeWithEvent = (
    e: React.MouseEvent,
    leadId: string,
    assignment: string,
  ) => {
    e.preventDefault();
    e.stopPropagation();
    setLeadAssignments((prev) => ({ ...prev, [leadId]: assignment }));
    setShowAssignedDropdown(null);
  };

  const handleStatusChangeWithEvent = (
    e: React.MouseEvent,
    leadId: string,
    status: string,
  ) => {
    e.preventDefault();
    e.stopPropagation();
    setLeadStatuses((prev) => ({ ...prev, [leadId]: status }));
    setShowStatusDropdown(null);
  };

  const handleUserStatusDropdownClick = (
    e: React.MouseEvent,
    userId: string,
  ) => {
    e.preventDefault();
    e.stopPropagation();
    setShowRequestStatusDropdown(null); // Close request status dropdown if open
    setShowUserStatusDropdown(
      showUserStatusDropdown === userId ? null : userId,
    );
  };

  const handleRequestStatusDropdownClick = (
    e: React.MouseEvent,
    userId: string,
  ) => {
    e.preventDefault();
    e.stopPropagation();
    setShowUserStatusDropdown(null); // Close user status dropdown if open
    setShowRequestStatusDropdown(
      showRequestStatusDropdown === userId ? null : userId,
    );
  };

  const handleUserStatusChangeWithEvent = (
    e: React.MouseEvent,
    userId: string,
    status: string,
  ) => {
    e.preventDefault();
    e.stopPropagation();
    setUserStatuses((prev) => ({ ...prev, [userId]: status }));
    setShowUserStatusDropdown(null);
  };

  const handleRequestStatusChangeWithEvent = (
    e: React.MouseEvent,
    userId: string,
    status: string,
  ) => {
    e.preventDefault();
    e.stopPropagation();
    setRequestStatuses((prev) => ({ ...prev, [userId]: status }));
    setShowRequestStatusDropdown(null);
  };

  const handleEmailClick = (email: string) => {
    window.location.href = `mailto:${email}`;
  };

  const handlePhoneClick = (phone: string) => {
    window.location.href = `tel:${phone}`;
  };

  const updateLead = async (leadId: string, updates: Partial<ILead>) => {
    try {
      const res = await fetch("/api/lead/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId, updates }),
      });
      if (res.ok) {
        // Refetch leads based on active tab to get the latest data
        if (activeTab === "Unverified Leads") {
          fetchUnverifiedLeads(1);
        } else if (activeTab === "Trashed Leads") {
          fetchTrashedLeads(leadsCurrentPage);
        } else {
          fetchLeads(leadsCurrentPage);
        }
      }
    } catch (error) {
      console.error("Failed to update lead", error);
    }
  };

  const handleActionIconClick = async (leadId: string, action: string) => {
    if (action === "delete") {
      updateLead(leadId, { trash: true });
    } else if (action === "view") {
      const leadToView = leads.find((l) => l._id === leadId);
      if (leadToView) {
        setSelectedLeadForDetails(leadToView);
        setActiveTab("Lead Details");
      }
    } else if (action === "download") {
      const leadToDownload = leads.find((l) => l._id === leadId);
      if (leadToDownload) {
        const csvContent =
          "data:text/csv;charset=utf-8," +
          "FullName,Email,PhoneNumber,Message\n" +
          `${leadToDownload.fullName},${leadToDownload.email},${leadToDownload.phoneNumber},"${leadToDownload.message}"`;
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `lead_${leadToDownload._id}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    }
    setShowActionMenu(null);
  };

  const handleSelectAllUsersClick = (usersToSelect: User[]) => {
    if (selectAllUsers) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(usersToSelect.map((user) => user._id));
    }
    setSelectAllUsers(!selectAllUsers);
  };

  const handleSelectUser = (userId: string) => {
    if (selectedUsers.includes(userId)) {
      setSelectedUsers(selectedUsers.filter((id) => id !== userId));
    } else {
      setSelectedUsers([...selectedUsers, userId]);
    }
  };

  const handleSelectBackoffice = (itemId: string) => {
    if (selectedBackoffice.includes(itemId)) {
      setSelectedBackoffice(selectedBackoffice.filter((id) => id !== itemId));
    } else {
      setSelectedBackoffice([...selectedBackoffice, itemId]);
    }
  };

  const updateUser = async (userId: string, updates: Partial<User>) => {
    try {
      const res = await fetch("/api/user/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, updates }),
      });

      if (res.ok) {
        // Refetch users to get the latest data
        fetchUsers(usersCurrentPage);
      } else {
        console.error("Failed to update user");
      }
    } catch (error) {
      console.error("Error updating user:", error);
    }
  };

  const handleTrashUser = (userId: string) => {
    updateUser(userId, { trash: true });
  };

  const handleRestoreUser = (userId: string) => {
    updateUser(userId, { trash: false });
  };

  const handlePermanentDeleteUser = async (userId: string) => {
    if (
      !window.confirm("Are you sure you want to permanently delete this user?")
    )
      return;
    try {
      const res = await fetch("/api/user/permanent-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (res.ok) {
        setUsers((prev) => prev.filter((u) => u._id !== userId));
      } else {
        console.error("Failed to permanently delete user");
      }
    } catch (error) {
      console.error("Error permanently deleting user:", error);
    }
  };

  const handleBlockUser = (userId: string) => {
    if (window.confirm("Are you sure you want to block this user?")) {
      updateUser(userId, { status: "blocked" });
    }
  };

  // Helper function to format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  // Helper function to check if BOE user has assigned leads
  const hasAssignedLeads = (user: any): boolean => {
    return (
      user.assignedLeads &&
      Array.isArray(user.assignedLeads) &&
      user.assignedLeads.length > 0
    );
  };

  const renderLeadsTab = (isTrashed = false, isUnverified = false) => {
    const tabLeads = leads.filter((lead) => !!lead.trash === isTrashed);

    if (isLeadsLoading) {
      return (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "400px",
            width: "100%",
            gap: "16px",
          }}
        >
          <div style={{ width: "120px", height: "120px" }}>
            <DotLottieReact src="/loading.lottie" loop autoplay />
          </div>
          <p style={{ fontSize: "1rem", fontWeight: 500, color: "#64748b" }}>
            Fetching leads...
          </p>
        </div>
      );
    }

    // Use stats data if available (for Leads tab), otherwise calculate from paginated data
    const stats =
      activeTab === "Leads" && leadsStats
        ? leadsStats
        : {
            last30Days: tabLeads.filter(
              (l) =>
                new Date(l.createdAt) >
                new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            ).length,
            thisWeek: tabLeads.filter(
              (l) =>
                new Date(l.createdAt) >
                new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            ).length,
            total: tabLeads.length,
            pending: tabLeads.filter((l) => l.status === "pending").length,
            pendingThisWeek: tabLeads.filter(
              (l) =>
                l.status === "pending" &&
                new Date(l.createdAt) >
                  new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            ).length,
            pendingThisMonth: tabLeads.filter(
              (l) =>
                l.status === "pending" &&
                new Date(l.createdAt) >
                  new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            ).length,
            assigned: tabLeads.filter((l) => !!l.assignedTo).length,
            notAssigned: tabLeads.filter((l) => !l.assignedTo).length,
            completed: tabLeads.filter((l) => l.status === "completed").length,
            notCompleted: tabLeads.filter((l) => l.status !== "completed")
              .length,
          };

    return (
      <div className={styles.leadsContainer}>
        <div
          className={styles.leadsHeader}
          style={
            isMobile
              ? {
                  flexDirection: "column",
                  alignItems: "flex-start",
                  gap: "1rem",
                }
              : {}
          }
        >
          <div className={styles.headerLeft}>
            <h2>{isTrashed ? "Trashed Leads" : "Leads Management"}</h2>
            <p>
              {isTrashed
                ? "Review and manage trashed leads"
                : "Organize leads and track their progress effectively here"}
            </p>
          </div>
          <div className={styles.headerRight}>
            {!isTrashed && (
              <button
                className={styles.exportBtn}
                onClick={() => handleExport("leads")}
              >
                Export All
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7,10 12,15 17,10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
              </button>
            )}
          </div>
        </div>

        <div
          className={styles.statsContainer}
          style={isMobile ? { gridTemplateColumns: "1fr", gap: "1rem" } : {}}
        >
          <div className={styles.statCard}>
            <div className={styles.statHeader}>
              <span className={styles.statTitle}>LEADS (LAST 30 DAYS)</span>
              <div
                className={styles.statIcon}
                style={{ backgroundColor: "#3b82f6" }}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
            </div>
            <div className={styles.statMainValue}>{stats.last30Days}</div>
            <div className={styles.statSubLine}>
              <div>
                <span className={styles.statSubLabel}>This Week: </span>
                <span className={styles.statSubValue}>{stats.thisWeek}</span>
              </div>
              <div>
                <span
                  className={styles.statSubLabel}
                  style={{ marginLeft: "24px" }}
                >
                  Total Leads:{" "}
                </span>
                <span className={styles.statSubValue}>{stats.total}</span>
              </div>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statHeader}>
              <span className={styles.statTitle}>PENDING</span>
              <div
                className={styles.statIcon}
                style={{ backgroundColor: "#f59e0b" }}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12,6 12,12 16,14" />
                </svg>
              </div>
            </div>
            <div className={styles.statMainValue}>{stats.pending}</div>
            <div className={styles.statSubLine}>
              <div>
                <span className={styles.statSubLabel}>This Week: </span>
                <span className={styles.statSubValue}>
                  {stats.pendingThisWeek}
                </span>
              </div>
              <div>
                <span
                  className={styles.statSubLabel}
                  style={{ marginLeft: "24px" }}
                >
                  This Month:{" "}
                </span>
                <span className={styles.statSubValue}>
                  {stats.pendingThisMonth}
                </span>
              </div>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statHeader}>
              <span className={styles.statTitle}>ASSIGNED</span>
              <div
                className={styles.statIcon}
                style={{ backgroundColor: "#6f42c1" }}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="3" y="4" width="18" height="16" rx="2" ry="2"></rect>
                  <line x1="8" y1="8" x2="16" y2="8"></line>
                  <line x1="8" y1="12" x2="16" y2="12"></line>
                  <line x1="8" y1="16" x2="16" y2="16"></line>
                  <circle cx="5" cy="8" r="1"></circle>
                  <circle cx="5" cy="12" r="1"></circle>
                  <circle cx="5" cy="16" r="1"></circle>
                </svg>
              </div>
            </div>
            <div className={styles.statMainValue}>{stats.assigned}</div>
            <div className={styles.statSubLine}>
              <div>
                <span className={styles.statSubLabel}>Not Assigned: </span>
                <span className={styles.statSubValue}>{stats.notAssigned}</span>
              </div>
              <div>
                <span
                  className={styles.statSubLabel}
                  style={{ marginLeft: "24px" }}
                >
                  Total:{" "}
                </span>
                <span className={styles.statSubValue}>{stats.total}</span>
              </div>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statHeader}>
              <span className={styles.statTitle}>COMPLETED</span>
              <div
                className={styles.statIcon}
                style={{ backgroundColor: "#10b981" }}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22,4 12,14.01 9,11.01"></polyline>
                </svg>
              </div>
            </div>
            <div className={styles.statMainValue}>{stats.completed}</div>
            <div className={styles.statSubLine}>
              <div>
                <span className={styles.statSubLabel}>Not Completed: </span>
                <span className={styles.statSubValue}>
                  {stats.notCompleted}
                </span>
              </div>
              <div>
                <span
                  className={styles.statSubLabel}
                  style={{ marginLeft: "24px" }}
                >
                  Total:{" "}
                </span>
                <span className={styles.statSubValue}>{stats.total}</span>
              </div>
            </div>
          </div>
        </div>

        <div
          className={styles.tableControls}
          style={isMobile ? { flexDirection: "column", gap: "1rem" } : {}}
        >
          <div className={styles.leftControls}>
            {isTrashed ? (
              <>
                <button
                  className={styles.bulkBtn}
                  onClick={() => handleBulkAction("restore", "leads")}
                  disabled={selectedLeads.length <= 1}
                >
                  Restore
                </button>
                <button
                  className={styles.bulkBtn}
                  onClick={() => handleBulkAction("deletePermanently", "leads")}
                  disabled={selectedLeads.length <= 1}
                >
                  Delete Permanently
                </button>
              </>
            ) : (
              <>
                <button
                  className={styles.bulkBtn}
                  style={{ color: "#ef4444", borderColor: "#ef4444" }}
                  onClick={() => handleBulkAction("trash", "leads")}
                  disabled={selectedLeads.length === 0}
                >
                  Trash
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="3,6 5,6 21,6" />
                    <path d="m19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2" />
                    <line x1="10" y1="11" x2="10" y2="17" />
                    <line x1="14" y1="11" x2="14" y2="17" />
                  </svg>
                </button>
                <button
                  className={styles.bulkBtn}
                  style={{ color: "#10b981", borderColor: "#10b981" }}
                  onClick={() => handleBulkAction("download", "leads")}
                  disabled={selectedLeads.length === 0}
                >
                  Download
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7,10 12,15 17,10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                </button>
              </>
            )}
          </div>
          <div
            className={styles.rightControls}
            style={isMobile ? { width: "100%" } : {}}
          >
            <input
              type="text"
              placeholder="Search..."
              className={styles.searchInput}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <div className={styles.filterContainer}>
              <span className={styles.filterLabel}>Status :</span>
              <select
                className={styles.filterDropdown}
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="">All</option>
                <option value="pending">Pending</option>
                <option value="in progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
              <span className={styles.filterLabel}>Assigned :</span>
              <select
                className={styles.filterDropdown}
                value={filterAssigned}
                onChange={(e) => setFilterAssigned(e.target.value)}
              >
                <option value="">All</option>
                {boeUsers.map((u) => (
                  <option key={u._id} value={u._id}>
                    {u.userName}
                  </option>
                ))}
                <option value="none">None</option>
              </select>
            </div>
            {/* <button className={styles.filterBtn} style={{display: 'flex'}}>⚙ Filter</button> */}
          </div>
        </div>
        <div className={styles.scrollGuide}>
          <span className={styles.scrollText}>
            Scroll right using SHIFT + Mouse Wheel or Trackpad
          </span>
        </div>

        <div className={styles.tableContainer}>
          <table className={styles.leadsTable}>
            <thead>
              <tr>
                <th>
                  <input
                    type="checkbox"
                    checked={selectAll}
                    onChange={() => handleSelectAll(tabLeads)}
                    className={styles.checkbox}
                  />
                </th>
                <th>Verified</th>
                <th>Lead ID</th>
                <th>Client</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Message</th>
                <th>Service</th>
                <th>Assigned</th>
                <th>Status</th>
                <th>Created At</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {tabLeads
                .filter((lead) => {
                  const lowerCaseQuery = searchQuery.toLowerCase().trim();
                  if (!lowerCaseQuery && !filterStatus && !filterAssigned)
                    return true;

                  const assignedBoUser = boeUsers.find(
                    (u) => u._id === lead.assignedTo,
                  );
                  const assignedBoName = assignedBoUser
                    ? assignedBoUser.userName.toLowerCase()
                    : "none";

                  const searchMatch =
                    !lowerCaseQuery ||
                    lead.fullName.toLowerCase().includes(lowerCaseQuery) ||
                    lead._id.toLowerCase().includes(lowerCaseQuery) ||
                    lead.phoneNumber.includes(lowerCaseQuery) ||
                    lead.email.toLowerCase().includes(lowerCaseQuery) ||
                    assignedBoName.includes(lowerCaseQuery) ||
                    lead.message.toLowerCase().includes(lowerCaseQuery) ||
                    lead.status.toLowerCase().includes(lowerCaseQuery) ||
                    formatDate(lead.createdAt)
                      .toLowerCase()
                      .includes(lowerCaseQuery) ||
                    (Array.isArray(lead.service)
                      ? lead.service
                          .join(", ")
                          .toLowerCase()
                          .includes(lowerCaseQuery)
                      : (lead.service as string)
                          ?.toLowerCase()
                          .includes(lowerCaseQuery));

                  const statusMatch =
                    !filterStatus || lead.status === filterStatus;
                  const assignedMatch =
                    !filterAssigned ||
                    (filterAssigned === "none"
                      ? !lead.assignedTo ||
                        lead.assignedTo === null ||
                        lead.assignedTo === ""
                      : lead.assignedTo === filterAssigned);

                  return searchMatch && statusMatch && assignedMatch;
                })
                .map((lead) => (
                  <tr key={lead._id}>
                    <td data-label="Select">
                      <input
                        type="checkbox"
                        checked={selectedLeads.includes(lead._id)}
                        onChange={() => handleSelectLead(lead._id)}
                        className={styles.checkbox}
                      />
                    </td>
                    <td data-label="Verified">
                      <span
                        style={{
                          color: lead.verified ? "#10b981" : "#ef4444",
                          fontWeight: "500",
                        }}
                      >
                        {lead.verified ? "Verified" : "Unverified"}
                      </span>
                    </td>
                    <td data-label="Lead ID">
                      <span
                        style={{
                          cursor: "pointer",
                          userSelect: "all",
                          position: "relative",
                        }}
                        onClick={() => handleCopyCell(lead._id, "id", lead._id)}
                        title="Click to select"
                      >
                        {lead._id}
                        {copiedCell &&
                          copiedCell.id === lead._id &&
                          copiedCell.field === "id" && (
                            <span
                              style={{
                                position: "absolute",
                                left: "100%",
                                marginLeft: 8,
                                fontSize: 12,
                                color: "#10b981",
                                background: "#fff",
                                borderRadius: 4,
                                padding: "2px 6px",
                                boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                              }}
                            >
                              Copied!
                            </span>
                          )}
                      </span>
                    </td>
                    <td className={styles.customerCell} data-label="Client">
                      <div className={styles.avatar}>
                        {lead.fullName
                          ? lead.fullName
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase()
                          : "—"}
                      </div>

                      <span
                        style={{
                          cursor: lead.fullName ? "pointer" : "default",
                          userSelect: lead.fullName ? "all" : "none",
                          position: "relative",
                        }}
                        onClick={() => {
                          if (!lead.fullName) return;
                          handleCopyCell(lead._id, "name", lead.fullName);
                        }}
                        title={
                          lead.fullName ? "Click to select" : "Not provided"
                        }
                      >
                        {lead.fullName || "—"}

                        {copiedCell &&
                          copiedCell.id === lead._id &&
                          copiedCell.field === "name" && (
                            <span
                              style={{
                                position: "absolute",
                                left: "100%",
                                marginLeft: 8,
                                fontSize: 12,
                                color: "#10b981",
                                background: "#fff",
                                borderRadius: 4,
                                padding: "2px 6px",
                                boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                              }}
                            >
                              Copied!
                            </span>
                          )}
                      </span>
                    </td>

                    <td
                      className={styles.emailCell}
                      onClick={() => handleEmailClick(lead.email)}
                      style={{ cursor: "pointer", color: "#2563eb" }}
                      data-label="Email"
                    >
                      {lead.email}
                    </td>
                    <td
                      onClick={() => {
                        if (!lead.phoneNumber) return;
                        handlePhoneClick(lead.phoneNumber);
                      }}
                      style={{
                        cursor: lead.phoneNumber ? "pointer" : "default",
                        color: lead.phoneNumber ? "#2563eb" : "#6b7280",
                      }}
                      data-label="Phone"
                    >
                      {lead.phoneNumber || "—"}
                    </td>

                    <td data-label="Message">
                      {lead.message ? (
                        <button
                          onClick={() => setShowMessagePopup(lead._id)}
                          style={{
                            background: "none",
                            border: "none",
                            color: "#2563eb",
                            cursor: "pointer",
                            textDecoration: "none",
                            fontSize: "0.875rem",
                          }}
                        >
                          View
                        </button>
                      ) : (
                        <span style={{ color: "#6b7280" }}>None</span>
                      )}
                    </td>

                    <td data-label="Service">
                      {lead.service &&
                      Array.isArray(lead.service) &&
                      lead.service.length > 0 ? (
                        <span
                          style={{
                            cursor: "pointer",
                            userSelect: "all",
                            position: "relative",
                          }}
                          onClick={() =>
                            handleCopyCell(
                              lead._id,
                              "service",
                              lead.service.join(", "),
                            )
                          }
                          title="Click to select"
                        >
                          {lead.service.join(", ")}

                          {copiedCell &&
                            copiedCell.id === lead._id &&
                            copiedCell.field === "service" && (
                              <span
                                style={{
                                  position: "absolute",
                                  left: "100%",
                                  marginLeft: 8,
                                  fontSize: 12,
                                  color: "#10b981",
                                  background: "#fff",
                                  borderRadius: 4,
                                  padding: "2px 6px",
                                  boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                                }}
                              >
                                Copied!
                              </span>
                            )}
                        </span>
                      ) : (
                        <span style={{ color: "#6b7280" }}>—</span>
                      )}
                    </td>

                    <td data-label="Assigned">
                      <div
                        style={{ position: "relative" }}
                        className="dropdown-container"
                      >
                        <button
                          onClick={(e) =>
                            handleAssignmentDropdownClick(e, lead._id)
                          }
                          className={styles.dropdownButton}
                        >
                          {!lead.assignedTo
                            ? "None"
                            : boeUsers.find((u) => u._id === lead.assignedTo)
                                ?.userName}
                          <svg
                            width="12"
                            height="12"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            style={{ marginLeft: "4px" }}
                          >
                            <polyline points="6,9 12,15 18,9" />
                          </svg>
                        </button>
                        {showAssignedDropdown === lead._id && (
                          <div
                            className={`${styles.modernDropdown} ${
                              dropdownPositions[lead._id] === "up"
                                ? styles.dropdownUp
                                : ""
                            }`}
                          >
                            <div
                              className={`${styles.dropdownArrowUp} ${
                                dropdownPositions[lead._id] === "up"
                                  ? styles.arrowDown
                                  : ""
                              }`}
                            ></div>
                            <div
                              key="none"
                              className={styles.modernDropdownItem}
                              onClick={() =>
                                handleAssignmentChange(lead._id, null)
                              }
                            >
                              None
                            </div>
                            {boeUsers.map((user) => (
                              <div
                                key={user._id}
                                className={styles.modernDropdownItem}
                                onClick={() =>
                                  handleAssignmentChange(lead._id, user._id)
                                }
                              >
                                {user.userName}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </td>
                    <td data-label="Status">
                      <span
                        style={{
                          color: getStatusColor(lead.status || "pending"),
                          textTransform: "capitalize",
                        }}
                      >
                        {lead.status || "pending"}
                      </span>
                    </td>
                    <td data-label="Created At">
                      {formatDate(lead.createdAt)}
                    </td>
                    <td data-label="Action">
                      <div
                        style={{
                          display: "flex",
                          gap: "8px",
                          alignItems: "center",
                        }}
                      >
                        {isTrashed ? (
                          <>
                            <button
                              onClick={() => handleRestoreLead(lead._id)}
                              className={styles.actionIcon}
                              style={{ color: "#10b981" }}
                              title="Restore"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
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
                              onClick={() =>
                                handlePermanentDeleteLead(lead._id)
                              }
                              className={styles.actionIcon}
                              style={{
                                color: "#ef4444",
                                cursor: lead.assignedTo
                                  ? "not-allowed"
                                  : "pointer",
                                opacity: lead.assignedTo ? 0.5 : 1,
                              }}
                              title={
                                lead.assignedTo
                                  ? "Un-assign the lead first"
                                  : "Delete Permanently"
                              }
                              disabled={lead.assignedTo ? true : false}
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path d="M21 5H3" />
                                <path d="M18 5v14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V5" />
                                <path d="M15 5V3a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v2" />
                                <path d="M9 10l6 6" />
                                <path d="M15 10l-6 6" />
                              </svg>
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() =>
                                handleActionIconClick(lead._id, "view")
                              }
                              className={styles.actionIcon}
                              style={{ color: "#3b82f6" }}
                              title="View"
                            >
                              <svg
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                <circle cx="12" cy="12" r="3" />
                              </svg>
                            </button>
                            <button
                              onClick={() =>
                                handleActionIconClick(lead._id, "download")
                              }
                              className={styles.actionIcon}
                              style={{ color: "#10b981" }}
                              title="Download"
                            >
                              <svg
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                <polyline points="7,10 12,15 17,10" />
                                <line x1="12" y1="15" x2="12" y2="3" />
                              </svg>
                            </button>
                            <div
                              onClick={() =>
                                handleActionIconClick(lead._id, "delete")
                              }
                              className={styles.actionIcon}
                              style={{ color: "#ef4444" }}
                              title="Delete"
                            >
                              <svg
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <polyline points="3,6 5,6 21,6" />
                                <path d="m19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2" />
                                <line x1="10" y1="11" x2="10" y2="17" />
                                <line x1="14" y1="11" x2="14" y2="17" />
                              </svg>
                            </div>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {!isUnverified && (
          <div className={styles.pagination}>
            <button
              className={styles.paginationBtn}
              onClick={() => setLeadsCurrentPage((p) => Math.max(1, p - 1))}
              disabled={leadsCurrentPage === 1}
            >
              ← Previous
            </button>
            <div className={styles.pageNumbers}>
              <span>
                Page {leadsCurrentPage} of {leadsTotalPages}
              </span>
            </div>
            <button
              className={styles.paginationBtn}
              onClick={() =>
                setLeadsCurrentPage((p) => Math.min(leadsTotalPages, p + 1))
              }
              disabled={leadsCurrentPage === leadsTotalPages}
            >
              Next →
            </button>
          </div>
        )}
      </div>
    );
  };

  const renderUsersTab = (isTrashed = false) => {
    const tabUsers = users.filter((user) => !!user.trash === isTrashed);

    // Calculate stats from paginated data
    const stats = {
      total: tabUsers.length,
      newToday: tabUsers.filter(
        (u: User) =>
          new Date(u.createdAt) > new Date(Date.now() - 24 * 60 * 60 * 1000),
      ).length,
      last30Days: tabUsers.filter(
        (u: User) =>
          new Date(u.createdAt) >
          new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      ).length,
      suspended: tabUsers.filter(
        (u: User) =>
          u.status === "Suspended" ||
          u.status === "suspended" ||
          u.status === "blocked",
      ).length,
      suspendedToday: tabUsers.filter(
        (u: User) =>
          (u.status === "Suspended" ||
            u.status === "suspended" ||
            u.status === "blocked") &&
          new Date(u.createdAt) > new Date(Date.now() - 24 * 60 * 60 * 1000),
      ).length,
      suspendedLast30Days: tabUsers.filter(
        (u: User) =>
          (u.status === "Suspended" ||
            u.status === "suspended" ||
            u.status === "blocked") &&
          new Date(u.createdAt) >
            new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      ).length,
    };

    return (
      <div className={styles.leadsContainer}>
        <div
          className={styles.leadsHeader}
          style={
            isMobile
              ? {
                  flexDirection: "column",
                  alignItems: "flex-start",
                  gap: "1rem",
                }
              : {}
          }
        >
          <div className={styles.headerLeft}>
            <h2>{isTrashed ? "Trashed Users" : "Users Management"}</h2>
            <p>
              {isTrashed
                ? "Review and manage trashed user accounts"
                : "Manage user accounts, permissions, and access levels"}
            </p>
          </div>
          <div className={styles.headerRight}>
            {!isTrashed && (
              <button
                className={styles.exportBtn}
                onClick={() => handleExport("users")}
              >
                Export All
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7,10 12,15 17,10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
              </button>
            )}
          </div>
        </div>
        <div
          className={styles.statsContainerCentered}
          style={isMobile ? { flexDirection: "column", gap: "1rem" } : {}}
        >
          <div className={styles.statCard}>
            <div className={styles.statHeader}>
              <span className={styles.statTitle}>USERS</span>
              <div
                className={styles.statIcon}
                style={{ backgroundColor: "#3b82f6" }}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
            </div>
            <div className={styles.statMainValue}>{stats.total}</div>
            <div className={styles.statSubLine}>
              <div>
                <span className={styles.statSubLabel}>New Today: </span>
                <span className={styles.statSubValue}>{stats.newToday}</span>
              </div>
              <div>
                <span
                  className={styles.statSubLabel}
                  style={{ marginLeft: "24px" }}
                >
                  Last 30 days:{" "}
                </span>
                <span className={styles.statSubValue}>{stats.last30Days}</span>
              </div>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statHeader}>
              <span className={styles.statTitle}>BLOCKED</span>
              <div
                className={styles.statIcon}
                style={{ backgroundColor: "#ef4444" }}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
              </div>
            </div>
            <div className={styles.statMainValue}>{stats.suspended}</div>
            <div className={styles.statSubLine}>
              <div>
                <span className={styles.statSubLabel}>Today: </span>
                <span className={styles.statSubValue}>
                  {stats.suspendedToday}
                </span>
              </div>
              <div>
                <span
                  className={styles.statSubLabel}
                  style={{ marginLeft: "24px" }}
                >
                  Last 30 days:{" "}
                </span>
                <span className={styles.statSubValue}>
                  {stats.suspendedLast30Days}
                </span>
              </div>
            </div>
          </div>
        </div>
        <div
          className={styles.tableControls}
          style={isMobile ? { flexDirection: "column", gap: "1rem" } : {}}
        >
          <div className={styles.leftControls}>
            {isTrashed ? (
              <>
                <button
                  className={styles.bulkBtn}
                  onClick={() => handleBulkAction("restore", "users")}
                  disabled={selectedUsers.length === 0}
                >
                  Restore
                </button>
                <button
                  className={styles.bulkBtn}
                  onClick={() => handleBulkAction("deletePermanently", "users")}
                  disabled={selectedUsers.length === 0}
                >
                  Delete Permanently
                </button>
              </>
            ) : (
              <>
                <button
                  className={styles.bulkBtn}
                  style={{ color: "#ef4444", borderColor: "#ef4444" }}
                  onClick={() => handleBulkAction("trash", "users")}
                  disabled={selectedUsers.length === 0}
                >
                  Trash
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="3,6 5,6 21,6" />
                    <path d="m19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2" />
                    <line x1="10" y1="11" x2="10" y2="17" />
                    <line x1="14" y1="11" x2="14" y2="17" />
                  </svg>
                </button>
                <button
                  className={styles.bulkBtn}
                  style={{ color: "#10b981", borderColor: "#10b981" }}
                  onClick={() => handleBulkAction("download", "users")}
                  disabled={selectedUsers.length === 0}
                >
                  Download
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7,10 12,15 17,10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                </button>
              </>
            )}
          </div>
          <div
            className={styles.rightControls}
            style={isMobile ? { width: "100%" } : {}}
          >
            <input
              type="text"
              placeholder="Search..."
              className={styles.searchInput}
              value={userSearchQuery}
              onChange={(e) => setUserSearchQuery(e.target.value)}
            />
            <div className={styles.filterContainer}>
              <span className={styles.filterLabel}>Status :</span>
              <select
                className={styles.filterDropdown}
                value={userFilterStatus}
                onChange={(e) => setUserFilterStatus(e.target.value)}
              >
                <option value="">All</option>
                <option value="active">Active</option>
                <option value="blocked">Blocked</option>
              </select>
              <span className={styles.filterLabel}>Request Status :</span>
              <select
                className={styles.filterDropdown}
                value={userFilterRequestStatus}
                onChange={(e) => setUserFilterRequestStatus(e.target.value)}
              >
                <option value="">All</option>
                <option value="pending">Pending</option>
                <option value="in progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>
        </div>
        <div className={styles.scrollGuide}>
          <span className={styles.scrollText}>
            Scroll right using SHIFT + Mouse Wheel or Trackpad
          </span>
        </div>
        <div className={styles.tableContainer}>
          <table className={styles.leadsTable}>
            <thead>
              <tr>
                <th>
                  <input
                    type="checkbox"
                    checked={selectAllUsers}
                    onChange={() => handleSelectAllUsersClick(tabUsers)}
                    className={styles.checkbox}
                  />
                </th>
                <th>Verified</th>
                <th>User ID</th>
                <th>User Name</th>
                <th>Ph. Number</th>
                <th>Email</th>
                <th>Status</th>
                <th>Request Status</th>
                <th>Leads</th>
                <th>Created</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {tabUsers
                .filter((user) => {
                  const query = userSearchQuery.toLowerCase().trim();
                  if (!query && !userFilterStatus && !userFilterRequestStatus)
                    return true;
                  const statusMatch =
                    !userFilterStatus ||
                    user.status.toLowerCase() === userFilterStatus;
                  let requestStatusMatch = true;
                  if (userFilterRequestStatus === "pending") {
                    // Only show users who have at least one lead with status 'pending'
                    if (
                      !user.leadsInitiated ||
                      user.leadsInitiated.length === 0
                    )
                      return false;
                    return user.leadsInitiated.some(
                      (l) => l.status === "pending",
                    );
                  } else if (userFilterRequestStatus === "in progress") {
                    return !!user.leadsInitiated?.some(
                      (l) => l.status === "in progress",
                    );
                  } else if (userFilterRequestStatus === "completed") {
                    return !!user.leadsInitiated?.some(
                      (l) => l.status === "completed",
                    );
                  }
                  const searchMatch =
                    !query ||
                    user.userName.toLowerCase().includes(query) ||
                    user._id.toLowerCase().includes(query) ||
                    user.email.toLowerCase().includes(query);
                  return statusMatch && requestStatusMatch && searchMatch;
                })
                .map((user: User) => {
                  const leadCounts = {
                    pending:
                      user.leadsInitiated?.filter((l) => l.status === "pending")
                        .length || 0,
                    inProgress:
                      user.leadsInitiated?.filter(
                        (l) => l.status === "in progress",
                      ).length || 0,
                    completed:
                      user.leadsInitiated?.filter(
                        (l) => l.status === "completed",
                      ).length || 0,
                  };
                  const leadCount = user.leadsInitiated?.length || 0;
                  return (
                    <tr key={user._id}>
                      <td data-label="Select">
                        <input
                          type="checkbox"
                          checked={selectedUsers.includes(user._id)}
                          onChange={() => handleSelectUser(user._id)}
                          className={styles.checkbox}
                        />
                      </td>
                      <td data-label="Verified">
                        {user.verified ? (
                          <svg
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="#10b981"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                            <polyline points="22,4 12,14.01 9,11.01" />
                          </svg>
                        ) : (
                          <svg
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="#ef4444"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <circle cx="12" cy="12" r="10" />
                            <line x1="15" y1="9" x2="9" y2="15" />
                            <line x1="9" y1="9" x2="15" y2="15" />
                          </svg>
                        )}
                      </td>
                      <td data-label="User ID">{user._id}</td>
                      <td
                        className={styles.customerCell}
                        data-label="User Name"
                      >
                        <div className={styles.avatar}>
                          {user.profilePicture ? (
                            <img
                              src={user.profilePicture}
                              alt={user.userName}
                              style={{
                                width: "100%",
                                height: "100%",
                                borderRadius: "50%",
                                objectFit: "cover",
                              }}
                            />
                          ) : (
                            user.userName
                              .split(" ")
                              .map((n: string) => n[0])
                              .join("")
                              .toUpperCase()
                              .slice(0, 2)
                          )}
                        </div>
                        {user.userName}
                      </td>
                      <td data-label="Ph. Number">
                        <a
                          href={`tel:${user.phone}`}
                          style={{
                            color: "#2563eb",
                            textDecoration: "none",
                            cursor: "pointer",
                          }}
                        >
                          {user.phone}
                        </a>
                      </td>
                      <td data-label="Email">
                        <a
                          href={`mailto:${user.email}`}
                          style={{
                            color: "#2563eb",
                            textDecoration: "none",
                            cursor: "pointer",
                          }}
                        >
                          {user.email}
                        </a>
                      </td>
                      <td
                        data-label="Status"
                        style={{
                          color:
                            user.status?.toLowerCase() === "active"
                              ? "#10b981"
                              : user.status?.toLowerCase() === "blocked"
                                ? "#ef4444"
                                : "#f50b0b",
                          textTransform: "capitalize",
                        }}
                      >
                        {user.status}
                      </td>
                      <td data-label="Request Status">
                        <span style={{ color: "#ef4444" }}>
                          P-{leadCounts.pending}
                        </span>{" "}
                        /{" "}
                        <span style={{ color: "#f59e0b" }}>
                          IP-{leadCounts.inProgress}
                        </span>{" "}
                        /{" "}
                        <span style={{ color: "#10b981" }}>
                          C-{leadCounts.completed}
                        </span>
                      </td>
                      <td data-label="Leads Initiated">{leadCount}</td>
                      <td data-label="Created">{formatDate(user.createdAt)}</td>
                      <td
                        data-label="Action"
                        style={{ display: "flex", gap: 5 }}
                      >
                        {isTrashed ? (
                          <>
                            <button
                              onClick={() => handleRestoreUser(user._id)}
                              className={styles.actionIcon}
                              style={{ color: "#10b981" }}
                              title="Restore"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
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
                              onClick={() =>
                                handlePermanentDeleteUser(user._id)
                              }
                              className={styles.actionIcon}
                              style={{ color: "#ef4444" }}
                              title="Delete Permanently"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path d="M21 5H3" />
                                <path d="M18 5v14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V5" />
                                <path d="M15 5V3a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v2" />
                                <path d="M9 10l6 6" />
                                <path d="M15 10l-6 6" />
                              </svg>
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => handleViewUser(user)}
                              className={styles.actionIcon}
                              style={{
                                color: "#2563eb",
                                width: 24,
                                height: 24,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                              title="View"
                            >
                              <svg
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                <circle cx="12" cy="12" r="3"></circle>
                              </svg>
                            </button>
                            {user.status?.toLowerCase() === "blocked" ? (
                              <button
                                onClick={() =>
                                  updateUser(user._id, { status: "active" })
                                }
                                className={styles.actionIcon}
                                style={{
                                  color: "#10b981",
                                  width: 24,
                                  height: 24,
                                }}
                                title="Unblock"
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  width="16"
                                  height="16"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <polyline points="22 12 18 12 15 15 18 18 22 18"></polyline>
                                  <path d="M5.45 5.45A9 9 0 0 0 21 12h-3a6 6 0 0 1-6-6V3a9 9 0 0 0-9 9"></path>
                                </svg>
                              </button>
                            ) : (
                              <button
                                onClick={() =>
                                  updateUser(user._id, { status: "blocked" })
                                }
                                className={styles.actionIcon}
                                style={{
                                  color: "#ef4444",
                                  width: 24,
                                  height: 24,
                                }}
                                title="Block"
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  width="16"
                                  height="16"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  className="lucide lucide-ban"
                                >
                                  <circle cx="12" cy="12" r="10" />
                                  <path d="m4.9 4.9 14.2 14.2" />
                                </svg>
                              </button>
                            )}
                            <button
                              onClick={() => handleTrashUser(user._id)}
                              className={styles.actionIcon}
                              style={{
                                color: "#ef4444",
                                width: 24,
                                height: 24,
                              }}
                              title="Delete"
                            >
                              <svg
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="#ef4444"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <polyline points="3,6 5,6 21,6" />
                                <path d="m19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2" />
                                <line x1="10" y1="11" x2="10" y2="17" />
                                <line x1="14" y1="11" x2="14" y2="17" />
                              </svg>
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
        <div className={styles.pagination}>
          <button
            className={styles.paginationBtn}
            onClick={() => setUsersCurrentPage((p) => Math.max(1, p - 1))}
            disabled={usersCurrentPage === 1}
          >
            ← Previous
          </button>
          <div className={styles.pageNumbers}>
            <span>
              Page {usersCurrentPage} of {usersTotalPages}
            </span>
          </div>
          <button
            className={styles.paginationBtn}
            onClick={() =>
              setUsersCurrentPage((p) => Math.min(usersTotalPages, p + 1))
            }
            disabled={usersCurrentPage === usersTotalPages}
          >
            Next →
          </button>
        </div>
      </div>
    );
  };

  const renderBackofficeTab = () => (
    <div className={styles.leadsContainer}>
      <div
        className={styles.leadsHeader}
        style={
          isMobile
            ? { flexDirection: "column", alignItems: "flex-start", gap: "1rem" }
            : {}
        }
      >
        <div className={styles.headerLeft}>
          <h2>Backoffice Management</h2>
          <p>Manage backoffice executives and their assignments</p>
        </div>
        <div className={styles.headerRight}></div>
      </div>

      <div
        className={styles.statsContainerCentered}
        style={isMobile ? { flexDirection: "column", gap: "1rem" } : {}}
      >
        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <span className={styles.statTitle}>Backoffice Executives</span>
            <div
              className={styles.statIcon}
              style={{ backgroundColor: "#3b82f6" }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
          </div>
          <div className={styles.statMainValue}>{boeUsers.length}</div>
          <div className={styles.statSubLine}>
            <div>
              <span className={styles.statSubLabel}>Slots: </span>
              <span className={styles.statSubValue}>5</span>
            </div>
            <div>
              <span
                className={styles.statSubLabel}
                style={{ marginLeft: "24px" }}
              >
                Empty Slots:{" "}
              </span>
              <span className={styles.statSubValue}>{5 - boeUsers.length}</span>
            </div>
          </div>
        </div>
      </div>

      <div
        className={styles.tableControls}
        style={isMobile ? { flexDirection: "column", gap: "1rem" } : {}}
      >
        <div className={styles.leftControls}>
          <button
            className={styles.bulkBtn}
            onClick={() => setShowAddBOEForm(true)}
            disabled={boeUsers.length >= 5}
            title={
              boeUsers.length >= 5
                ? "Maximum 5 backoffice executives allowed"
                : ""
            }
          >
            Add Backoffice executive
          </button>
        </div>
        <div
          className={styles.rightControls}
          style={isMobile ? { width: "100%" } : {}}
        ></div>
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.leadsTable}>
          <thead>
            <tr>
              <th>Verified</th>
              <th>User ID</th>
              <th>User</th>
              <th>Email</th>
              <th>Created</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {boeUsers
              .filter((u: User) => !u.trash)
              .map((user: User) => (
                <tr key={user._id}>
                  <td data-label="Verified">
                    {user.isVerified ? (
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        style={{ color: "#10b981" }}
                      >
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                        <polyline points="22,4 12,14.01 9,11.01" />
                      </svg>
                    ) : (
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        style={{ color: "#ef4444" }}
                      >
                        <circle cx="12" cy="12" r="10" />
                        <line x1="15" y1="9" x2="9" y2="15" />
                        <line x1="9" y1="9" x2="15" y2="15" />
                      </svg>
                    )}
                  </td>
                  <td data-label="User ID">{user._id}</td>
                  <td className={styles.customerCell} data-label="User">
                    {user.userName ? (
                      <div className={styles.avatar}>
                        {user.userName
                          .split(" ")
                          .map((n: string) => n[0])
                          .join("")
                          .toUpperCase()
                          .slice(0, 2)}
                      </div>
                    ) : (
                      <div
                        className={styles.avatar}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <svg
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="#cbd5e1"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <circle cx="12" cy="7" r="4" />
                          <path d="M5.5 21v-2A4.5 4.5 0 0 1 10 14h4a4.5 4.5 0 0 1 4.5 4.5v2" />
                        </svg>
                      </div>
                    )}
                    {user.userName}
                  </td>
                  <td data-label="Email">
                    <a
                      href={`mailto:${user.email}`}
                      style={{
                        color: "#2563eb",
                        textDecoration: "none",
                        cursor: "pointer",
                      }}
                    >
                      {user.email}
                    </a>
                  </td>
                  <td data-label="Created">{formatDate(user.createdAt)}</td>
                  <td data-label="Status">
                    <span
                      style={{
                        color:
                          typeof user.status === "boolean" &&
                          user.status === false
                            ? "#ef4444"
                            : "#10b981",
                        fontWeight: 400,
                        fontSize: 15,
                        textTransform: "capitalize",
                      }}
                    >
                      {typeof user.status === "boolean" && user.status === false
                        ? "Blocked"
                        : "Active"}
                    </span>
                  </td>
                  <td
                    data-label="Action"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "flex-start",
                      gap: 8,
                    }}
                  >
                    {typeof user.status === "boolean" &&
                    user.status === false ? (
                      <>
                        <button
                          onClick={async () => {
                            // Restore (unblock) the BOE user
                            const res = await fetch("/api/boe/update", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({
                                userId: user._id,
                                updates: { status: true },
                              }),
                            });
                            if (res.ok) {
                              setBoeUsers((prev) =>
                                prev.map((u) =>
                                  u._id === user._id
                                    ? { ...u, status: true }
                                    : u,
                                ),
                              );
                            } else {
                              alert("Failed to restore user.");
                            }
                          }}
                          className={styles.actionIcon}
                          style={{ color: "#10b981", width: 24, height: 24 }}
                          title="Restore"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <polyline points="22 12 18 12 15 15 18 18 22 18"></polyline>
                            <path d="M5.45 5.45A9 9 0 0 0 21 12h-3a6 6 0 0 1-6-6V3a9 9 0 0 0-9 9"></path>
                          </svg>{" "}
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={async () => {
                          if (
                            window.confirm(
                              "Are you sure you want to block this backoffice user?",
                            )
                          ) {
                            const res = await fetch("/api/boe/update", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({
                                userId: user._id,
                                updates: { status: false },
                              }),
                            });
                            if (res.ok) {
                              setBoeUsers((prev) =>
                                prev.map((u) =>
                                  u._id === user._id
                                    ? { ...u, status: false }
                                    : u,
                                ),
                              );
                            } else {
                              alert("Failed to block user.");
                            }
                          }
                        }}
                        className={styles.actionIcon}
                        style={{ color: "#ef4444", width: 24, height: 24 }}
                        title="Block"
                        disabled={
                          typeof user.status === "boolean"
                            ? !user.status
                            : false
                        }
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="lucide lucide-ban"
                        >
                          <circle cx="12" cy="12" r="10" />
                          <path d="m4.9 4.9 14.2 14.2" />
                        </svg>
                      </button>
                    )}
                    <button
                      onClick={async () => {
                        // Prevent deletion if user has assigned leads
                        if (hasAssignedLeads(user)) {
                          const leadCount = user.assignedLeads?.length || 0;
                          alert(
                            `Cannot delete this backoffice user. They have ${leadCount} assigned lead(s). Please reassign or complete the leads before deleting.`,
                          );
                          return;
                        }
                        if (
                          window.confirm(
                            "Are you sure you want to permanently delete this backoffice user?",
                          )
                        ) {
                          const res = await fetch("/api/boe/permanent-delete", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ userId: user._id }),
                          });
                          if (res.ok) {
                            setBoeUsers((prev) =>
                              prev.filter((u) => u._id !== user._id),
                            );
                          } else {
                            alert("Failed to delete user.");
                          }
                        }
                      }}
                      className={styles.actionIcon}
                      style={{
                        color: hasAssignedLeads(user) ? "#cbd5e1" : "#ef4444",
                        width: 24,
                        height: 24,
                        cursor: hasAssignedLeads(user)
                          ? "not-allowed"
                          : "pointer",
                        opacity: hasAssignedLeads(user) ? 0.5 : 1,
                      }}
                      title={
                        hasAssignedLeads(user)
                          ? "Cannot delete: user has assigned leads"
                          : "Delete"
                      }
                      disabled={hasAssignedLeads(user)}
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#ef4444"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="3,6 5,6 21,6" />
                        <path d="m19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2" />
                        <line x1="10" y1="11" x2="10" y2="17" />
                        <line x1="14" y1="11" x2="14" y2="17" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderUserProfileTab = () => {
    if (!user) {
      return (
        <div className={styles.leadsContainer}>
          <div className={styles.leadsHeader}>
            <div className={styles.headerLeft}>
              <h2>User Profile</h2>
              <p>
                Select a user from the main table to view their profile here.
              </p>
            </div>
          </div>
        </div>
      );
    }

    // Calculate lead statistics
    const userLeads = user.leadsInitiated || [];
    const leadStats = {
      total: userLeads.length,
      pending: userLeads.filter((lead) => lead.status === "pending").length,
      inProgress: userLeads.filter((lead) => lead.status === "in progress")
        .length,
      completed: userLeads.filter((lead) => lead.status === "completed").length,
    };

    return (
      <div
        className={styles.leadsContainer}
        style={{
          minHeight: "calc(100vh - 120px)",
          background: "inherit",
          boxShadow: "none",
          border: "none",
          padding: 0,
        }}
      >
        {/* Header */}
        <div
          className={styles.leadsHeader}
          style={
            isMobile
              ? {
                  flexDirection: "column",
                  alignItems: "flex-start",
                  gap: "1rem",
                }
              : {}
          }
        >
          <div className={styles.headerLeft}>
            <h2>User Profile</h2>
            <p>View user details and their initiated leads</p>
          </div>
        </div>

        {/* Full-width, full-height profile section */}
        <div
          style={{
            display: "flex",
            flexDirection: isMobile ? "column" : "row",
            justifyContent: "center",
            alignItems: "stretch",
            width: "100%",
            minHeight: "calc(100vh - 220px)",
            background: "inherit",
            margin: "0",
            padding: "0 0 40px 0",
            boxShadow: "none",
            border: "none",
          }}
        >
          {/* Left: Avatar and Basic Info */}
          <div
            style={{
              flex: isMobile ? "1" : "0 0 340px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              position: "relative",
              padding: "0 0 0 0",
            }}
          >
            {/* Avatar */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                position: "fixed",
                top: 200,
              }}
            >
              <div
                style={{
                  width: 160,
                  height: 160,
                  borderRadius: "50%",
                  background:
                    "linear-gradient(135deg, #b40068 0%, #a0005e 100%)",
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 80,
                  fontWeight: 700,
                  marginBottom: 32,
                  marginTop: 32,
                  boxShadow: "0 2px 8px rgba(180,0,104,0.08)",
                }}
              >
                {user?.profilePicture ? (
                  <img
                    src={user.profilePicture}
                    alt={user?.userName || "User"}
                    style={{
                      width: "100%",
                      height: "100%",
                      borderRadius: "50%",
                      objectFit: "cover",
                    }}
                  />
                ) : user?.userName ? (
                  user.userName
                    .split(" ")
                    .map((n: string) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2)
                ) : (
                  "—"
                )}
              </div>

              {/* Name and Verified */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  marginBottom: 8,
                }}
              >
                <span
                  style={{
                    fontWeight: 700,
                    fontSize: 32,
                    color: "#1e293b",
                    textTransform: "capitalize",
                  }}
                >
                  {user?.userName || "—"}
                </span>

                {user?.verified && (
                  <svg
                    width="28"
                    height="28"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22,4 12,14.01 9,11.01" />
                  </svg>
                )}
              </div>

              <div
                style={{
                  color: "#64748b",
                  fontSize: 20,
                  fontWeight: 500,
                  marginBottom: 12,
                }}
              >
                {user._id}
              </div>
            </div>
          </div>

          {/* Divider */}
          {!isMobile && (
            <div
              style={{ width: 2, background: "#e5e7eb", margin: "48px 0" }}
            />
          )}

          {/* Right: Details */}
          <div
            style={{
              flex: 1,
              padding: isMobile ? "24px" : "48px 48px 48px 40px",
              display: "flex",
              flexDirection: "column",
              gap: 28,
              justifyContent: "center",
              fontFamily: "inherit",
            }}
          >
            {/* Contact Info */}
            <div>
              <div
                style={{
                  fontWeight: 600,
                  fontSize: 20,
                  color: "#1e293b",
                  marginBottom: 12,
                }}
              >
                Contact Information
              </div>

              <div
                style={{
                  color: "#374151",
                  fontSize: 20,
                  fontWeight: 500,
                }}
              >
                Email:{" "}
                <span
                  style={{
                    color: "#2563eb",
                    fontWeight: 500,
                  }}
                >
                  {user?.email || "—"}
                </span>
              </div>
            </div>

            {/* Status */}
            <div>
              <div
                style={{
                  fontWeight: 600,
                  fontSize: 20,
                  color: "#1e293b",
                  marginBottom: 12,
                }}
              >
                Status
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span
                  style={{
                    color:
                      user.status?.toLowerCase() === "active"
                        ? "#10b981"
                        : user.status?.toLowerCase() === "blocked"
                          ? "#ef4444"
                          : "#374151",
                    fontWeight: 500,
                    fontSize: 20,
                    textTransform: "capitalize",
                    transition: "all 0.2s",
                  }}
                >
                  {user.status}
                </span>
              </div>
            </div>

            {/* Lead Statistics */}
            <div>
              <div
                style={{
                  fontWeight: 600,
                  fontSize: 20,
                  color: "#1e293b",
                  marginBottom: 12,
                }}
              >
                Lead Statistics
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  flexWrap: "wrap",
                }}
              >
                <span
                  style={{
                    color: "#ef4444",
                    borderRight: "1px solid #e5e7eb",
                    paddingRight: "12px",
                    fontWeight: 500,
                    fontSize: 20,
                    transition: "all 0.2s",
                  }}
                >
                  Pending: {leadStats.pending}
                </span>
                <span
                  style={{
                    color: "#f59e0b",
                    borderRight: "1px solid #e5e7eb",
                    paddingRight: "12px",
                    fontWeight: 500,
                    fontSize: 20,
                    transition: "all 0.2s",
                  }}
                >
                  In Progress: {leadStats.inProgress}
                </span>
                <span
                  style={{
                    color: "#10b981",
                    borderRight: "1px solid #e5e7eb",
                    paddingRight: "12px",
                    fontWeight: 500,
                    fontSize: 20,
                    transition: "all 0.2s",
                  }}
                >
                  Completed: {leadStats.completed}
                </span>
                <span
                  style={{
                    color: "#3b82f6",
                    fontWeight: 500,
                    fontSize: 20,
                    transition: "all 0.2s",
                  }}
                >
                  Total: {leadStats.total}
                </span>
              </div>
            </div>

            {/* Created At */}
            <div>
              <div
                style={{
                  fontWeight: 600,
                  fontSize: 20,
                  color: "#1e293b",
                  marginBottom: 12,
                }}
              >
                Created At
              </div>
              <div style={{ color: "#64748b", fontSize: 16, fontWeight: 400 }}>
                {formatDate(user.createdAt)}
              </div>
            </div>

            {/* User's Leads */}
            {initiatedLeads.length > 0 && (
              <div>
                <div
                  style={{
                    fontWeight: 600,
                    fontSize: 20,
                    color: "#1e293b",
                    marginBottom: 12,
                  }}
                >
                  Initiated Leads
                </div>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                  }}
                >
                  {initiatedLeads.map((lead) => (
                    <div
                      key={lead._id}
                      style={{
                        background: "#fff",
                        border: "1px solid #e5e7eb",
                        borderRadius: "8px",
                        padding: "16px",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                        transition: "all 0.2s ease",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          marginBottom: "8px",
                        }}
                      >
                        <div style={{ flex: 1 }}>
                          <div
                            style={{
                              fontWeight: 600,
                              color: "#1e293b",
                              fontSize: "16px",
                              marginBottom: "4px",
                            }}
                          >
                            Name: {lead.fullName || "N/A"}
                          </div>
                          <div
                            style={{
                              color: "#64748b",
                              fontSize: "14px",
                              marginBottom: "4px",
                            }}
                          >
                            Email: {lead.email || "N/A"}
                          </div>
                          <div style={{ color: "#64748b", fontSize: "14px" }}>
                            Service:{" "}
                            {Array.isArray(lead.service)
                              ? lead.service[0]
                              : lead.service || "N/A"}
                          </div>
                        </div>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                          }}
                        >
                          <span
                            style={{
                              color: getStatusColor(lead.status),
                              padding: "6px 12px",
                              fontWeight: 500,
                              fontSize: 16,
                              textTransform: "uppercase",
                            }}
                          >
                            {lead.status}
                          </span>
                        </div>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          paddingTop: "8px",
                          borderTop: "1px solid #f3f4f6",
                        }}
                      >
                        <div style={{ color: "#64748b", fontSize: "12px" }}>
                          Created:{" "}
                          {lead.createdAt
                            ? formatDate(lead.createdAt)
                            : "Date unavailable"}
                        </div>
                        <div style={{ color: "#64748b", fontSize: "12px" }}>
                          ID: {lead._id}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderLeadDetailsTab = () => {
    const lead = selectedLeadForDetails;

    if (!lead) {
      return (
        <div className={styles.leadsContainer}>
          <div className={styles.leadsHeader}>
            <div className={styles.headerLeft}>
              <h2>Lead Details</h2>
              <p>Select a lead from the main table to view its details here.</p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div
        className={styles.leadsContainer}
        style={{
          minHeight: "calc(100vh - 120px)",
          background: "inherit",
          boxShadow: "none",
          border: "none",
          padding: 0,
        }}
      >
        {/* Header */}
        <div
          className={styles.leadsHeader}
          style={
            isMobile
              ? {
                  flexDirection: "column",
                  alignItems: "flex-start",
                  gap: "1rem",
                }
              : {}
          }
        >
          <div className={styles.headerLeft}>
            <h2>Lead Details</h2>
            <p>View and manage lead-specific information and status</p>
          </div>
        </div>

        {/* Full-width, full-height profile section */}
        <div
          style={{
            display: "flex",
            flexDirection: isMobile ? "column" : "row",
            justifyContent: "center",
            alignItems: "stretch",
            width: "100%",
            minHeight: "calc(100vh - 220px)",
            background: "inherit",
            margin: "0",
            padding: "0 0 40px 0",
            boxShadow: "none",
            border: "none",
          }}
        >
          {/* Left: Avatar and Basic Info */}
          <div
            style={{
              flex: isMobile ? "1" : "0 0 340px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
              padding: "0 0 0 0",
            }}
          >
            {/* Avatar */}
            <div
              style={{
                width: 160,
                height: 160,
                borderRadius: "50%",
                background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 80,
                fontWeight: 700,
                marginBottom: 32,
                marginTop: 32,
                boxShadow: "0 2px 8px rgba(59,130,246,0.2)",
              }}
            >
              {lead.fullName
                ? lead.fullName
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                : "—"}
            </div>

            {/* Name */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                marginBottom: 8,
              }}
            >
              <span
                style={{
                  fontWeight: 700,
                  fontSize: 32,
                  color: "#1e293b",
                  textTransform: "capitalize",
                }}
              >
                {lead.fullName || "—"}
              </span>
            </div>
            <div
              style={{
                color: "#64748b",
                fontSize: 20,
                fontWeight: 500,
                marginBottom: 12,
              }}
            >
              {lead._id}
            </div>
          </div>

          {/* Divider */}
          {!isMobile && (
            <div
              style={{ width: 2, background: "#e5e7eb", margin: "48px 0" }}
            />
          )}

          {/* Right: Details */}
          <div
            style={{
              flex: 1,
              padding: isMobile ? "24px" : "48px 48px 48px 40px",
              display: "flex",
              flexDirection: "column",
              gap: 28,
              justifyContent: "center",
              fontFamily: "inherit",
            }}
          >
            {/* Contact Info */}
            <div>
              <div
                style={{
                  fontWeight: 600,
                  fontSize: 20,
                  color: "#1e293b",
                  marginBottom: 12,
                }}
              >
                Contact Information
              </div>
              <div
                style={{
                  color: "#374151",
                  fontSize: 20,
                  marginBottom: 6,
                  fontWeight: 500,
                }}
              >
                Email:{" "}
                <span style={{ color: "#2563eb", fontWeight: 500 }}>
                  {lead.email}
                </span>
              </div>
              <div
                style={{
                  color: "#374151",
                  fontSize: 20,
                  fontWeight: 500,
                }}
              >
                Phone Number:{" "}
                <span
                  style={{
                    color: "#2563eb",
                    fontWeight: 500,
                  }}
                >
                  {lead.phoneNumber || "—"}
                </span>
              </div>
            </div>
            {/* Service */}
            <div>
              <div
                style={{
                  fontWeight: 600,
                  fontSize: 20,
                  color: "#1e293b",
                  marginBottom: 12,
                }}
              >
                Service(s) Requested
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  flexWrap: "wrap",
                }}
              >
                {Array.isArray(lead.service) && lead.service.length > 0 ? (
                  lead.service.map((service, index) => (
                    <span
                      key={index}
                      style={{
                        color: "#3b82f6",
                        fontWeight: 500,
                        fontSize: 20,
                        transition: "all 0.2s",
                      }}
                    >
                      {service}
                    </span>
                  ))
                ) : (
                  <span
                    style={{
                      color: "#6b7280",
                      fontWeight: 500,
                      fontSize: 20,
                    }}
                  >
                    —
                  </span>
                )}
              </div>
            </div>
            {/* Message */}
            <div>
              <div
                style={{
                  fontWeight: 600,
                  fontSize: 20,
                  color: "#1e293b",
                  marginBottom: 12,
                }}
              >
                Message
              </div>
              <p
                style={{
                  color: "#374151",
                  fontSize: 20,
                  fontWeight: 500,
                  margin: 0,
                  lineHeight: 1.5,
                  textTransform: "capitalize",
                }}
              >
                {lead.message}
              </p>
            </div>
            {/* Status */}
            <div>
              <div
                style={{
                  fontWeight: 600,
                  fontSize: 20,
                  color: "#1e293b",
                  marginBottom: 12,
                }}
              >
                Status
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span
                  style={{
                    color: getStatusColor(lead.status),
                    fontWeight: 500,
                    fontSize: 20,
                    textTransform: "capitalize",
                  }}
                >
                  {lead.status}
                </span>
              </div>
            </div>
            {/* Assigned */}
            <div>
              <div
                style={{
                  fontWeight: 600,
                  fontSize: 20,
                  color: "#1e293b",
                  marginBottom: 12,
                }}
              >
                Assigned To
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span
                  style={{
                    color: "#374151",
                    fontWeight: 500,
                    fontSize: 20,
                    transition: "all 0.2s",
                  }}
                >
                  {!lead.assignedTo
                    ? "None"
                    : boeUsers.find((u) => u._id === lead.assignedTo)?.userName}
                </span>
              </div>
            </div>
            {/* Created At */}
            <div>
              <div
                style={{
                  fontWeight: 600,
                  fontSize: 20,
                  color: "#1e293b",
                  marginBottom: 12,
                }}
              >
                Created At
              </div>
              <div style={{ color: "#64748b", fontSize: 16, fontWeight: 400 }}>
                {formatDate(lead.createdAt)}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const handleAddBOE = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setBoeFormError("");
    setBoeFormLoading(true);
    if (boeUsers.length >= 5) {
      setBoeFormError("Maximum 5 Backoffice Executives allowed.");
      setBoeFormLoading(false);
      return;
    }
    const res = await fetch("/api/boe/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(boeForm),
    });
    const data = await res.json();
    if (!res.ok) {
      setBoeFormError(data.error || "Failed to add executive");
      setBoeFormLoading(false);
      return;
    }
    setShowAddBOEForm(false);
    setBoeForm({ username: "", email: "", password: "" });
    setBoeFormLoading(false);
    // Refresh list
    fetch("/api/boe/list")
      .then((res) => res.json())
      .then((data) => setBoeUsers(data.users || []));
  };

  const handleDeleteBOE = async (id: string) => {
    await fetch("/api/boe/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setBoeUsers(boeUsers.filter((u) => u._id !== id));
  };

  const handleViewUser = (user: User) => {
    setSelectedUserForDetails(user);
    setActiveTab("User Profile");
  };

  const handleViewUserLeads = (user: User) => {
    setActiveTab("Leads");
    setSearchQuery(user.userName);
  };

  const handleBlockUserOld = async (user: User) => {
    // Implement logic to block user
    console.log(`Blocking user: ${user._id}`);
  };

  const handleDeleteUser = async (user: User) => {
    // Implement logic to delete user
    console.log(`Deleting user: ${user._id}`);
  };

  const handlePermanentDeleteLead = async (leadId: string) => {
    if (
      !window.confirm("Are you sure you want to permanently delete this lead?")
    )
      return;
    try {
      const res = await fetch("/api/lead/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId }),
      });
      if (res.ok) {
        setLeads((prev) => prev.filter((l) => l._id !== leadId));
      } else {
        console.error("Failed to permanently delete lead");
      }
    } catch (error) {
      console.error("Error permanently deleting lead:", error);
    }
  };

  const handleRestoreLead = (leadId: string) => {
    updateLead(leadId, { trash: false });
  };

  const handleLogout = async () => {
    try {
      const response = await fetch("/api/admin/logout", {
        method: "POST",
        credentials: "include",
      });

      if (response.ok) {
        // Redirect to login page or reload the page
        window.location.href = "/";
      } else {
        console.error("Logout failed");
      }
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  const renderAdminManagementTab = () => (
    <div className={styles.leadsContainer}>
      <div
        className={styles.leadsHeader}
        style={
          isMobile
            ? { flexDirection: "column", alignItems: "flex-start", gap: "1rem" }
            : {}
        }
      >
        <div className={styles.headerLeft}>
          <h2>Admin Management</h2>
          <p>Manage admin users and their permissions</p>
        </div>
        <div className={styles.headerRight}></div>
      </div>

      <div
        className={styles.statsContainerCentered}
        style={isMobile ? { flexDirection: "column", gap: "1rem" } : {}}
      >
        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <span className={styles.statTitle}>Admin Users</span>
            <div
              className={styles.statIcon}
              style={{ backgroundColor: "#3b82f6" }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
          </div>
          <div className={styles.statMainValue}>{adminUsers.length}</div>
          <div className={styles.statSubLine}>
            <div>
              <span className={styles.statSubLabel}>Slots: </span>
              <span className={styles.statSubValue}>2</span>
            </div>
            <div>
              <span
                className={styles.statSubLabel}
                style={{ marginLeft: "24px" }}
              >
                Empty Slots:{" "}
              </span>
              <span className={styles.statSubValue}>
                {2 - adminUsers.length}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div
        className={styles.tableControls}
        style={isMobile ? { flexDirection: "column", gap: "1rem" } : {}}
      >
        <div className={styles.leftControls}>
          <button
            className={styles.bulkBtn}
            onClick={() => setShowAddAdminForm(true)}
            disabled={adminUsers.length >= 2}
            title={
              adminUsers.length >= 2 ? "Maximum 2 administrator's allowed" : ""
            }
          >
            Add Admin
          </button>
        </div>
        <div
          className={styles.rightControls}
          style={isMobile ? { width: "100%" } : {}}
        ></div>
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.leadsTable}>
          <thead>
            <tr>
              <th>Verified</th>
              <th>User ID</th>
              <th>ADMIN</th>
              <th>Email</th>
              <th>Created</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {adminUsers
              .filter((u: User) => !u.trash)
              .map((user: User) => (
                <tr key={user._id}>
                  <td data-label="Verified">
                    {user.isVerified ? (
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        style={{ color: "#10b981" }}
                      >
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                        <polyline points="22,4 12,14.01 9,11.01" />
                      </svg>
                    ) : (
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        style={{ color: "#ef4444" }}
                      >
                        <circle cx="12" cy="12" r="10" />
                        <line x1="15" y1="9" x2="9" y2="15" />
                        <line x1="9" y1="9" x2="15" y2="15" />
                      </svg>
                    )}
                  </td>
                  <td data-label="User ID">{user._id}</td>
                  <td className={styles.customerCell} data-label="ADMIN">
                    {user.username ? (
                      <div className={styles.avatar}>
                        {user.username
                          .split(" ")
                          .map((n: string) => n[0])
                          .join("")
                          .toUpperCase()
                          .slice(0, 2)}
                      </div>
                    ) : (
                      <div
                        className={styles.avatar}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <svg
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="#cbd5e1"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <circle cx="12" cy="7" r="4" />
                          <path d="M5.5 21v-2A4.5 4.5 0 0 1 10 14h4a4.5 4.5 0 0 1 4.5 4.5v2" />
                        </svg>
                      </div>
                    )}
                    {user.username}
                  </td>
                  <td data-label="Email">
                    <a
                      href={`mailto:${user.email}`}
                      style={{
                        color: "#2563eb",
                        textDecoration: "none",
                        cursor: "pointer",
                      }}
                    >
                      {user.email}
                    </a>
                  </td>
                  <td data-label="Created">{formatDate(user.createdAt)}</td>
                  <td data-label="Action" style={{ display: "flex" }}>
                    <button
                      onClick={() => handleDeleteAdmin(user._id)}
                      disabled={
                        (currentAdmin && user.email === currentAdmin.email) ||
                        user._id === currentAdminId
                      }
                      title={
                        (currentAdmin && user.email === currentAdmin.email) ||
                        user._id === currentAdminId
                          ? "You cannot delete yourself."
                          : "Delete"
                      }
                      className={styles.actionIcon}
                      style={{
                        color:
                          (currentAdmin && user.email === currentAdmin.email) ||
                          user._id === currentAdminId
                            ? "#cbd5e1"
                            : "#ef4444",
                        cursor:
                          (currentAdmin && user.email === currentAdmin.email) ||
                          user._id === currentAdminId
                            ? "not-allowed"
                            : "pointer",
                        opacity:
                          (currentAdmin && user.email === currentAdmin.email) ||
                          user._id === currentAdminId
                            ? 0.5
                            : 1,
                      }}
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#ef4444"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="3,6 5,6 21,6" />
                        <path d="m19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2" />
                        <line x1="10" y1="11" x2="10" y2="17" />
                        <line x1="14" y1="11" x2="14" y2="17" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const handleAddAdmin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setAdminFormError("");
    setAdminFormLoading(true);
    if (adminUsers.length >= 2) {
      setAdminFormError("Maximum 2 Admin Users allowed.");
      setAdminFormLoading(false);
      return;
    }
    const res = await fetch("/api/admin/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(adminForm),
    });
    const data = await res.json();
    if (!res.ok) {
      setAdminFormError(data.error || "Failed to add admin");
      setAdminFormLoading(false);
      return;
    }
    setShowAddAdminForm(false);
    setAdminForm({ username: "", email: "", password: "" });
    setAdminFormLoading(false);
    // Refresh list
    fetch("/api/admin/list")
      .then((res) => res.json())
      .then((data) => setAdminUsers(data.admins || []));
  };

  // Add this function near other delete handlers:
  const handleDeleteAdmin = async (adminId: string) => {
    // Find the admin being deleted to get their email
    const adminToDelete = adminUsers.find((u: any) => u._id === adminId);

    // Prevent deleting the currently logged-in admin by comparing emails
    if (
      currentAdmin &&
      adminToDelete &&
      adminToDelete.email === currentAdmin.email
    ) {
      alert("You cannot delete your own admin account.");
      return;
    }

    // Also check by ID as a fallback
    if (adminId === currentAdminId) {
      alert("You cannot delete your own admin account.");
      return;
    }

    if (
      !window.confirm("Are you sure you want to permanently delete this admin?")
    )
      return;
    try {
      console.log("Attempting to delete admin with ID:", adminId);
      const res = await fetch("/api/admin/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminId }),
      });
      console.log("Response status:", res.status);
      if (res.ok) {
        const data = await res.json();
        console.log("Response data:", data);
        setAdminUsers((prev: any[]) =>
          prev.filter((u: any) => u._id !== adminId),
        );
        alert("Admin deleted successfully");
      } else {
        const errorData = await res.json();
        console.error("Error response:", errorData);
        alert(`Failed to delete admin: ${errorData.error || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Network error:", error);
      alert("Error deleting admin.");
    }
  };

  // Blog User Handlers
  const handleAddBlogUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setBlogUserFormError("");
    setBlogUserFormLoading(true);

    if (blogUsers.length >= 2) {
      setBlogUserFormError("Maximum 2 Blog User allowed.");
      setBlogUserFormLoading(false);
      return;
    }

    const res = await fetch("/api/blog-user/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(blogUserForm),
    });

    const data = await res.json();
    if (!res.ok) {
      setBlogUserFormError(data.message || "Failed to create blog user");
      setBlogUserFormLoading(false);
      return;
    }

    setShowAddBlogUserForm(false);
    setBlogUserForm({ name: "", email: "", password: "" });
    setBlogUserFormLoading(false);
    fetchBlogUsers();
  };

  const handleDeleteBlogUser = async (userId: string) => {
    if (
      !window.confirm(
        "Are you sure you want to permanently delete this blog user?",
      )
    )
      return;

    try {
      const res = await fetch(`/api/blog-user/${userId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setBlogUsers((prev) => prev.filter((u) => u._id !== userId));
        alert("Blog user deleted successfully");
      } else {
        const errorData = await res.json();
        alert(
          `Failed to delete blog user: ${errorData.message || "Unknown error"}`,
        );
      }
    } catch (error) {
      console.error("Network error:", error);
      alert("Error deleting blog user.");
    }
  };

  const handleBanBlogUser = async (userId: string) => {
    try {
      const res = await fetch(`/api/blog-user/${userId}/ban`, {
        method: "PATCH",
      });

      if (res.ok) {
        setBlogUsers((prev) =>
          prev.map((u) => (u._id === userId ? { ...u, isBanned: true } : u)),
        );
      } else {
        const errorData = await res.json();
        alert(`Failed to ban user: ${errorData.message || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error banning user:", error);
      alert("Error banning user.");
    }
  };

  const handleUnbanBlogUser = async (userId: string) => {
    try {
      const res = await fetch(`/api/blog-user/${userId}/unban`, {
        method: "PATCH",
      });

      if (res.ok) {
        setBlogUsers((prev) =>
          prev.map((u) => (u._id === userId ? { ...u, isBanned: false } : u)),
        );
      } else {
        const errorData = await res.json();
        alert(`Failed to unban user: ${errorData.message || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error unbanning user:", error);
      alert("Error unbanning user.");
    }
  };

  const handleChangePassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPasswordChangeError("");
    setPasswordChangeLoading(true);

    if (!selectedBlogUserForPassword) {
      setPasswordChangeError("No user selected");
      setPasswordChangeLoading(false);
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      setPasswordChangeError("Password must be at least 6 characters");
      setPasswordChangeLoading(false);
      return;
    }

    try {
      const res = await fetch(
        `/api/blog-user/${selectedBlogUserForPassword._id}/change-password`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ newPassword }),
        },
      );

      const data = await res.json();
      if (res.ok) {
        setShowChangePasswordModal(false);
        setNewPassword("");
        setSelectedBlogUserForPassword(null);
        alert("Password changed successfully");
      } else {
        setPasswordChangeError(data.message || "Failed to change password");
      }
    } catch (error) {
      console.error("Error changing password:", error);
      setPasswordChangeError("Error changing password");
    } finally {
      setPasswordChangeLoading(false);
    }
  };

  const renderBlogManagersTab = () => (
    <div className={styles.leadsContainer}>
      <div
        className={styles.leadsHeader}
        style={
          isMobile
            ? { flexDirection: "column", alignItems: "flex-start", gap: "1rem" }
            : {}
        }
      >
        <div className={styles.headerLeft}>
          <h2>Blog Managers</h2>
          <p>Manage blog managers and their permissions</p>
        </div>
        <div className={styles.headerRight}></div>
      </div>

      <div
        className={styles.statsContainerCentered}
        style={isMobile ? { flexDirection: "column", gap: "1rem" } : {}}
      >
        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <span className={styles.statTitle}>Blog Managers</span>
            <div
              className={styles.statIcon}
              style={{ backgroundColor: "#3b82f6" }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
          </div>
          <div className={styles.statMainValue}>{blogUsers.length}</div>
          <div className={styles.statSubLine}>
            <div>
              <span className={styles.statSubLabel}>Slots: </span>
              <span className={styles.statSubValue}>2</span>
            </div>
            <div>
              <span
                className={styles.statSubLabel}
                style={{ marginLeft: "24px" }}
              >
                Banned:{" "}
              </span>
              <span className={styles.statSubValue}>
                {blogUsers.filter((u) => u.isBanned).length}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div
        className={styles.tableControls}
        style={isMobile ? { flexDirection: "column", gap: "1rem" } : {}}
      >
        <div className={styles.leftControls}>
          <button
            className={styles.bulkBtn}
            onClick={() => setShowAddBlogUserForm(true)}
            disabled={blogUsers.length >= 2}
            title={
              blogUsers.length >= 2 ? "Maximum 2 blog managers allowed" : ""
            }
          >
            Add Blog Manager
          </button>
        </div>
        <div
          className={styles.rightControls}
          style={isMobile ? { width: "100%" } : {}}
        ></div>
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.leadsTable}>
          <thead>
            <tr>
              <th>User ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Password</th>
              <th>Ban/Unban</th>
              <th>Created</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {blogUsers.map((user: any) => (
              <tr key={user._id}>
                <td data-label="User ID">{user._id}</td>
                <td className={styles.customerCell} data-label="Name">
                  <div className={styles.avatar}>
                    {user.name
                      .split(" ")
                      .map((n: string) => n[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2)}
                  </div>
                  {user.name}
                </td>
                <td data-label="Email">
                  <a
                    href={`mailto:${user.email}`}
                    style={{
                      color: "#2563eb",
                      textDecoration: "none",
                      cursor: "pointer",
                    }}
                  >
                    {user.email}
                  </a>
                </td>
                <td data-label="Role" style={{ textTransform: "capitalize" }}>
                  {user.role || "blog-manager"}
                </td>
                <td data-label="Status">
                  <span
                    style={{
                      color: user.isBanned ? "#ef4444" : "#10b981",
                      fontWeight: 500,
                      textTransform: "capitalize",
                    }}
                  >
                    {user.isBanned ? "Banned" : "Active"}
                  </span>
                </td>
                <td data-label="Password">
                  <button
                    onClick={() => {
                      setSelectedBlogUserForPassword(user);
                      setNewPassword("");
                      setPasswordChangeError("");
                      setShowChangePasswordModal(true);
                    }}
                    className={styles.bulkBtn}
                    style={{
                      padding: "4px 12px",
                      fontSize: "12px",
                      color: "#3b82f6",
                      borderColor: "#3b82f6",
                    }}
                  >
                    Change
                  </button>
                </td>
                <td data-label="Ban/Unban">
                  {user.isBanned ? (
                    <button
                      onClick={() => handleUnbanBlogUser(user._id)}
                      className={styles.actionIcon}
                      style={{ color: "#10b981", width: 24, height: 24 }}
                      title="Unban"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="22 12 18 12 15 15 18 18 22 18"></polyline>
                        <path d="M5.45 5.45A9 9 0 0 0 21 12h-3a6 6 0 0 1-6-6V3a9 9 0 0 0-9 9"></path>
                      </svg>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleBanBlogUser(user._id)}
                      className={styles.actionIcon}
                      style={{ color: "#ef4444", width: 24, height: 24 }}
                      title="Ban"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <circle cx="12" cy="12" r="10" />
                        <path d="m4.9 4.9 14.2 14.2" />
                      </svg>
                    </button>
                  )}
                </td>
                <td data-label="Created">
                  {user.createdAt ? formatDate(user.createdAt) : "N/A"}
                </td>
                <td data-label="Action" style={{ display: "flex" }}>
                  <button
                    onClick={() => handleDeleteBlogUser(user._id)}
                    className={styles.actionIcon}
                    style={{ color: "#ef4444" }}
                    title="Delete"
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#ef4444"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="3,6 5,6 21,6" />
                      <path d="m19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2" />
                      <line x1="10" y1="11" x2="10" y2="17" />
                      <line x1="14" y1="11" x2="14" y2="17" />
                    </svg>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const handleCopyCell = (id: string, field: string, value: string) => {
    if (
      typeof navigator !== "undefined" &&
      navigator.clipboard &&
      typeof navigator.clipboard.writeText === "function"
    ) {
      navigator.clipboard.writeText(value);
      setCopiedCell({ id, field });
      setTimeout(() => setCopiedCell(null), 1200);
    } else {
      alert("Clipboard copy is not supported in this environment.");
    }
  };

  return (
    <>
      {showMobileOverlay && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            background: "rgba(180, 0, 54, 0.95)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              color: "white",
              fontSize: "1.2rem",
              fontWeight: 600,
              padding: 24,
              borderRadius: 25,
              background: "rgba(180, 0, 54, 1)",
              maxWidth: 500,
              textAlign: "center",
              marginBottom: 24,
            }}
          >
            Highly recommended to login in Desktop or Laptop for better
            experience
          </div>
          <button
            style={{
              background: "#fff",
              color: "#b40036",
              fontWeight: 700,
              fontSize: "1rem",
              border: "none",
              borderRadius: 12,
              padding: "12px 32px",
              cursor: "pointer",
              boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
              marginTop: 8,
            }}
            onClick={() => setShowMobileOverlay(false)}
          >
            Use Anyway
          </button>
        </div>
      )}
      <div className={styles.dashboard}>
        <div className={styles.sidebar}>
          <div className={styles.profileSection}>
            <div className={styles.profileIcon}>
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            </div>
            <div className={styles.profileName}>
              {currentAdmin?.username || "Admin User"}
            </div>
            <div
              className={styles.profileEmail}
              style={{ width: "100%", wordWrap: "break-word" }}
            >
              {currentAdmin?.email || "admin@company.com"}
            </div>
            <div className={styles.profileButtons}>
              <Link
                href="/"
                className={styles.profileBtn}
                style={{ display: "none" }}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                  <polyline points="9 22 9 12 15 12 15 22"></polyline>
                </svg>
                Home
              </Link>
              <button
                className={`${styles.profileBtn} ${styles.logoutBtn}`}
                onClick={handleLogout}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                  <polyline points="16 17 21 12 16 7"></polyline>
                  <line x1="21" y1="12" x2="9" y2="12"></line>
                </svg>
                Logout
              </button>
            </div>
          </div>
          <nav className={styles.nav}>
            {/* Management Section */}
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                gap: 10,
                width: "100%",
                marginBottom: 8,
                marginTop: 8,
              }}
            >
              <hr className={styles.navItemDivider} />
              <span className={styles.navItemLabel}>Management</span>
              <hr
                className={styles.navItemDivider}
                style={{ marginLeft: "auto" }}
              />
            </div>
            <button
              className={`${styles.navItem} ${
                activeTab === "Leads" ? styles.active : ""
              }`}
              onClick={() => setActiveTab("Leads")}
            >
              Leads
            </button>
            <button
              className={`${styles.navItem} ${
                activeTab === "Unverified Leads" ? styles.active : ""
              }`}
              onClick={() => setActiveTab("Unverified Leads")}
            >
              Unverified Leads
            </button>
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                gap: 10,
                width: "100%",
                marginBottom: 8,
                marginTop: 8,
              }}
            >
              <hr className={styles.navItemDivider} />
              <span className={styles.navItemLabel}>BO Management</span>
              <hr
                className={styles.navItemDivider}
                style={{ marginLeft: "auto" }}
              />
            </div>
            <button
              className={`${styles.navItem} ${
                activeTab === "Backoffice" ? styles.active : ""
              }`}
              onClick={() => setActiveTab("Backoffice")}
            >
              Backoffice
            </button>

            <div
              style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                gap: 10,
                width: "100%",
                marginBottom: 8,
                marginTop: 8,
              }}
            >
              <hr className={styles.navItemDivider} />
              <span className={styles.navItemLabel}>Blogs Management</span>
              <hr
                className={styles.navItemDivider}
                style={{ marginLeft: "auto" }}
              />
            </div>
            <button
              className={`${styles.navItem} ${
                activeTab === "Blog Managers" ? styles.active : ""
              }`}
              onClick={() => setActiveTab("Blog Managers")}
            >
              Blog Managers
            </button>
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                gap: 10,
                width: "100%",
                marginBottom: 8,
                marginTop: 8,
              }}
            >
              <hr className={styles.navItemDivider} />
              <span className={styles.navItemLabel}>Careers</span>
              <hr
                className={styles.navItemDivider}
                style={{ marginLeft: "auto" }}
              />
            </div>
            <button
              className={`${styles.navItem} ${
                activeTab === "Applicants" ? styles.active : ""
              }`}
              onClick={() => setActiveTab("Applicants")}
            >
              Applicants
            </button>
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                gap: 10,
                width: "100%",
                marginBottom: 8,
                marginTop: 8,
              }}
            >
              <hr className={styles.navItemDivider} />
              <span className={styles.navItemLabel}>Admin Management</span>
              <hr
                className={styles.navItemDivider}
                style={{ marginLeft: "auto" }}
              />
            </div>
            <button
              className={`${styles.navItem} ${
                activeTab === "Admin Management" ? styles.active : ""
              }`}
              onClick={() => setActiveTab("Admin Management")}
            >
              Admin Management
            </button>
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                gap: 10,
                width: "100%",
                marginBottom: 8,
                marginTop: 8,
              }}
            >
              <hr
                className={`${styles.navItemDivider} ${styles.trashNavDivider}`}
              />
              <span
                className={styles.navItemLabel}
                style={{ color: "#ef4444" }}
              >
                Trash
              </span>
              <hr
                className={`${styles.navItemDivider} ${styles.trashNavDivider}`}
                style={{ marginLeft: "auto" }}
              />
            </div>
            <button
              className={`${styles.navItem} ${styles.trashNavItem} ${
                activeTab === "Trashed Leads" ? styles.activeTrash : ""
              }`}
              onClick={() => setActiveTab("Trashed Leads")}
            >
              Leads
            </button>
            {/* <button
              className={`${styles.navItem} ${styles.trashNavItem} ${
                activeTab === "Trashed Users" ? styles.activeTrash : ""
              }`}
              onClick={() => setActiveTab("Trashed Users")}
            >
              Users
            </button> */}
          </nav>
        </div>

        <div className={styles.content}>
          {activeTab === "Leads" && renderLeadsTab(false, false)}
          {activeTab === "Unverified Leads" && renderLeadsTab(false, true)}
          {activeTab === "Trashed Leads" && renderLeadsTab(true, false)}
          {/* {activeTab === "Trashed Users" && renderUsersTab(true)} */}
          {activeTab === "Backoffice" && renderBackofficeTab()}
          {activeTab === "User Profile" && renderUserProfileTab()}
          {activeTab === "Lead Details" && renderLeadDetailsTab()}
          {activeTab === "Admin Management" && renderAdminManagementTab()}
          {activeTab === "Blog Managers" && renderBlogManagersTab()}
          {activeTab === "Applicants" && renderApplicantsTab()}
        </div>

        <AuthManager
          isOpen={showAuthPopup}
          onClose={() => setShowAuthPopup(false)}
        />

        <DashboardPanel
          isOpen={showUserProfile}
          onClose={() => setShowUserProfile(false)}
          onLogout={handleLogout}
        />

        {/* Message Popup */}
        {showMessagePopup && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(0, 0, 0, 0.5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1000,
            }}
            onClick={() => setShowMessagePopup(null)}
          >
            <div
              style={{
                background: "white",
                borderRadius: "12px",
                padding: "24px",
                maxWidth: "500px",
                width: "90%",
                maxHeight: "80vh",
                overflow: "auto",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "16px",
                }}
              >
                <h3
                  style={{
                    margin: 0,
                    fontSize: "1.25rem",
                    fontWeight: "600",
                    color: "#111827",
                  }}
                >
                  Message
                </h3>
                <button
                  onClick={() => setShowMessagePopup(null)}
                  style={{
                    background: "none",
                    border: "none",
                    fontSize: "1.5rem",
                    cursor: "pointer",
                    color: "#6b7280",
                  }}
                >
                  ✕
                </button>
              </div>
              <div style={{ lineHeight: "1.6", color: "#374151" }}>
                {leads.find((lead) => lead._id === showMessagePopup)?.message}
              </div>
            </div>
          </div>
        )}

        {/* Applicant Message Popup */}
        {showApplicantMsgPopup && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(0, 0, 0, 0.5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1000,
            }}
            onClick={() => setShowApplicantMsgPopup(null)}
          >
            <div
              style={{
                background: "white",
                borderRadius: "12px",
                padding: "24px",
                maxWidth: "500px",
                width: "90%",
                maxHeight: "80vh",
                overflow: "auto",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "16px",
                }}
              >
                <h3
                  style={{
                    margin: 0,
                    fontSize: "1.25rem",
                    fontWeight: "600",
                    color: "#111827",
                  }}
                >
                  Applicant Message
                </h3>
                <button
                  onClick={() => setShowApplicantMsgPopup(null)}
                  style={{
                    background: "none",
                    border: "none",
                    fontSize: "1.5rem",
                    cursor: "pointer",
                    color: "#6b7280",
                  }}
                >
                  ✕
                </button>
              </div>
              <div
                style={{
                  lineHeight: "1.6",
                  color: "#374151",
                  whiteSpace: "pre-wrap",
                }}
              >
                {showApplicantMsgPopup.message || "No message provided."}
              </div>
            </div>
          </div>
        )}

        {showAddBOEForm && (
          <div
            className={signUpStyles.overlay}
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowAddBOEForm(false);
            }}
          >
            <form className={signUpStyles.popup} onSubmit={handleAddBOE}>
              <div className={signUpStyles.header}>
                <h2 className={signUpStyles.title}>Add Backoffice Executive</h2>
                <button
                  type="button"
                  className={signUpStyles.closeBtn}
                  onClick={() => setShowAddBOEForm(false)}
                  aria-label="Close"
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="4" y1="4" x2="16" y2="16" />
                    <line x1="16" y1="4" x2="4" y2="16" />
                  </svg>
                </button>
              </div>
              <div className={signUpStyles.content}>
                <div className={signUpStyles.inputGroup}>
                  <label className={signUpStyles.label}>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "row",
                        alignItems: "center",
                      }}
                    >
                      Username{" "}
                      <span
                        style={{
                          color: "#ef4444",
                          opacity: 0.75,
                          fontSize: "1em",
                          marginLeft: 2,
                        }}
                      >
                        *
                      </span>
                    </div>
                  </label>
                  <input
                    type="text"
                    value={boeForm.username}
                    onChange={(e) =>
                      setBoeForm({ ...boeForm, username: e.target.value })
                    }
                    required
                    className={signUpStyles.input}
                  />
                </div>
                <div className={signUpStyles.inputGroup}>
                  <label className={signUpStyles.label}>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "row",
                        alignItems: "center",
                      }}
                    >
                      Email{" "}
                      <span
                        style={{
                          color: "#ef4444",
                          opacity: 0.75,
                          fontSize: "1em",
                          marginLeft: 2,
                        }}
                      >
                        *
                      </span>
                    </div>
                  </label>
                  <input
                    type="email"
                    value={boeForm.email}
                    onChange={(e) =>
                      setBoeForm({ ...boeForm, email: e.target.value })
                    }
                    required
                    className={signUpStyles.input}
                  />
                </div>
                <div className={signUpStyles.inputGroup}>
                  <label className={signUpStyles.label}>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "row",
                        alignItems: "center",
                      }}
                    >
                      Password{" "}
                      <span
                        style={{
                          color: "#ef4444",
                          opacity: 0.75,
                          fontSize: "1em",
                          marginLeft: 2,
                        }}
                      >
                        *
                      </span>
                    </div>
                  </label>
                  <input
                    type="password"
                    value={boeForm.password}
                    onChange={(e) =>
                      setBoeForm({ ...boeForm, password: e.target.value })
                    }
                    required
                    className={signUpStyles.input}
                  />
                </div>
                {boeFormError && (
                  <div className={signUpStyles.errorMessage}>
                    {boeFormError}
                  </div>
                )}
                <button
                  type="submit"
                  className={`${signUpStyles.btn} ${signUpStyles.primaryBtn}`}
                  disabled={boeFormLoading}
                >
                  {boeFormLoading ? "Adding..." : "Add Executive"}
                </button>
              </div>
            </form>
          </div>
        )}
        {showAddAdminForm && (
          <div
            className={signUpStyles.overlay}
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowAddAdminForm(false);
            }}
          >
            <form className={signUpStyles.popup} onSubmit={handleAddAdmin}>
              <div className={signUpStyles.header}>
                <h2 className={signUpStyles.title}>Add Admin</h2>
                <button
                  type="button"
                  className={signUpStyles.closeBtn}
                  onClick={() => setShowAddAdminForm(false)}
                  aria-label="Close"
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="4" y1="4" x2="16" y2="16" />
                    <line x1="16" y1="4" x2="4" y2="16" />
                  </svg>
                </button>
              </div>
              <div className={signUpStyles.content}>
                <div className={signUpStyles.inputGroup}>
                  <label className={signUpStyles.label}>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "row",
                        alignItems: "center",
                      }}
                    >
                      Username{" "}
                      <span
                        style={{
                          color: "#ef4444",
                          opacity: 0.75,
                          fontSize: "1em",
                          marginLeft: 2,
                        }}
                      >
                        *
                      </span>
                    </div>
                  </label>
                  <input
                    type="text"
                    value={adminForm.username}
                    onChange={(e) =>
                      setAdminForm({ ...adminForm, username: e.target.value })
                    }
                    required
                    className={signUpStyles.input}
                  />
                </div>
                <div className={signUpStyles.inputGroup}>
                  <label className={signUpStyles.label}>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "row",
                        alignItems: "center",
                      }}
                    >
                      Email{" "}
                      <span
                        style={{
                          color: "#ef4444",
                          opacity: 0.75,
                          fontSize: "1em",
                          marginLeft: 2,
                        }}
                      >
                        *
                      </span>
                    </div>
                  </label>
                  <input
                    type="email"
                    value={adminForm.email}
                    onChange={(e) =>
                      setAdminForm({ ...adminForm, email: e.target.value })
                    }
                    required
                    className={signUpStyles.input}
                  />
                </div>
                <div className={signUpStyles.inputGroup}>
                  <label className={signUpStyles.label}>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "row",
                        alignItems: "center",
                      }}
                    >
                      Password{" "}
                      <span
                        style={{
                          color: "#ef4444",
                          opacity: 0.75,
                          fontSize: "1em",
                          marginLeft: 2,
                        }}
                      >
                        *
                      </span>
                    </div>
                  </label>
                  <input
                    type="password"
                    value={adminForm.password}
                    onChange={(e) =>
                      setAdminForm({ ...adminForm, password: e.target.value })
                    }
                    required
                    className={signUpStyles.input}
                  />
                </div>
                {adminFormError && (
                  <div className={signUpStyles.errorMessage}>
                    {adminFormError}
                  </div>
                )}
                <button
                  type="submit"
                  className={`${signUpStyles.btn} ${signUpStyles.primaryBtn}`}
                  disabled={adminFormLoading}
                >
                  {adminFormLoading ? "Adding..." : "Add Admin"}
                </button>
              </div>
            </form>
          </div>
        )}
        {showAddBlogUserForm && (
          <div
            className={signUpStyles.overlay}
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowAddBlogUserForm(false);
            }}
          >
            <form className={signUpStyles.popup} onSubmit={handleAddBlogUser}>
              <div className={signUpStyles.header}>
                <h2 className={signUpStyles.title}>Add Blog Manager</h2>
                <button
                  type="button"
                  className={signUpStyles.closeBtn}
                  onClick={() => setShowAddBlogUserForm(false)}
                  aria-label="Close"
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="4" y1="4" x2="16" y2="16" />
                    <line x1="16" y1="4" x2="4" y2="16" />
                  </svg>
                </button>
              </div>
              <div className={signUpStyles.content}>
                <div className={signUpStyles.inputGroup}>
                  <label className={signUpStyles.label}>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "row",
                        alignItems: "center",
                      }}
                    >
                      Name{" "}
                      <span
                        style={{
                          color: "#ef4444",
                          opacity: 0.75,
                          fontSize: "1em",
                          marginLeft: 2,
                        }}
                      >
                        *
                      </span>
                    </div>
                  </label>
                  <input
                    type="text"
                    value={blogUserForm.name}
                    onChange={(e) =>
                      setBlogUserForm({ ...blogUserForm, name: e.target.value })
                    }
                    required
                    className={signUpStyles.input}
                  />
                </div>
                <div className={signUpStyles.inputGroup}>
                  <label className={signUpStyles.label}>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "row",
                        alignItems: "center",
                      }}
                    >
                      Email{" "}
                      <span
                        style={{
                          color: "#ef4444",
                          opacity: 0.75,
                          fontSize: "1em",
                          marginLeft: 2,
                        }}
                      >
                        *
                      </span>
                    </div>
                  </label>
                  <input
                    type="email"
                    value={blogUserForm.email}
                    onChange={(e) =>
                      setBlogUserForm({
                        ...blogUserForm,
                        email: e.target.value,
                      })
                    }
                    required
                    className={signUpStyles.input}
                  />
                </div>
                <div className={signUpStyles.inputGroup}>
                  <label className={signUpStyles.label}>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "row",
                        alignItems: "center",
                      }}
                    >
                      Password{" "}
                      <span
                        style={{
                          color: "#ef4444",
                          opacity: 0.75,
                          fontSize: "1em",
                          marginLeft: 2,
                        }}
                      >
                        *
                      </span>
                    </div>
                  </label>
                  <input
                    type="password"
                    value={blogUserForm.password}
                    onChange={(e) =>
                      setBlogUserForm({
                        ...blogUserForm,
                        password: e.target.value,
                      })
                    }
                    required
                    className={signUpStyles.input}
                  />
                </div>
                {blogUserFormError && (
                  <div className={signUpStyles.errorMessage}>
                    {blogUserFormError}
                  </div>
                )}
                <button
                  type="submit"
                  className={`${signUpStyles.btn} ${signUpStyles.primaryBtn}`}
                  disabled={blogUserFormLoading}
                >
                  {blogUserFormLoading ? "Adding..." : "Add Blog Manager"}
                </button>
              </div>
            </form>
          </div>
        )}
        {showChangePasswordModal && selectedBlogUserForPassword && (
          <div
            className={signUpStyles.overlay}
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowChangePasswordModal(false);
                setSelectedBlogUserForPassword(null);
                setNewPassword("");
                setPasswordChangeError("");
              }
            }}
          >
            <form
              className={signUpStyles.popup}
              onSubmit={handleChangePassword}
            >
              <div className={signUpStyles.header}>
                <h2 className={signUpStyles.title}>
                  Change Password for {selectedBlogUserForPassword.name}
                </h2>
                <button
                  type="button"
                  className={signUpStyles.closeBtn}
                  onClick={() => {
                    setShowChangePasswordModal(false);
                    setSelectedBlogUserForPassword(null);
                    setNewPassword("");
                    setPasswordChangeError("");
                  }}
                  aria-label="Close"
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="4" y1="4" x2="16" y2="16" />
                    <line x1="16" y1="4" x2="4" y2="16" />
                  </svg>
                </button>
              </div>
              <div className={signUpStyles.content}>
                <div className={signUpStyles.inputGroup}>
                  <label className={signUpStyles.label}>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "row",
                        alignItems: "center",
                      }}
                    >
                      New Password{" "}
                      <span
                        style={{
                          color: "#ef4444",
                          opacity: 0.75,
                          fontSize: "1em",
                          marginLeft: 2,
                        }}
                      >
                        *
                      </span>
                    </div>
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={6}
                    className={signUpStyles.input}
                    placeholder="Minimum 6 characters"
                  />
                </div>
                {passwordChangeError && (
                  <div className={signUpStyles.errorMessage}>
                    {passwordChangeError}
                  </div>
                )}
                <button
                  type="submit"
                  className={`${signUpStyles.btn} ${signUpStyles.primaryBtn}`}
                  disabled={passwordChangeLoading}
                >
                  {passwordChangeLoading ? "Changing..." : "Change Password"}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </>
  );
}
