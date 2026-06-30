"use client";

import styles from "./BlockItem.module.css";
import { Block, BlockType } from "./EditBlog";
import WidgetPicker from "./WidgetPicker";

/* block widgets */
import HeadingBlock from "./widgets/HeadingBlock";
import ParagraphBlock from "./widgets/ParagraphBlock";
import ListBlock from "./widgets/ListBlock";
import TableBlock from "./widgets/TableBlock";
import FAQBlock from "./widgets/FAQBlock";
import DividerBlock from "./widgets/DividerBlock";
import LinkBlock from "./widgets/LinkBlock";
import ImageBlock from "./widgets/ImageBlock";

interface BlockItemProps {
  block: Block;
  onUpdate: (block: Block) => void;
  onDelete: () => void;
}

export default function BlockItem({
  block,
  onUpdate,
  onDelete,
}: BlockItemProps) {
  const handleSelectType = (type: BlockType) => {
    onUpdate({
      ...block,
      type,
      data: {},
    });
  };

  return (
    <div className={styles.block}>
      <div className={styles.left}>⋮⋮</div>

      <div className={styles.content}>
        {!block.type && <WidgetPicker onSelect={handleSelectType} />}

        {block.type === "heading" && (
          <HeadingBlock
            data={block.data}
            onChange={(data) => onUpdate({ ...block, data })}
          />
        )}

        {block.type === "paragraph" && (
          <ParagraphBlock
            data={block.data}
            onChange={(data) => onUpdate({ ...block, data })}
          />
        )}

        {block.type === "list" && (
          <ListBlock
            data={block.data}
            onChange={(data) => onUpdate({ ...block, data })}
          />
        )}

        {block.type === "table" && (
          <TableBlock
            data={block.data}
            onChange={(data) => onUpdate({ ...block, data })}
          />
        )}

        {block.type === "faq" && (
          <FAQBlock
            data={block.data}
            onChange={(data) => onUpdate({ ...block, data })}
          />
        )}

        {block.type === "divider" && <DividerBlock />}

        {block.type === "image" && (
          <ImageBlock
            data={block.data}
            onChange={(data) => onUpdate({ ...block, data })}
          />
        )}

        {block.type === "link" && (
          <LinkBlock
            data={block.data}
            onChange={(data) => onUpdate({ ...block, data })}
          />
        )}
      </div>

      <button className={styles.delete} onClick={onDelete} type="button">
        ✕
      </button>
    </div>
  );
}
