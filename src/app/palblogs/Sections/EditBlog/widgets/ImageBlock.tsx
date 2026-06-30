"use client";

import { Trash2, Link } from "lucide-react";
import styles from "./ImageBlock.module.css";

type ImageData = {
  // New primary field: URL link
  imageUrl?: string;
  // Legacy: kept hidden but not removed
  file?: File;
  url?: string;
};

export default function ImageBlock({
  data,
  onChange,
}: {
  data?: ImageData;
  onChange: (data: ImageData) => void;
}) {
  const currentUrl = data?.imageUrl || "";

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ imageUrl: e.target.value });
  };

  const clearUrl = () => {
    onChange({ imageUrl: "" });
  };

  return (
    <div>
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <label style={{ fontSize: "13px", fontWeight: "600", color: "#475569" }}>
          Image URL
        </label>
        <div style={{ display: "flex", gap: "8px" }}>
          <div style={{ position: "relative", flex: 1 }}>
            <Link
              size={14}
              style={{
                position: "absolute",
                left: "10px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "#94a3b8",
                pointerEvents: "none",
              }}
            />
            <input
              type="text"
              placeholder="Paste image link (Cloudflare, Cloudinary, etc.)"
              value={currentUrl}
              onChange={handleUrlChange}
              style={{
                width: "100%",
                paddingLeft: "32px",
                paddingRight: "12px",
                paddingTop: "9px",
                paddingBottom: "9px",
                borderRadius: "7px",
                border: "1px solid #cbd5e1",
                fontSize: "13px",
                outline: "none",
                color: "#1e293b",
                boxSizing: "border-box",
              }}
            />
          </div>
          {currentUrl && (
            <button
              onClick={clearUrl}
              type="button"
              aria-label="Clear image URL"
              style={{
                padding: "9px 10px",
                borderRadius: "7px",
                border: "1px solid #cbd5e1",
                background: "#f8fafc",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
              }}
            >
              <Trash2 size={14} color="#ef4444" />
            </button>
          )}
        </div>
      </div>

      {currentUrl && (
        <div className={styles.imageWrapper} style={{ marginTop: "12px" }}>
          <img
            src={currentUrl}
            alt="Block image"
            className={styles.image}
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                "https://placehold.co/600x300?text=Invalid+Image+URL";
            }}
          />
        </div>
      )}
    </div>
  );
}
