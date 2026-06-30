"use client";
import { useState } from "react";
import styles from "./ForgetPasswordPanel.module.css";

interface ForgetPasswordPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

type Step = "email" | "otp" | "password";

export default function ForgetPasswordPanel({ isOpen, onClose, onSuccess }: ForgetPasswordPanelProps) {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSendOTP = async () => {
    setMessage("");
    setIsLoading(true);
    if (!email.trim()) {
      setMessage("Email is required");
      setIsLoading(false);
      return;
    }
    if (!email.includes("@")) {
      setMessage("Please enter a valid email address");
      setIsLoading(false);
      return;
    }
    try {
      const res = await fetch("/api/user/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error || "Failed to send OTP");
        setIsLoading(false);
        return;
      }
      setMessage("OTP sent to your email.");
      setStep("otp");
    } catch (err) {
      setMessage("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    setMessage("");
    setIsLoading(true);
    if (!otp.trim()) {
      setMessage("OTP is required");
      setIsLoading(false);
      return;
    }
    if (otp.length !== 6) {
      setMessage("Please enter a valid 6-digit OTP");
      setIsLoading(false);
      return;
    }
    try {
      const res = await fetch("/api/user/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error || "Failed to verify OTP");
        setIsLoading(false);
        return;
      }
      setMessage("OTP verified. Please set your new password.");
      setStep("password");
    } catch (err) {
      setMessage("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetPassword = async () => {
    setMessage("");
    setIsLoading(true);
    if (!password || !confirmPassword) {
      setMessage("Both password fields are required");
      setIsLoading(false);
      return;
    }
    if (password.length < 6) {
      setMessage("Password must be at least 6 characters");
      setIsLoading(false);
      return;
    }
    if (password !== confirmPassword) {
      setMessage("Passwords do not match");
      setIsLoading(false);
      return;
    }
    try {
      const res = await fetch("/api/user/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error || "Failed to reset password");
        setIsLoading(false);
        return;
      }
      setMessage("Password updated successfully! You can now sign in.");
      setIsLoading(false);
      setTimeout(() => {
        onClose();
        if (onSuccess) onSuccess();
      }, 2000);
    } catch (err) {
      setMessage("Network error. Please try again.");
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setStep("email");
    setEmail("");
    setOtp("");
    setPassword("");
    setConfirmPassword("");
    setMessage("");
    setIsLoading(false);
    onClose();
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  return (
    <div className={styles.overlay} onClick={handleOverlayClick}>
      <div className={styles.popup} style={{boxShadow: 'rgba(180, 0, 104, .15) 0px 48px 100px 0px', border: '2px solid rgb(211, 209, 209)'}}>
        <div className={styles.header}>
          <h2 className={styles.title}>
            {step === "email" && "Reset Password"}
            {step === "otp" && "Verify OTP"}
            {step === "password" && "Set New Password"}
          </h2>
          <button className={styles.closeBtn} onClick={handleClose}>
            ✕
          </button>
        </div>
        <div className={styles.content}>
          {step === "email" && (
            <>
              <div className={styles.inputGroup}>
                <label htmlFor="email" className={styles.label}>Email Address</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className={styles.input}
                  disabled={isLoading}
                  required
                />
              </div>
              <button
                onClick={handleSendOTP}
                disabled={isLoading}
                className={`${styles.btn} ${styles.primaryBtn}`}
              >
                {isLoading ? "Sending OTP..." : "Send OTP"}
              </button>
            </>
          )}
          {step === "otp" && (
            <>
              <div className={styles.otpInfo}>
                <p>We've sent a verification code to:</p>
                <strong className={styles.mainEmail}>{email}</strong>
              </div>
              <div className={styles.inputGroup}>
                <label htmlFor="otp" className={styles.label}>Enter OTP</label>
                <input
                  id="otp"
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="Enter 6 digit code"
                  className={`${styles.input} ${styles.otpInput}`}
                  disabled={isLoading}
                  maxLength={6}
                  required
                />
              </div>
              <div className={styles.buttonGroup}>
                <button
                  onClick={handleVerifyOTP}
                  disabled={isLoading}
                  className={`${styles.btn} ${styles.primaryBtn}`}
                >
                  {isLoading ? "Verifying..." : "Verify OTP"}
                </button>
                <button
                  onClick={() => setStep("email")}
                  disabled={isLoading}
                  className={`${styles.btn} ${styles.secondaryBtn}`}
                >
                  Back
                </button>
              </div>
            </>
          )}
          {step === "password" && (
            <>
              <div className={styles.inputGroup}>
                <label htmlFor="password" className={styles.label}>New Password</label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter new password"
                  className={styles.input}
                  disabled={isLoading}
                  required
                />
              </div>
              <div className={styles.inputGroup}>
                <label htmlFor="confirmPassword" className={styles.label}>Confirm Password</label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className={styles.input}
                  disabled={isLoading}
                  required
                />
              </div>
              <button
                onClick={handleSetPassword}
                disabled={isLoading}
                className={`${styles.btn} ${styles.primaryBtn}`}
              >
                {isLoading ? "Updating..." : "Set Password"}
              </button>
            </>
          )}
          {message && (
            <div
              className={
                message.toLowerCase().includes("success") ||
                message.toLowerCase().includes("sent") ||
                message.toLowerCase().includes("verified")
                  ? styles.successMessage
                  : styles.errorMessage
              }
            >
              {message}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 