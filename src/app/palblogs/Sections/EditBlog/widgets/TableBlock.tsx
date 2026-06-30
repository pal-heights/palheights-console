"use client";

import styles from "./TableBlock.module.css";
import { Trash2, Plus, Minus } from "lucide-react";

const DEFAULT_COLUMNS = 3;
const MAX_COLUMNS = 5;
const MIN_COLUMNS = 1;

export default function TableBlock({
  data,
  onChange,
}: {
  data?: { rows: string[][] };
  onChange: (data: { rows: string[][] }) => void;
}) {
  const rows =
    data?.rows && data.rows.length
      ? data.rows
      : [Array(DEFAULT_COLUMNS).fill("")];

  const columnCount = rows[0].length;

  /* ---------- Column Actions ---------- */

  const addColumn = () => {
    if (columnCount >= MAX_COLUMNS) return;
    onChange({
      rows: rows.map((r) => [...r, ""]),
    });
  };

  const removeColumn = () => {
    if (columnCount <= MIN_COLUMNS) return;
    onChange({
      rows: rows.map((r) => r.slice(0, -1)),
    });
  };

  /* ---------- Row Actions ---------- */

  const addRow = () => {
    onChange({
      rows: [...rows, Array(columnCount).fill("")],
    });
  };

  const removeRow = (index: number) => {
    const next = rows.filter((_, i) => i !== index);
    onChange({
      rows: next.length
        ? next
        : [Array(columnCount).fill("")],
    });
  };

  return (
    <div className={styles.wrapper}>
      

      {/* Table rows */}
      {rows.map((row, r) => (
        <div key={r} className={styles.row}>
          {row.map((cell, c) => (
            <input
              key={c}
              className={styles.cell}
              value={cell}
              placeholder={
                r === 0
                  ? `Heading ${c + 1}`
                  : `Cell ${c + 1}`
              }
              onChange={(e) => {
                const next = rows.map((rr) => [...rr]);
                next[r][c] = e.target.value;
                onChange({ rows: next });
              }}
            />
          ))}

          <button
            type="button"
            className={styles.remove}
            onClick={() => removeRow(r)}
            aria-label={`Remove row ${r + 1}`}
          >
            <Trash2 size={16} />
          </button>
        </div>
      ))}

  {/* Column controls */}
      <div className={styles.columnControls}>
      <button
        type="button"
        className={styles.add}
        onClick={addRow}
      >
        + Add row
      </button>
        <button
          type="button"
          onClick={addColumn}
          disabled={columnCount >= MAX_COLUMNS}
        >
          + Add column
        </button>

        <button
          type="button"
          onClick={removeColumn}
          disabled={columnCount <= MIN_COLUMNS}
        >
          − Remove column
        </button>
      </div>
    </div>
  );
}
