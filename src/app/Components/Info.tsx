"use client";

import { useState } from "react";
import styles from "./Info.module.css";

type InstructionPart = {
  text: string;
  highlight?: boolean;
};

type Instruction = InstructionPart[];

interface InfoProps {
  instructions: Instruction[];
  className?: string;
}

export default function Info({ instructions, className }: InfoProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const showTooltip = isOpen || isHovered;

  return (
    <div
      className={`${styles.infoWrap} ${className ?? ""}`.trim()}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <button
        type="button"
        className={styles.infoBtn}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Show instructions"
        aria-expanded={showTooltip}
      >
        i
      </button>

      <div
        className={`${styles.infoTooltip} ${
          showTooltip ? styles.open : ""
        }`}
      >
        <ul className={styles.tooltipList}>
          {instructions.map((instruction, index) => (
            <li key={index} className={styles.tooltipItem}>
              {instruction.map((part, partIndex) =>
                part.highlight ? (
                  <span key={partIndex} className={styles.highlight}>
                    {part.text}
                  </span>
                ) : (
                  <span key={partIndex}>{part.text}</span>
                )
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}