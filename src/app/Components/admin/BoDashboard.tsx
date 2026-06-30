"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import AuthManager from "./AuthManager";
import styles from "./AdminDashboard.module.css";
import UserManagement from "./UserManagement";
import DashboardPanel from "./DashboardPanel";
import BOEUser from "../../../models/boe/BOEUser"; // Only if needed for SSR, otherwise use fetch
import signUpStyles from "./SignUpPanel.module.css";
import toast from "react-hot-toast";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";

// Import the Lead interface from the schema
interface ILead {
  _id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  message: string;
  service: string[]; // Changed to array
  assignedBo: "none" | "BOE1" | "BOE2" | "BOE3" | "BOE4" | "BOE5";
  assignedTo?: string; // BOEUser ID
  status: "pending" | "assigned" | "completed" | "in progress";
  trash?: boolean;
  verified?: boolean; // Added verified property
  createdAt: string;
  client?: {
    // Making client optional as it's not in the DB schema
    name: string;
    initials: string;
    profilePicture?: string;
  };
}

type User = {
  _id: string;
  userName: string; // Changed from 'name'
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

type Tab =
  | "Leads"
  | "Unverified Leads"
  // | "Users"
  | "Backoffice"
  | "Backoffice Executives"
  | "User Profile"
  | "Lead Details"
  | "Trashed Leads";
// | "Trashed Users";

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
  const [currentBoeUser, setCurrentBoeUser] = useState<any>(null);
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
  const [assignedLeads, setAssignedLeads] = useState<ILead[]>([]);
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
  // Add state for pagination
  const [backofficePage, setBackofficePage] = useState(1);
  const BACKOFFICE_PAGE_SIZE = 20;
  // Add at the top of the component, after useState declarations
  const [copiedCell, setCopiedCell] = useState<{
    id: string;
    field: string;
  } | null>(null);
  const [showMobileOverlay, setShowMobileOverlay] = useState(false);
  const [initiatedLeads, setInitiatedLeads] = useState<ILead[]>([]);

  // Compute filteredLeads at the top level for pagination and useEffect
  let filteredBackofficeLeads = assignedLeads;
  if (searchQuery.trim()) {
    const q = searchQuery.trim().toLowerCase();
    filteredBackofficeLeads = filteredBackofficeLeads.filter(
      (lead) =>
        lead.fullName.toLowerCase().includes(q) ||
        lead.email.toLowerCase().includes(q) ||
        lead.phoneNumber.toLowerCase().includes(q) ||
        (Array.isArray(lead.service)
          ? lead.service.join(", ").toLowerCase().includes(q)
          : String(lead.service).toLowerCase().includes(q)),
    );
  }
  if (filterStatus) {
    filteredBackofficeLeads = filteredBackofficeLeads.filter(
      (lead) => lead.status === filterStatus,
    );
  }
  const totalBackofficePages = Math.max(
    1,
    Math.ceil(filteredBackofficeLeads.length / BACKOFFICE_PAGE_SIZE),
  );
  const paginatedBackofficeLeads = filteredBackofficeLeads.slice(
    (backofficePage - 1) * BACKOFFICE_PAGE_SIZE,
    backofficePage * BACKOFFICE_PAGE_SIZE,
  );

  useEffect(() => {
    if (backofficePage > totalBackofficePages) setBackofficePage(1);
    // eslint-disable-next-line
  }, [filteredBackofficeLeads.length]);

  useEffect(() => {
    setMounted(true);
    fetchLeads(1); // Fetch all leads initially
    fetchUsers(1); // Fetch all users initially
    fetchAssignedLeads(); // Fetch assigned leads
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

    // Fetch current BOE user data
    fetch("/api/boe/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setCurrentBoeUser(data.user);
        }
      })
      .catch((error) => {
        console.error("Error fetching current BOE user:", error);
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
  // To render service in initiated leads
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

  useEffect(() => {
    if (activeTab === "Unverified Leads") {
      fetchUnverifiedLeads(1); // Always fetch page 1 for unverified leads (no pagination)
    } else if (activeTab === "Leads") {
      fetchLeads(leadsCurrentPage);
    } else if (activeTab === "Trashed Leads") {
      fetchTrashedLeads(leadsCurrentPage);
    } else if (activeTab === "Backoffice Executives") {
      fetchAssignedLeads();
    }

    // Fetch stats when Leads tab is active
    if (activeTab === "Leads") {
      fetchLeadsStats();
    }
  }, [leadsCurrentPage, activeTab]);

  // useEffect(() => {
  //   if (activeTab === "Users" || activeTab === "Trashed Users") {
  //     fetchUsers(usersCurrentPage);
  //   }

  //   // Fetch stats when Users tab is active
  //   if (activeTab === "Users") {
  //     fetchUsersStats();
  //   }
  // }, [usersCurrentPage, activeTab]);

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

  const fetchAssignedLeads = async () => {
    setIsLeadsLoading(true);
    try {
      const response = await fetch("/api/boe/assigned-leads");
      const data = await response.json();

      if (data.success) {
        setAssignedLeads(data.assignedLeads || []);
      } else {
        console.error("Error fetching assigned leads:", data.error);
      }
    } catch (error) {
      console.error("Error fetching assigned leads:", error);
    } finally {
      setIsLeadsLoading(false);
    }
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

  useLogoutWarning();

  if (!mounted) {
    return null;
  }

  const handleExport = (type: "leads" | "users") => {
    if (type === "leads") {
      const leadsToExport = leads.filter((lead) => !lead.trash);
      if (leadsToExport.length === 0) {
        toast.error("No active leads to export.", errorToast);
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
      toast.success("Leads exported successfully", successToast);
    } else if (type === "users") {
      const usersToExport = users.filter((user) => !user.trash);
      if (usersToExport.length === 0) {
        toast.error("No active users to export.", errorToast);
        return;
      }
      let csvContent = "data:text/csv;charset=utf-8,";
      csvContent +=
        "Verified,User ID,Name,Email,Status,Request Status,Total Leads,Created At\r\n";
      usersToExport.forEach((user) => {
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
      toast.success("Users exported successfully", successToast);
    }
  };

  const handleBulkAction = async (
    action: "trash" | "download" | "restore" | "deletePermanently",
    type: "leads" | "users",
  ) => {
    const selectedIds = type === "leads" ? selectedLeads : selectedUsers;
    if (selectedIds.length === 0) {
      toast.error(
        `Please select at least one ${type === "leads" ? "lead" : "user"}.`,
        errorToast,
      );
      return;
    }

    const itemLabel = type === "leads" ? "lead" : "user";
    const itemLabelPlural = type === "leads" ? "leads" : "users";

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
            await fetchAssignedLeads(); // Refresh assigned leads after trash
            toast.success(
              `${selectedIds.length} ${selectedIds.length === 1 ? itemLabel : itemLabelPlural} moved to trash`,
              successToast,
            );
          } else {
            toast.error(
              `Failed to move ${itemLabelPlural} to trash`,
              errorToast,
            );
          }
        } catch (error) {
          toast.error(`Failed to move ${itemLabelPlural} to trash`, errorToast);
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
            await fetchAssignedLeads(); // Refresh assigned leads after restore
            toast.success(
              `${selectedIds.length} ${selectedIds.length === 1 ? itemLabel : itemLabelPlural} restored successfully`,
              successToast,
            );
          } else {
            toast.error(`Failed to restore ${itemLabelPlural}`, errorToast);
          }
        } catch (error) {
          toast.error(`Failed to restore ${itemLabelPlural}`, errorToast);
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
            toast.success(
              `${selectedIds.length} ${selectedIds.length === 1 ? itemLabel : itemLabelPlural} permanently deleted`,
              successToast,
            );
          } else {
            toast.error(
              `Failed to permanently delete ${itemLabelPlural}`,
              errorToast,
            );
          }
        } catch (error) {
          toast.error(
            `Failed to permanently delete ${itemLabelPlural}`,
            errorToast,
          );
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
        toast.success(
          `${selectedIds.length} ${selectedIds.length === 1 ? itemLabel : itemLabelPlural} downloaded successfully`,
          successToast,
        );
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
            toast.success(
              `${selectedIds.length} ${selectedIds.length === 1 ? itemLabel : itemLabelPlural} moved to trash`,
              successToast,
            );
          } else {
            toast.error(
              `Failed to move ${itemLabelPlural} to trash`,
              errorToast,
            );
          }
        } catch (error) {
          toast.error(`Failed to move ${itemLabelPlural} to trash`, errorToast);
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
            toast.success(
              `${selectedIds.length} ${selectedIds.length === 1 ? itemLabel : itemLabelPlural} restored successfully`,
              successToast,
            );
          } else {
            toast.error(`Failed to restore ${itemLabelPlural}`, errorToast);
          }
        } catch (error) {
          toast.error(`Failed to restore ${itemLabelPlural}`, errorToast);
        }
      } else if (action === "deletePermanently") {
        try {
          const res = await fetch("/api/user/bulk-update", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userIds: selectedIds }),
          });
          if (res.ok) {
            setUsers((prev) =>
              prev.filter((u) => !selectedIds.includes(u._id)),
            );
            setSelectedUsers([]);
            toast.success(
              `${selectedIds.length} ${selectedIds.length === 1 ? itemLabel : itemLabelPlural} permanently deleted`,
              successToast,
            );
          } else {
            toast.error(
              `Failed to permanently delete ${itemLabelPlural}`,
              errorToast,
            );
          }
        } catch (error) {
          toast.error(
            `Failed to permanently delete ${itemLabelPlural}`,
            errorToast,
          );
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
        toast.success(
          `${selectedIds.length} ${selectedIds.length === 1 ? itemLabel : itemLabelPlural} downloaded successfully`,
          successToast,
        );
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
    setShowActionMenu(null);
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
    const updates: Partial<ILead> = { assignedTo: assignedToId || undefined };
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
                  assignedTo: assignedToId || undefined,
                  status: assignedToId ? "in progress" : "pending",
                }
              : l,
          ),
        );
        setShowAssignedDropdown(null);
        toast.success("Lead assignment updated", successToast);
      } else {
        toast.error("Failed to update lead assignment", errorToast);
      }
    } catch (error) {
      toast.error("Failed to update lead assignment", errorToast);
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

  const updateLead = async (
    leadId: string,
    updates: Partial<ILead>,
    successMessage?: string,
  ) => {
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
        if (successMessage) {
          toast.success(successMessage, successToast);
        }
        return true;
      }
      toast.error("Failed to update lead", errorToast);
      return false;
    } catch (error) {
      toast.error("Failed to update lead", errorToast);
      return false;
    }
  };

  const handleActionIconClick = async (leadId: string, action: string) => {
    if (action === "delete" || action === "trash") {
      await updateLead(leadId, { trash: true }, "Lead moved to trash");
      await fetchAssignedLeads(); // Refresh assigned leads after trash
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
        toast.success("Lead downloaded successfully", successToast);
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

  const updateUser = async (
    userId: string,
    updates: Partial<User>,
    successMessage?: string,
  ) => {
    try {
      const res = await fetch("/api/user/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, updates }),
      });

      if (res.ok) {
        // Refetch users to get the latest data
        fetchUsers(usersCurrentPage);
        if (successMessage) {
          toast.success(successMessage, successToast);
        }
        return true;
      }
      toast.error("Failed to update user", errorToast);
      return false;
    } catch (error) {
      toast.error("Failed to update user", errorToast);
      return false;
    }
  };

  const handleTrashUser = (userId: string) => {
    updateUser(userId, { trash: true }, "User moved to trash");
  };

  const handleRestoreUser = (userId: string) => {
    updateUser(userId, { trash: false }, "User restored successfully");
  };

  const handlePermanentDeleteUser = async (userId: string) => {
    if (
      !window.confirm("Are you sure you want to permanently delete this user?")
    )
      return;
    try {
      // Assumes an endpoint for permanent deletion.
      const res = await fetch("/api/user/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (res.ok) {
        setUsers((prev) => prev.filter((u) => u._id !== userId));
        toast.success("User permanently deleted", successToast);
      } else {
        toast.error("Failed to permanently delete user", errorToast);
      }
    } catch (error) {
      toast.error("Failed to permanently delete user", errorToast);
    }
  };

  const handleBlockUser = (userId: string) => {
    if (window.confirm("Are you sure you want to block this user?")) {
      updateUser(userId, { status: "blocked" }, "User blocked successfully");
    }
  };

  // Helper function to format date
  const formatDate = (dateString: string) => {
    if (!dateString) return "Date unavailable";

    const date = new Date(dateString);

    // Check if date is valid
    if (isNaN(date.getTime())) {
      return "Invalid date";
    }

    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const handleCopyCell = (id: string, field: string, value: string) => {
    if (
      typeof navigator !== "undefined" &&
      navigator.clipboard &&
      typeof navigator.clipboard.writeText === "function"
    ) {
      navigator.clipboard.writeText(value);
      setCopiedCell({ id, field });
      setTimeout(() => setCopiedCell(null), 1200);
      toast.success("Copied to clipboard", successToast);
    } else {
      toast.error(
        "Clipboard copy is not supported in this environment.",
        errorToast,
      );
    }
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
                title="Export all leads"
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
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22,4 12,14.01 9,11.01" />
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
                  disabled
                  title="Only Admin can delete permanently"
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
                      ? !lead.assignedTo
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
                          color: lead.fullName ? "inherit" : "#6b7280",
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
                      {Array.isArray(lead.service) &&
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
                        <span style={{ color: "#6b7280" }}>None</span>
                      )}
                    </td>
                    <td data-label="Assigned">
                      {!lead.assignedTo ? (
                        <button
                          onClick={() => handleTakeoverLead(lead._id)}
                          style={{
                            backgroundColor: "#10b981",
                            color: "white",
                            border: "none",
                            padding: "6px 12px",
                            borderRadius: "4px",
                            fontSize: "12px",
                            fontWeight: "500",
                            cursor: !isTrashed ? "pointer" : "not-allowed",
                            transition: "background-color 0.2s",
                          }}
                          onMouseOver={(e) =>
                            (e.currentTarget.style.backgroundColor = "#059669")
                          }
                          onMouseOut={(e) =>
                            (e.currentTarget.style.backgroundColor = "#10b981")
                          }
                          title={
                            isTrashed
                              ? "Restore to take over"
                              : "Take over this lead"
                          }
                          disabled={isTrashed}
                        >
                          Take Over
                        </button>
                      ) : (
                        <span style={{ color: "#374151", fontWeight: 500 }}>
                          {
                            boeUsers.find((u) => u._id === lead.assignedTo)
                              ?.userName
                          }
                        </span>
                      )}
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
                              </svg>{" "}
                            </button>
                            <button
                              className={styles.actionIcon}
                              style={{
                                color: "#cbd5e1",
                                cursor: "not-allowed",
                              }}
                              title="Only admin can delete..."
                              disabled
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
                              title="Trash"
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

    // Use stats data if available (for Users tab), otherwise calculate from paginated data
    // const stats =
    //   activeTab === "Users" && usersStats
    //     ? usersStats
    //     : {
    //         total: tabUsers.length,
    //         newToday: tabUsers.filter(
    //           (u: User) =>
    //             new Date(u.createdAt) >
    //             new Date(Date.now() - 24 * 60 * 60 * 1000)
    //         ).length,
    //         last30Days: tabUsers.filter(
    //           (u: User) =>
    //             new Date(u.createdAt) >
    //             new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    //         ).length,
    //         suspended: tabUsers.filter(
    //           (u: User) =>
    //             u.status === "Suspended" ||
    //             u.status === "suspended" ||
    //             u.status === "blocked"
    //         ).length,
    //         suspendedToday: tabUsers.filter(
    //           (u: User) =>
    //             (u.status === "Suspended" ||
    //               u.status === "suspended" ||
    //               u.status === "blocked") &&
    //             new Date(u.createdAt) >
    //               new Date(Date.now() - 24 * 60 * 60 * 1000)
    //         ).length,
    //         suspendedLast30Days: tabUsers.filter(
    //           (u: User) =>
    //             (u.status === "Suspended" ||
    //               u.status === "suspended" ||
    //               u.status === "blocked") &&
    //             new Date(u.createdAt) >
    //               new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    //         ).length,
    //       };

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
                title="Export all users"
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
        {/* <div
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
        </div> */}
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
                                textTransform: "capitalize",
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
                            user.status === "active" || user.status === "Active"
                              ? "#10b981"
                              : user.status === "blocked"
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
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "flex-start",
                          gap: 8,
                        }}
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
                              </svg>{" "}
                            </button>
                            <button
                              className={styles.actionIcon}
                              style={{
                                color: "#cbd5e1",
                                cursor: "not-allowed",
                                opacity: 0.5,
                              }}
                              title="Delete Permanently"
                              disabled
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
                            <button
                              onClick={() => handleBlockUser(user._id)}
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
          <h2>My Assigned Leads</h2>
          <p>Manage your assigned leads and track their progress</p>
        </div>
        <div className={styles.headerRight}></div>
      </div>

      <div
        className={styles.statsContainerCentered}
        style={isMobile ? { flexDirection: "column", gap: "1rem" } : {}}
      >
        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <span className={styles.statTitle}>My Assigned Leads</span>
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
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {boeUsers
              .filter((u: User) => !u.trash)
              .map((user: User) => (
                <tr key={user._id}>
                  <td data-label="Verified">
                    {user.verified ? (
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
                  <td data-label="Action" style={{ display: "flex" }}>
                    <button
                      onClick={() => handleViewUser(user)}
                      className={styles.actionIcon}
                      style={{
                        color: "#2563eb",
                        width: 32,
                        height: 32,
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
                    <button
                      onClick={() => handleBlockUser(user._id)}
                      className={styles.actionIcon}
                      style={{ color: "#ef4444" }}
                      title="Block"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
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
                    <button
                      onClick={() => handleTrashUser(user._id)}
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

  const renderBackofficeExecutivesTab = () => {
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

    // Remove filtering, pagination, and useEffect from here
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
            <h2>My Assigned Leads</h2>
            <p>Manage your assigned leads and track their progress</p>
          </div>
          <div className={styles.headerRight}>
            <button
              className={styles.exportBtn}
              title="Export all assigned leads"
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

        <div
          className={styles.tableControls}
          style={isMobile ? { flexDirection: "column", gap: "1rem" } : {}}
        >
          <div className={styles.leftControls}>
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
            <span
              style={{
                fontSize: "0.875rem",
                color: "#6b7280",
                marginLeft: "12px",
              }}
            >
              Showing {paginatedBackofficeLeads.length} leads assigned to you
            </span>
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
              {/* Removed Assigned filter dropdown */}
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
                    checked={
                      paginatedBackofficeLeads.length > 0 &&
                      paginatedBackofficeLeads.every((lead) =>
                        selectedLeads.includes(lead._id),
                      )
                    }
                    onChange={() => handleSelectAll(paginatedBackofficeLeads)}
                    className={styles.checkbox}
                  />
                </th>
                <th>Verified</th>
                <th>Lead ID</th>
                <th>Client</th>
                <th>Email</th>
                <th>Number</th>
                <th>Message</th>
                <th>Service</th>
                <th>Completed</th>
                <th>Status</th>
                <th>Created At</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedBackofficeLeads
                .filter((lead) => {
                  const lowerCaseQuery = searchQuery.toLowerCase().trim();
                  if (!lowerCaseQuery && !filterStatus) return true;

                  const searchMatch =
                    !lowerCaseQuery ||
                    lead.fullName.toLowerCase().includes(lowerCaseQuery) ||
                    lead._id.toLowerCase().includes(lowerCaseQuery) ||
                    lead.phoneNumber.includes(lowerCaseQuery) ||
                    lead.email.toLowerCase().includes(lowerCaseQuery) ||
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

                  return searchMatch && statusMatch;
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
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
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
                            cursor: "pointer",
                            userSelect: "all",
                            position: "relative",
                          }}
                          onClick={() =>
                            handleCopyCell(lead._id, "name", lead.fullName)
                          }
                          title="Click to select"
                        >
                          {lead.fullName}
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
                      </div>
                    </td>
                    <td
                      className={styles.emailCell}
                      onClick={() =>
                        window.open(`mailto:${lead.email}`, "_blank")
                      }
                      style={{ cursor: "pointer", color: "#2563eb" }}
                      data-label="Email"
                    >
                      {lead.email}
                    </td>
                    <td
                      onClick={() =>
                        window.open(`tel:${lead.phoneNumber}`, "_blank")
                      }
                      style={{ cursor: "pointer", color: "#2563eb" }}
                      data-label="Number"
                    >
                      {lead.phoneNumber}
                    </td>
                    <td data-label="Message">
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
                    </td>
                    <td data-label="Service">
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
                            Array.isArray(lead.service)
                              ? lead.service.join(", ")
                              : lead.service || "",
                          )
                        }
                        title="Click to select"
                      >
                        {Array.isArray(lead.service)
                          ? lead.service.join(", ")
                          : lead.service}
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
                    </td>
                    <td data-label="Completed">
                      <button
                        onClick={() => handleMarkAsCompleted(lead._id)}
                        disabled={lead.status === "completed"}
                        style={{
                          padding: "6px 12px",
                          borderRadius: "6px",
                          border: "none",
                          fontSize: "12px",
                          fontWeight: "500",
                          cursor:
                            lead.status === "completed"
                              ? "not-allowed"
                              : "pointer",
                          backgroundColor:
                            lead.status === "completed" ? "#9ca3af" : "#10b981",
                          color:
                            lead.status === "completed" ? "#6b7280" : "white",
                          transition: "all 0.2s ease",
                        }}
                      >
                        Completed
                      </button>
                    </td>
                    <td data-label="Status">
                      <span
                        style={{
                          color: getStatusColor(lead.status || "pending"),
                          fontWeight: 500,
                          fontSize: 14,
                          textTransform: "capitalize",
                        }}
                      >
                        {(lead.status || "pending").charAt(0).toUpperCase() +
                          (lead.status || "pending").slice(1)}
                      </span>
                    </td>
                    <td data-label="Created At">
                      {formatDate(lead.createdAt)}
                    </td>
                    <td data-label="Actions">
                      <div
                        style={{
                          display: "flex",
                          gap: "8px",
                          alignItems: "center",
                        }}
                      >
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
                        <button
                          onClick={() =>
                            handleActionIconClick(lead._id, "trash")
                          }
                          className={styles.actionIcon}
                          style={{ color: "#ef4444" }}
                          title="Trash"
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
                        </button>
                        <button
                          onClick={() => {
                            setSelectedLeadForDetails(lead);
                            setActiveTab("Lead Details");
                          }}
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
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        <div className={styles.pagination}>
          <button
            className={styles.paginationBtn}
            onClick={() => setBackofficePage((p) => Math.max(1, p - 1))}
            disabled={backofficePage === 1}
          >
            ← Previous
          </button>
          <div className={styles.pageNumbers}>
            <span>
              Page {backofficePage} of {totalBackofficePages}
            </span>
          </div>
          <button
            className={styles.paginationBtn}
            onClick={() =>
              setBackofficePage((p) => Math.min(totalBackofficePages, p + 1))
            }
            disabled={backofficePage === totalBackofficePages}
          >
            Next →
          </button>
        </div>
      </div>
    );
  };

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
                background: "linear-gradient(135deg, #b40068 0%, #a0005e 100%)",
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
              {user.profilePicture ? (
                <img
                  src={user.profilePicture}
                  alt={user.userName}
                  style={{
                    width: "100%",
                    height: "100%",
                    borderRadius: "50%",
                    objectFit: "cover",
                    textTransform: "capitalize",
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
                {user.userName}
              </span>
              {user.verified && (
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
              <div style={{ color: "#374151", fontSize: 20, fontWeight: 500 }}>
                Email:{" "}
                <span style={{ color: "#2563eb", fontWeight: 500 }}>
                  {user.email}
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
                            Name: {lead.fullName}
                          </div>
                          <div
                            style={{
                              color: "#64748b",
                              fontSize: "14px",
                              marginBottom: "4px",
                            }}
                          >
                            Email: {lead.email}
                          </div>
                          <div style={{ color: "#64748b", fontSize: "14px" }}>
                            Service:{" "}
                            {Array.isArray(lead.service)
                              ? lead.service[0]
                              : lead.service}
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
                              background: "#fff",
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
                  {lead.email || "—"}
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
                <span style={{ color: "#2563eb", fontWeight: 500 }}>
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
                        padding: "8px 0",
                        fontWeight: 500,
                        fontSize: 20,
                        textTransform: "capitalize",
                      }}
                    >
                      {service}
                    </span>
                  ))
                ) : (
                  <span
                    style={{
                      color: "#6b7280",
                      padding: "8px 0",
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
                }}
              >
                {lead.message || "—"}
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
                    borderRadius: 8,
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
                {!lead.assignedTo ? (
                  <button
                    onClick={() => handleTakeoverLead(lead._id)}
                    style={{
                      color: "#10b981",
                      fontSize: 20,
                      fontWeight: 500,
                    }}
                    title="Take over this lead"
                  >
                    Take Over
                  </button>
                ) : (
                  <span
                    style={{
                      color: getStatusColor(lead.status),
                      fontWeight: 500,
                      fontSize: 20,
                      textTransform: "capitalize",
                    }}
                  >
                    {boeUsers.find((u) => u._id === lead.assignedTo)?.userName}
                  </span>
                )}
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
  };

  const handleDeleteUser = async (user: User) => {
    // Implement logic to delete user
  };

  const handlePermanentDeleteLead = async (leadId: string) => {
    if (
      !window.confirm("Are you sure you want to permanently delete this lead?")
    )
      return;
    try {
      // Assumes an endpoint for permanent deletion. Create if it doesn't exist.
      const res = await fetch("/api/lead/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId }),
      });
      if (res.ok) {
        setLeads((prev) => prev.filter((l) => l._id !== leadId));
        toast.success("Lead permanently deleted", successToast);
      } else {
        toast.error("Failed to permanently delete lead", errorToast);
      }
    } catch (error) {
      toast.error("Failed to permanently delete lead", errorToast);
    }
  };

  const handleRestoreLead = async (leadId: string) => {
    await updateLead(leadId, { trash: false }, "Lead restored successfully");
    await fetchAssignedLeads(); // Refresh assigned leads after restore
  };

  const handleLogout = async () => {
    try {
      const response = await fetch("/api/boe/logout", {
        method: "POST",
        credentials: "include",
      });

      if (response.ok) {
        // Redirect to login page or reload the page
        window.location.href = "/";
      } else {
        toast.error("Logout failed. Please try again.", errorToast);
      }
    } catch (error) {
      toast.error("Error during logout. Please try again.", errorToast);
    }
  };

  const handleTakeoverLead = async (leadId: string) => {
    try {
      const response = await fetch("/api/boe/assign-lead", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          leadId: leadId,
        }),
      });

      if (response.ok) {
        // Refresh the leads data based on active tab
        if (activeTab === "Unverified Leads") {
          fetchUnverifiedLeads(leadsCurrentPage);
        } else if (activeTab === "Trashed Leads") {
          fetchTrashedLeads(leadsCurrentPage);
        } else {
          fetchLeads(leadsCurrentPage);
        }
        toast.success("Lead taken over successfully", successToast);
      } else {
        const errorData = await response.json();
        toast.error(
          errorData.message || "Failed to take over lead",
          errorToast,
        );
      }
    } catch (error) {
      toast.error("Error taking over lead. Please try again.", errorToast);
    }
  };

  const handleMarkAsCompleted = async (leadId: string) => {
    try {
      const success = await updateLead(
        leadId,
        { status: "completed" },
        "Lead marked as completed",
      );
      if (success) {
        await fetchAssignedLeads(); // Refresh assigned leads after status update
      }
    } catch (error) {
      toast.error("Failed to mark lead as completed", errorToast);
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
              {currentBoeUser?.userName || "BOE User"}
            </div>
            <div
              className={styles.profileEmail}
              style={{ width: "100%", wordWrap: "break-word" }}
            >
              {currentBoeUser?.email || "boe@company.com"}
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
            {/* <button
              className={`${styles.navItem} ${
                activeTab === "Users" ? styles.active : ""
              }`}
              onClick={() => setActiveTab("Users")}
            >
              Users
            </button> */}
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
                activeTab === "Backoffice Executives" ? styles.active : ""
              }`}
              onClick={() => setActiveTab("Backoffice Executives")}
            >
              My Assigned Leads
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
          {/* {activeTab === "Users" && renderUsersTab(false)} */}
          {activeTab === "Trashed Leads" && renderLeadsTab(true, false)}
          {/* {activeTab === "Trashed Users" && renderUsersTab(true)} */}
          {activeTab === "Backoffice Executives" &&
            renderBackofficeExecutivesTab()}
          {activeTab === "User Profile" && renderUserProfileTab()}
          {activeTab === "Lead Details" && renderLeadDetailsTab()}
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
                    fontWeight: "400",
                    color: "#1e293b",
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
      </div>
    </>
  );
}
