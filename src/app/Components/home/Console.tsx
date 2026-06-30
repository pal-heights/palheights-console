"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Settings2,
  PenSquare,
} from "lucide-react";
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

import styles from "./Console.module.css";

export default function OptionPopup() {
  const router = useRouter();
  const [loadingRoute, setLoadingRoute] = useState<string | null>(null);

  const handleNavigation = (route: string) => {
    setLoadingRoute(route);
    router.push(route);
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.popup}>
        {loadingRoute && (
          <div className={styles.loadingOverlay}>
            <div className={styles.loadingContent}>
              <div style={{ width: '150px', height: '150px' }}>
                <DotLottieReact
                  src="/loading.lottie"
                  loop
                  autoplay
                />
              </div>
              <p className={styles.loadingText}>Authenticating...</p>
            </div>
          </div>
        )}

        {/* Header */}
        <div className={styles.intro}>
          <h2 className={styles.title}>Pal Heights Console</h2>
          <p className={styles.introText}>
            Central access point for operations, administration, and content
            management.
          </p>
        </div>

        {/* Content */}
        <div className={styles.content}>
          {/* Primary Workspace — Blog Management */}
          <div
            className={styles.primaryWorkspace}
            onClick={() => handleNavigation("/palblogs")}
          >
            <div className={styles.primaryTopRow}>
              <div className={styles.primaryIconWrap}>
                <PenSquare
                  className={styles.primaryIcon}
                  strokeWidth={1.75}
                />
              </div>
              <h3 className={styles.primaryTitle}>
                Blog Management
              </h3>
            </div>

            <div className={styles.primaryContent}>
              <p className={styles.primaryDesc}>
                Create, edit, and publish website content and articles with full control over updates and visibility.
              </p>
            </div>
          </div>

          {/* Secondary Workspaces */}
          <div className={styles.secondaryGrid}>
            {/* Operations & Backoffice */}
            <div
              className={styles.secondaryCard}
              onClick={() => handleNavigation("/palbo")}
            >
              <LayoutDashboard
                className={styles.secondaryIcon}
                strokeWidth={1.5}
              />
              <h4 className={styles.secondaryTitle}>
                Operations & Backoffice
              </h4>
              <p className={styles.secondaryDesc}>
                 Manage leads efficiently and effectively.
              </p>
            </div>

            {/* Administration */}
            <div
              className={styles.secondaryCard}
              onClick={() => handleNavigation("/paladmin")}
            >
              <Settings2
                className={styles.secondaryIcon}
                strokeWidth={1.5}
              />
              <h4 className={styles.secondaryTitle}>
                Administration
              </h4>
              <p className={styles.secondaryDesc}>
              Manage leads and assign managers.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
