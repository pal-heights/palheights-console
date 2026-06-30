"use client";

import { Trash2 } from "lucide-react";
import styles from "./FeatureImage.module.css";

interface FeatureImageProps {
  urlValue: string;
  onUrlChange: (url: string) => void;
}

export default function FeatureImage({
  urlValue,
  onUrlChange,
}: FeatureImageProps) {
  return (
    <div
      className={styles.wrapper}
      style={{ display: "flex", flexDirection: "column", gap: "12px" }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "8px",
          width: "100%",
        }}
      >
        <label
          style={{ fontSize: "14px", fontWeight: "600", color: "#1e293b" }}
        >
          Feature Image URL
        </label>
        <div style={{ display: "flex", gap: "8px" }}>
          <input
            required
            type="text"
            placeholder="Paste cloudflare image link here"
            value={urlValue}
            onChange={(e) => onUrlChange(e.target.value)}
            style={{
              flex: 1,
              padding: "10px 14px",
              borderRadius: "8px",
              border: "1px solid #cbd5e1",
              fontSize: "14px",
              outline: "none",
              color: "#1e293b",
            }}
          />
          {urlValue && (
            <button
              onClick={() => onUrlChange("")}
              style={{
                padding: "10px",
                borderRadius: "8px",
                border: "1px solid #cbd5e1",
                background: "#f8fafc",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              type="button"
              aria-label="Clear URL"
            >
              <Trash2 size={16} color="#ef4444" />
            </button>
          )}
        </div>
      </div>

      {urlValue && (
        <div className={styles.preview} style={{ marginTop: "12px" }}>
          {urlValue.startsWith(
            "https://pub-df2be1f0ac924e4f81cce390b6cc6cee.r2.dev/",
          ) ? (
            <img
              src={urlValue}
              alt="Feature Preview"
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  "https://placehold.co/600x400?text=Invalid+Image+URL";
              }}
              style={{
                maxWidth: "100%",
                maxHeight: "250px",
                borderRadius: "8px",
                objectFit: "cover",
              }}
            />
          ) : (
            <div
              style={{
                padding: "20px",
                background: "#fef2f2",
                border: "1px solid #f87171",
                borderRadius: "8px",
                color: "#b91c1c",
                textAlign: "center",
                fontSize: "14px",
                fontWeight: "500",
              }}
            >
              Only Cloudflare images are allowed. Please use a Cloudflare image.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
