"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import styles from "./Announcements.module.css";
import Lottie from "lottie-react";
import loadingAnimation from "../../../../../public/loading.json";

type Mode = "single" | "slider";

const SLIDER_FIELD_COUNT = 4;

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

function emptyLinksForMode(mode: Mode): string[] {
  return mode === "single" ? [""] : Array(SLIDER_FIELD_COUNT).fill("");
}

function isValidUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export default function Announcements() {
  const [mode, setMode] = useState<Mode>("single");
  const [linkFields, setLinkFields] = useState<string[]>(
    emptyLinksForMode("single"),
  );
  const [previews, setPreviews] = useState<(string | null)[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [infoOpen, setInfoOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const applyFetchedData = (data: {
    mode: Mode;
    links: string[];
    previews?: (string | null)[];
  }): void => {
    setMode(data.mode);

    if (data.mode === "single") {
      setLinkFields([data.links[0] ?? ""]);
      setPreviews([data.previews?.[0] ?? data.links[0] ?? null]);
      return;
    }

    const sliderLinks = Array(SLIDER_FIELD_COUNT)
      .fill("")
      .map((_, index) => data.links[index] ?? "");

    const sliderPreviews = Array(SLIDER_FIELD_COUNT)
      .fill(null)
      .map((_, index) => data.previews?.[index] ?? data.links[index] ?? null);

    setLinkFields(sliderLinks);
    setPreviews(sliderPreviews);
  };

  /* ---------- Fetch (NO CACHE) ---------- */
  const fetchAnnouncement = async (): Promise<void> => {
    try {
      const res = await fetch("/api/announcements/get", {
        cache: "no-store",
      });

      if (!res.ok) throw new Error("Failed to fetch");

      const data: {
        mode: Mode;
        links: string[];
        previews?: (string | null)[];
      } | null = await res.json();

      if (data) {
        applyFetchedData(data);
      } else {
        setLinkFields(emptyLinksForMode(mode));
        setPreviews([]);
      }
    } catch {
      setError("Failed to load announcements");
    }
  };

  useEffect(() => {
    fetchAnnouncement().finally(() => setLoading(false));
  }, []);

  const handleModeChange = (nextMode: Mode): void => {
    setMode(nextMode);

    if (nextMode === "single") {
      const firstLink = linkFields.find((link) => link.trim()) ?? "";
      setLinkFields([firstLink]);
      setPreviews([firstLink || previews.find(Boolean) || null]);
      return;
    }

    const existingLinks = linkFields.map((link) => link.trim()).filter(Boolean);
    const sliderLinks = Array(SLIDER_FIELD_COUNT)
      .fill("")
      .map((_, index) => existingLinks[index] ?? "");

    const sliderPreviews = Array(SLIDER_FIELD_COUNT)
      .fill(null)
      .map((_, index) => sliderLinks[index] || previews[index] || null);

    setLinkFields(sliderLinks);
    setPreviews(sliderPreviews);
  };

  const updateLinkField = (index: number, value: string): void => {
    setLinkFields((prev) =>
      prev.map((link, i) => (i === index ? value : link)),
    );

    const trimmed = value.trim();
    setPreviews((prev) => {
      const next = [...prev];
      next[index] = trimmed && isValidUrl(trimmed) ? trimmed : null;
      return next;
    });
  };

  const getFilledLinks = (): string[] =>
    linkFields.map((link) => link.trim()).filter(Boolean);

  /* ---------- Save ---------- */
  const handleSave = async (): Promise<void> => {
    const filledLinks = getFilledLinks();

    if (filledLinks.length > 0) {
      const invalidLink = filledLinks.find((link) => !isValidUrl(link));
      if (invalidLink) {
        toast.error("Each link must be a valid http or https URL", errorToast);
        return;
      }

      const invalidCloudflareLink = filledLinks.find(
        (link) =>
          !link.startsWith(
            "https://pub-df2be1f0ac924e4f81cce390b6cc6cee.r2.dev/",
          ),
      );
      if (invalidCloudflareLink) {
        toast.error(
          "Only Cloudflare images are allowed. Please use a Cloudflare image.",
          errorToast,
        );
        return;
      }
    }

    if (mode === "single" && filledLinks.length > 1) {
      toast.error("Single mode allows only one image link", errorToast);
      return;
    }

    if (
      mode === "slider" &&
      filledLinks.length > 0 &&
      (filledLinks.length < 2 || filledLinks.length > 4)
    ) {
      toast.error("Slider requires 2 to 4 image links", errorToast);
      return;
    }

    setSaving(true);

    const res = await fetch("/api/announcements/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode, links: linkFields }),
    });

    setSaving(false);

    if (!res.ok) {
      const payload = await res.json().catch(() => null);
      toast.error(
        payload?.message ?? "Failed to save announcement",
        errorToast,
      );
      return;
    }

    toast.success(
      filledLinks.length === 0
        ? "Announcement removed"
        : "Announcement updated",
      successToast,
    );

    if (filledLinks.length === 0) {
      setLinkFields(emptyLinksForMode(mode));
      setPreviews([]);
      return;
    }

    await fetchAnnouncement();
  };

  const filledLinkCount = getFilledLinks().length;
  const saveLabel =
    filledLinkCount === 0 ? "Remove Announcement" : "Save Announcement";

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
        <span>Loading announcements…</span>
      </div>
    );
  }

  if (error)
    return (
      <div className={styles.stateError}>
        Something Went Wrong Contact Support {error}
      </div>
    );

  const fieldCount = mode === "single" ? 1 : SLIDER_FIELD_COUNT;
  const linkHint =
    mode === "slider"
      ? "Add 2–4 image URLs. Leave all fields empty to remove the announcement."
      : "Add one image URL. Clear the field and save to remove the announcement.";

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Announcements</h2>
        <p>Configure homepage announcement popup</p>
      </div>

      <div className={styles.modeRow}>
        <button
          type="button"
          className={`${styles.modeBtn} ${
            mode === "single" ? styles.active : ""
          }`}
          onClick={() => handleModeChange("single")}
        >
          Single Image
        </button>

        <button
          type="button"
          className={`${styles.modeBtn} ${
            mode === "slider" ? styles.active : ""
          }`}
          onClick={() => handleModeChange("slider")}
        >
          Slider (2–4 Images)
        </button>

        <div className={styles.infoWrap}>
          <button
            type="button"
            onClick={() => setInfoOpen(!infoOpen)}
            className={styles.infoBtn}
            aria-label="Image guidelines"
          >
            i
          </button>

          <div
            className={`${styles.infoTooltip} ${infoOpen ? styles.open : ""}`}
          >
            <p>
              • Below inst. is for both <strong>Single</strong> and{" "}
              <strong>Slider</strong> Popup
            </p>
            <p>
              • Image URLs must be <strong>direct cloudflare link</strong>
            </p>
            <p>
              • Images recommended to be <strong>landscape (16:9)</strong>
            </p>
            <p>
              • Saving with empty fields will <strong>remove</strong> the
              announcement
            </p>
            <p>
              • Use images with <strong>size below 500kb</strong> to maintain
              the smoothness of the popup
            </p>
          </div>
        </div>
      </div>

      <p className={styles.linkHint}>{linkHint}</p>

      <div className={styles.linkFields}>
        {Array.from({ length: fieldCount }).map((_, index) => (
          <div key={index} className={styles.linkFieldGroup}>
            <label htmlFor={`announcement-link-${index}`}>
              {mode === "slider" ? `Image ${index + 1}` : "Image URL"}
            </label>
            <input
              id={`announcement-link-${index}`}
              type="url"
              className={styles.linkInput}
              placeholder="https://example.com/image.jpg"
              value={linkFields[index] ?? ""}
              onChange={(e) => updateLinkField(index, e.target.value)}
            />
            {previews[index] && (
              <div className={styles.previewWrap}>
                {previews[index]!.startsWith(
                  "https://pub-df2be1f0ac924e4f81cce390b6cc6cee.r2.dev/",
                ) ? (
                  <img
                    src={previews[index]!}
                    alt={`Announcement preview ${index + 1}`}
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
                    Only Cloudflare images are allowed. Please use a Cloudflare
                    image.
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className={styles.actions}>
        <button
          type="button"
          className={styles.saveBtn}
          disabled={saving}
          onClick={handleSave}
        >
          {saving ? "Saving…" : saveLabel}
        </button>
      </div>
    </div>
  );
}
