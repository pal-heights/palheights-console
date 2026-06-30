import React from "react";
import styles from "./button.module.css";
import Image from "next/image";
import Link from "next/link";
import Arrow from "../../../../public/images/arrow.svg";

interface ButtonProps {
  text: string;
  type: "whiteButtonNoBackground" | "whiteButtonWithBackground" | "smallWhatWeDoButton" | "secondary";
  onClick?: () => void;
  href?: string;
}

const Button = ({ text, type, onClick, href }: ButtonProps) => {
  const buttonStyle = type === "whiteButtonNoBackground" 
    ? styles.whiteButtonNoBackground 
    : type === "whiteButtonWithBackground"
    ? styles.whiteButtonWithBackground
    : type === "secondary"
    ? styles.signIn
    : styles.smallWhatWeDoButton;

  const buttonContent = (
    <>
      {text}
      <Image alt="arrow" className={styles.arrow} src={Arrow} />
    </>
  );

  if (href) {
    return (
      <Link href={href} className={buttonStyle} target="_blank" rel="noopener noreferrer">
        {buttonContent}
      </Link>
    );
  }

  return (
    <button 
      className={buttonStyle} 
      onClick={onClick}
      suppressHydrationWarning
    >
      {buttonContent}
    </button>
  );
};

export default Button;
