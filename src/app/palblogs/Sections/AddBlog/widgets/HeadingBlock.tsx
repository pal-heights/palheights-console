"use client";

import styles from "./HeadingBlock.module.css";

interface HeadingData {
  level: "h2" | "h3";
  text: string;
}

export default function HeadingBlock({
  data,
  onChange,
}: {
  data?: HeadingData;
  onChange: (data: HeadingData) => void;
}) {
  return (
    <div className={styles.wrapper}>
      <select
      className={styles.select}
        value={data?.level || "h2"}
        onChange={(e) =>
          onChange({
            level: e.target.value as "h2" | "h3",
            text: data?.text || "",
          })
        }
      >
        <option value="h2">Heading</option>
        <option value="h3">Sub Heading</option>
      </select>

      <input
        type="text"
        placeholder="Heading text"
        value={data?.text || ""}
        className={styles.input}
        onChange={(e) =>
          onChange({
            level: data?.level || "h2",
            text: e.target.value,
          })
        }
      />
    </div>
  );
}
