"use client";

import styles from "./BlocksEditor.module.css";
import { Block } from "./EditBlog";
import BlockItem from "./BlockItem";

interface BlocksEditorProps {
  blocks: Block[];
  onChange: (blocks: Block[]) => void;
}

export default function BlocksEditor({ blocks, onChange }: BlocksEditorProps) {
  const addEmptyBlock = () => {
    onChange([...blocks, { id: crypto.randomUUID() }]);
  };

  return (
    <div className={styles.editor}>
      {blocks.length === 0 ? (
        <div className={styles.empty}>
          <span>Start writing your blog content</span>
          <button onClick={addEmptyBlock}>+ Add Block</button>
        </div>
      ) : (
        <>
          {blocks.map((block, index) => (
            <BlockItem
              key={block.id}
              block={block}
              onDelete={() => onChange(blocks.filter((_, i) => i !== index))}
              onUpdate={(updated) =>
                onChange(blocks.map((b, i) => (i === index ? updated : b)))
              }
            />
          ))}

          <div className={styles.addMore}>
            <button onClick={addEmptyBlock}>+ Add Block</button>
          </div>
        </>
      )}
    </div>
  );
}
