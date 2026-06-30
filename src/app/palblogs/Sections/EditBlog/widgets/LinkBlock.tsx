"use client";

import styles from "./LinkBlock.module.css";

interface LinkData {
  text?: string;
  url?: string;
  newTab?: boolean;
}

export default function LinkBlock({
  data,
  onChange,
}: {
  data?: LinkData;
  onChange: (data: LinkData) => void;
}) {
  const value = data || {};

  return (
    <div className={styles.wrapper}>
      <input
        type="text"
        className={styles.input}
        placeholder="Link text"
        value={value.text || ""}
        onChange={(e) =>
          onChange({ ...value, text: e.target.value })
        }
      />

      <input
        type="url"
        className={styles.input}
        placeholder="https://example.com"
        value={value.url || ""}
        onChange={(e) =>
          onChange({ ...value, url: e.target.value })
        }
      />

      <label className={styles.checkbox}>
        <input
          type="checkbox"
          checked={value.newTab || false}
          onChange={(e) =>
            onChange({
              ...value,
              newTab: e.target.checked,
            })
          }
        />
        Open in new tab
      </label>
    </div>
  );
}
