"use client";
import { useState } from "react";
import styles from "./toggleNav.module.css";

// Add a simple modal component for sign-in
function SignInModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      background: 'rgba(0,0,0,0.4)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
    }}>
      <div style={{
        background: '#fff',
        borderRadius: 8,
        padding: 32,
        minWidth: 320,
        boxShadow: '0 2px 16px rgba(0,0,0,0.15)',
        position: 'relative',
      }}>
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 8,
            right: 8,
            background: 'none',
            border: 'none',
            fontSize: 20,
            cursor: 'pointer',
          }}
          aria-label="Close"
        >
          ✖
        </button>
        <h2 style={{ marginBottom: 16 }}>Sign In</h2>
        {/* Replace this with your actual sign-in form */}
        <form>
          <div style={{ marginBottom: 12 }}>
            <label>Email</label>
            <input type="email" style={{ width: '100%', padding: 8, marginTop: 4 }} />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label>Password</label>
            <input type="password" style={{ width: '100%', padding: 8, marginTop: 4 }} />
          </div>
          <button type="submit" style={{ width: '100%', padding: 10, background: '#111', color: '#fff', border: 'none', borderRadius: 4 }}>Sign In</button>
        </form>
      </div>
    </div>
  );
}

type ToggleNavProps = {
  mainOptions?: string[];
};

export default function ToggleNav({
  mainOptions = [
    "Startup",
    "Trademark",
    "Registration",
    "Gst",
    "MCA",
    "Compliance",
    "Income Tax",
    "About Us",
  ],
}: ToggleNavProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState<"main" | number>("main");
  // Add state for sign-in modal
  const [showSignIn, setShowSignIn] = useState(false);

  const subOptions = Array.from(
    { length: 18 },
    (_, i) => `Sub Option ${i + 1}`
  );

  return (
    <>
      <header className={styles.header}>
        <div className={styles.logo}>MyLogo</div>
        {/* Profile picture on the left of the toggle icon */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginLeft: 'auto' }}>
          <img
            src="/delfyle-logo/delfyle-logo.png"
            alt="Profile"
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              objectFit: 'cover',
              border: '2px solid #eee',
            }}
          />
          <button
            className={styles.toggleButton}
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle Menu"
          >
            {isOpen ? "✖" : "☰"}
          </button>
        </div>
      </header>

      <div className={`${styles.panel} ${isOpen ? styles.panelOpen : ""}`}>
        {activeMenu === "main" ? (
          <div className={styles.menu}>
            <div className={styles.scrollWrapper}>
              <div className={styles.menuOptions}>
                {mainOptions
                  .slice(0, mainOptions.length - 1)
                  .map((option, idx) => (
                    <div
                      key={idx}
                      className={styles.menuItem}
                      onClick={() => setActiveMenu(idx)}
                    >
                      {option}
                    </div>
                  ))}
                <div
                  className={styles.menuItem}
                  onClick={() => (window.location.href = "/about")}
                >
                  {mainOptions[mainOptions.length - 1]}
                </div>
              </div>
              <div className={styles.fadeTop} />
              <div className={styles.fadeBottom} />
            </div>
          </div>
        ) : (
          <div className={styles.subMenu}>
            <button
              className={styles.backButton}
              onClick={() => setActiveMenu("main")}
            >
              ← Back
            </button>
            <div className={styles.scrollWrapper}>
              <div className={styles.subOptions}>
                {subOptions.map((sub, idx) => (
                  <div key={idx} className={styles.subItem}>
                    {sub}
                  </div>
                ))}
              </div>
              <div className={styles.fadeTop} />
              <div className={styles.fadeBottom} />
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: 12, marginTop: 24, justifyContent: 'center' }}>
          <button
            className={styles.contactButton}
            onClick={() => (window.location.href = "/contact")}
          >
            ContactUs
          </button>
          <button
            className={styles.contactButton}
            style={{ background: '#222', color: '#fff' }}
            onClick={() => {
              setIsOpen(false);
              setShowSignIn(true);
            }}
          >
            Sign In
          </button>
        </div>

        <div className={styles.socialIcons}>
          <div className={styles.socialIconsWrapper}>
            <a href="#" aria-label="LinkedIn">
              <img src="/whatsapp.svg" alt="LinkedIn" className={styles.icon} />
            </a>
            <a href="#" aria-label="LinkedIn">
              <img src="/linkedin.svg" alt="LinkedIn" className={styles.icon} />
            </a>
            <a href="#" aria-label="Instagram">
              <img
                src="/instagram.svg"
                alt="Instagram"
                className={styles.icon}
              />
            </a>
            <a href="#" aria-label="Facebook">
              <img src="/facebook.svg" alt="Facebook" className={styles.icon} />
            </a>
            <a href="#" aria-label="Twitter">
              <img src="/twitter.svg" alt="Twitter" className={styles.icon} />
            </a>
          </div>
        </div>
      </div>
      {/* Sign In Modal */}
      <SignInModal open={showSignIn} onClose={() => setShowSignIn(false)} />
    </>
  );
}
