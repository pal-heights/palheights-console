"use client";

import styles from "./WidgetPicker.module.css";
import { BlockType } from "./AddBlog";
import HeadingBlock from "./widgets/HeadingBlock";
import ParagraphBlock from "./widgets/ParagraphBlock";
import ListBlock from "./widgets/ListBlock";
import TableBlock from "./widgets/TableBlock";
import FAQBlock from "./widgets/FAQBlock";
import DividerBlock from "./widgets/DividerBlock";
import ImageBlock from "./widgets/ImageBlock";
import LinkBlock from "./widgets/LinkBlock";

interface WidgetPickerProps {
  onSelect: (type: BlockType) => void;
}

const WIDGETS: { label: string; type: BlockType }[] = [
  { label: "Heading (H2 / H3)", type: "heading" },
  { label: "Paragraph", type: "paragraph" },
  { label: "List", type: "list" },
  { label: "Table", type: "table" },
  { label: "FAQ", type: "faq" },
  { label: "Link", type: "link" },
  { label: "Image", type: "image" },
  { label: "Divider", type: "divider" },
];

export default function WidgetPicker({
  onSelect,
}: WidgetPickerProps) {
  return (
    <div className={styles.picker}>
      {WIDGETS.map((widget) => (
        <button
          key={widget.type}
          className={styles.item}
          onClick={() => onSelect(widget.type)}
          type="button"
        >
          {widget.label}
        </button>
      ))}
    </div>
  );
}
