"use client";
import { useState } from "react";
import SignUpPanel from "./SignUpPanel";
import DashboardPanel from "./DashboardPanel";
import styles from "./AuthPopup.module.css";
import ForgetPasswordPanel from "./ForgetPasswordPanel";

type AuthPopupProps = {
  isOpen: boolean;
  onClose: () => void;
  onSignUp?: () => void;
  onSignIn?: (user: any) => void;
  onGoogleSignIn?: () => void;
};

export default function AuthPopup({ 
  isOpen, 
  onClose, 
  onSignUp, 
  onSignIn, 
  onGoogleSignIn 
}: AuthPopupProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showForgetPassword, setShowForgetPassword] = useState(false);

  if (!isOpen && !showForgetPassword) return null;

  const handleSignIn = async () => {
    setError("");
    setIsLoading(true);
    
    // Basic email validation
    if (!email) {
      setError("Email is required");
      setIsLoading(false);
      return;
    }
    
    if (!email.includes("@")) {
      setError("Please enter a valid email address");
      setIsLoading(false);
      return;
    }

    if (!password) {
      setError("Password is required");
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/user/sign-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Sign in failed");
        setIsLoading(false);
        return;
      }
      setError("");
      setIsLoading(false);
      onSignIn?.(data.user);
    } catch (err) {
      setError("Network error. Please try again.");
      setIsLoading(false);
    }
  };

  const handleSignUp = () => {
    setError("");
    onSignUp?.();
  };

  const handleGoogleSignIn = () => {
    setError("");
    onGoogleSignIn?.();
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleForgetPassword = () => {
    setError("");
    setShowForgetPassword(true);
  };

  return (
    <>
      {!showForgetPassword && (
        <div className={styles.overlay} onClick={handleOverlayClick}>
          <div className={styles.popup} style={{border: '2px solid rgb(211, 209, 209)'}}>
            <div className={styles.header}>
              <h2 className={styles.title}>Welcome</h2>
              <button className={styles.closeBtn} onClick={onClose}>
                ✕
              </button>
            </div>

            <div className={styles.content}>
              <div className={styles.inputGroup}>
                <label htmlFor="email" className={styles.label}>
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className={styles.input}
                  disabled={isLoading}
                />
              </div>

              <div className={styles.inputGroup}>
                <label htmlFor="password" className={styles.label}>Password</label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className={styles.input}
                  disabled={isLoading}
                />
              </div>

              {error && (
                <div className={styles.errorMessage}>
                  {error}
                </div>
              )}

              <div className={styles.buttonGroup}>
                <div style={{display:'flex', gap: '10px'}} >
                <button
                  onClick={handleSignIn}
                  disabled={isLoading}
                  className={`${styles.btn} ${styles.signInBtn}`}
                >
                  {isLoading ? "Signing In..." : "Sign In"}
                </button>

                <button
                  onClick={handleSignUp}
                  disabled={false}
                  className={`${styles.btn} ${styles.signUpBtn}`}
                >
                  Register
                </button>
                </div>

                <button
                  onClick={handleForgetPassword}
                  className={`${styles.btn} ${styles.forgetPasswordBtn}`}
                >
                  Forgot Password
                </button>

                <div className={styles.divider} style={{display: 'none'}} >
                  <span>or</span>
                </div>

                <button
                  // onClick={handleGoogleSignIn}
                  disabled={isLoading}
                  className={`${styles.btn} ${styles.googleBtn}`}
                  style={{display: 'none'}}
                >
                  <svg className={styles.googleIcon} viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continue with Google
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {showForgetPassword && (
        <ForgetPasswordPanel
          isOpen={showForgetPassword}
          onClose={() => setShowForgetPassword(false)}
        />
      )}
    </>
  );
}