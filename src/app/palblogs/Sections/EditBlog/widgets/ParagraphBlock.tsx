"use client";

import styles from "./ParagraphBlock.module.css";

export default function ParagraphBlock({
  data,
  onChange,
}: {
  data?: { text: string };
  onChange: (data: { text: string }) => void;
}) {
  return (
    <textarea
      className={styles.textarea}
      placeholder="Write paragraph..."
      value={data?.text || ""}
      onChange={(e) => onChange({ text: e.target.value })}
      rows={5}
    />
  );
}
