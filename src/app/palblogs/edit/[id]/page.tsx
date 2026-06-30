"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import LeftPanel from "../../Sections/LeftPanel";
import EditBlogSection from "../../Sections/EditBlog/EditBlog"; // adjust path to your EditBlog.tsx

import "../../page.css";

const BlogManagerLoginPanel = dynamic(
  () => import("../../../Components/admin/BlogManagerLoginPanel"),
  { ssr: false },
);

export default function EditBlogPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const adminResponse = await fetch("/api/admin/me");
      if (adminResponse.ok) {
        setIsLoggedIn(true);
        setIsLoading(false);
        return;
      }

      const blogManagerResponse = await fetch("/api/blog-manager/me");
      if (blogManagerResponse.ok) {
        setIsLoggedIn(true);
        setIsLoading(false);
        return;
      }

      setIsLoggedIn(false);
    } catch (error) {
      setIsLoggedIn(false);
    } finally {
      setIsLoading(false);
    }
  };

  function handleLoginSuccess() {
    setIsLoggedIn(true);
  }

  if (isLoading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "rgba(255,255,255,0.85)",
          backdropFilter: "blur(4px)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "16px",
          position: "absolute",
          inset: 0,
          zIndex: 10000,
        }}
      >
        <div style={{ width: "150px", height: "150px" }}>
          <DotLottieReact src="/loading.lottie" loop autoplay />
        </div>
        <p
          style={{
            fontSize: "1.1rem",
            fontWeight: 500,
            color: "#1e293b",
            margin: 0,
          }}
        >
          Authenticating...
        </p>
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

  const handleNavChange = (section: string) => {
    const event = new CustomEvent('left-panel-navigate', { detail: section });
    window.dispatchEvent(event);
  };

  return (
    <div className="dashboard-layout">
      {/* Sidebar — activeSection is manage-blogs since that's where we came from */}
      <LeftPanel activeSection="manage-blogs" onChange={handleNavChange} />

      <div className="right-panel">
        <EditBlogSection />
      </div>
    </div>
  );
}
