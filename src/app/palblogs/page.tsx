"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import LeftPanel from "./Sections/LeftPanel";
import AddBlogSection from "./Sections/AddBlog/AddBlog";
import ManageBlogsSection from "./Sections/ManageBlogs/ManageBlogs";
import ManageCommentsSection from "./Sections/ManageComments/ManageComments";
import TrashedBlogsSection from "./Sections/TrashedBlogs/TrashedBlogs";
import TrashedCommentsSection from "./Sections/TrashedComments/TrashedComments";
import AnnouncementsSection from "./Sections/Announcements/Announcements";

import "./page.css";

const BlogManagerLoginPanel = dynamic(
  () => import("../Components/admin/BlogManagerLoginPanel"),
  { ssr: false },
);

/* 👇 SAME union type, local to this file */
type SectionKey =
  | "add-blog"
  | "manage-blogs"
  | "manage-comments"
  | "announcements"
  | "trash-blogs"
  | "trash-comments";

export default function DashboardPage() {
  const [activeSection, setActiveSection] = useState<SectionKey>("add-blog");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check authentication status on component mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      // First check if user is logged in as admin
      const adminResponse = await fetch("/api/admin/me");
      if (adminResponse.ok) {
        setIsLoggedIn(true);
        setIsLoading(false);
        return;
      }

      // If not admin, check if user is logged in as blog manager
      const blogManagerResponse = await fetch("/api/blog-manager/me");
      if (blogManagerResponse.ok) {
        setIsLoggedIn(true);
        setIsLoading(false);
        return;
      }

      // If neither, user is not logged in
      setIsLoggedIn(false);
    } catch (error) {
      setIsLoggedIn(false);
    } finally {
      setIsLoading(false);
    }
  };

  // This handler should be called by BlogManagerLoginPanel on successful login
  function handleLoginSuccess() {
    setIsLoggedIn(true);
  }

  if (isLoading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        background: 'rgba(255,255,255,0.85)',
        backdropFilter: 'blur(4px)',
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        justifyContent: 'center',
        gap: '16px',
        position: 'absolute',
        inset: 0,
        zIndex: 10000,
      }}>
        <div style={{ width: '150px', height: '150px' }}>
          <DotLottieReact src="/loading.lottie" loop autoplay />
        </div>
        <p style={{ fontSize: '1.1rem', fontWeight: 500, color: '#1e293b', margin: 0 }}>Authenticating...</p>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "rgba(255,255,255,0.95)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <BlogManagerLoginPanel
          isOpen={true}
          onClose={() => {}}
          onLoginSuccess={handleLoginSuccess}
        />
      </div>
    );
  }

  return (
    <div className="dashboard-layout">
      <LeftPanel activeSection={activeSection} onChange={setActiveSection} />

      <div className="right-panel">
        {activeSection === "add-blog" && <AddBlog />}
        {activeSection === "manage-blogs" && <ManageBlogs />}
        {activeSection === "manage-comments" && <ManageComments />}
        {activeSection === "announcements" && <AnnouncementsSection />}
        {activeSection === "trash-blogs" && <TrashedBlogs />}
        {activeSection === "trash-comments" && <TrashedComments />}
      </div>
    </div>
  );
}

/* Placeholder sections */
function AddBlog() {
  return <AddBlogSection />;
}
function ManageBlogs() {
  return <ManageBlogsSection />;
}
function ManageComments() {
  return <ManageCommentsSection />;
}
function TrashedBlogs() {
  return <TrashedBlogsSection />;
}
function TrashedComments() {
  return <TrashedCommentsSection />;
}
