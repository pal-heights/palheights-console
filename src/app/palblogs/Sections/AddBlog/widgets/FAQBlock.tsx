"use client";

import styles from "./FAQBlock.module.css";
import { Trash2 } from "lucide-react";

export default function FAQBlock({
  data,
  onChange,
}: {
  data?: {
    title: string;
    description: string;
    items: { q: string; a: string }[];
  };
  onChange: (data: any) => void;
}) {
  const items = data?.items || [];

  const removeItem = (index: number) => {
    const next = items.filter((_, i) => i !== index);
    onChange({ ...data, items: next });
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <input
          className={styles.title}
          placeholder="FAQ heading"
          value={data?.title || ""}
          onChange={(e) =>
            onChange({ ...data, title: e.target.value, items })
          }
        />

        <textarea
          className={styles.description}
          placeholder="FAQ description"
          value={data?.description || ""}
          onChange={(e) =>
            onChange({ ...data, description: e.target.value, items })
          }
        />
      </div>

      {items.map((it, i) => (
        <div key={i} className={styles.item}>
          <div className={styles.itemHeader}>
            <span className={styles.itemLabel}>FAQ {i + 1}</span>

            <button
              type="button"
              className={styles.remove}
              onClick={() => removeItem(i)}
              aria-label={`Remove FAQ ${i + 1}`}
            >
              <Trash2 size={16} />
            </button>
          </div>

          <input
            className={styles.question}
            placeholder="Question"
            value={it.q}
            onChange={(e) => {
              const next = [...items];
              next[i].q = e.target.value;
              onChange({ ...data, items: next });
            }}
          />

          <textarea
            className={styles.answer}
            placeholder="Answer"
            value={it.a}
            onChange={(e) => {
              const next = [...items];
              next[i].a = e.target.value;
              onChange({ ...data, items: next });
            }}
          />
        </div>
      ))}

      <button
        className={styles.add}
        onClick={() =>
          onChange({
            ...data,
            items: [...items, { q: "", a: "" }],
          })
        }
      >
        + Add FAQ
      </button>
    </div>
  );
}
