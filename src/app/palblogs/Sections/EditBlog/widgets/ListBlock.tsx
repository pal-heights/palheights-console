"use client";

import styles from "./ListBlock.module.css";
import { Trash2 } from "lucide-react";

export default function ListBlock({
  data,
  onChange,
}: {
  data?: { style: "ordered" | "unordered"; items: string[] };
  onChange: (data: { style: "ordered" | "unordered"; items: string[] }) => void;
}) {
  const items = data?.items || [""];

  const removeItem = (index: number) => {
    const next = items.filter((_, i) => i !== index);
    onChange({
      style: data?.style || "unordered",
      items: next.length ? next : [""],
    });
  };

  return (
    <div className={styles.wrapper}>
      <select
        className={styles.select}
        value={data?.style || "unordered"}
        onChange={(e) =>
          onChange({ style: e.target.value as any, items })
        }
      >
        <option value="unordered">Unordered</option>
        <option value="ordered">Ordered</option>
      </select>

      {items.map((item, i) => (
        <div key={i} className={styles.itemRow}>
          <input
            className={styles.item}
            value={item}
            placeholder={`Item ${i + 1}`}
            onChange={(e) => {
              const next = [...items];
              next[i] = e.target.value;
              onChange({
                style: data?.style || "unordered",
                items: next,
              });
            }}
          />

          <button
            type="button"
            className={styles.remove}
            onClick={() => removeItem(i)}
            aria-label={`Remove item ${i + 1}`}
          >
            <Trash2 size={16} />
          </button>
        </div>
      ))}

      <button
        className={styles.add}
        onClick={() =>
          onChange({
            style: data?.style || "unordered",
            items: [...items, ""],
          })
        }
      >
        + Add item
      </button>
    </div>
  );
}
