"use client";
import { useState } from "react";
import styles from "./SignUpPanel.module.css";
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/material.css';

type SignUpPanelProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (userData: any) => void;
};

export default function SignUpPanel({ isOpen, onClose, onSuccess }: SignUpPanelProps) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [step, setStep] = useState<"form" | "otp">("form");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleGetOTP = async () => {
    setMessage("");
    setIsLoading(true);

    // Basic validation
    if (!firstName.trim()) {
      setMessage("First name is required");
      setIsLoading(false);
      return;
    }
    if (!lastName.trim()) {
      setMessage("Last name is required");
      setIsLoading(false);
      return;
    }
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
    if (!phone.trim()) {
      setMessage("Phone number is required");
      setIsLoading(false);
      return;
    }

    // Call backend to send OTP
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

    // Call backend to verify OTP and create user if not exists
    try {
      const res = await fetch("/api/user/verify-otp-and-register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp, userName: `${firstName} ${lastName}`, password, phone, profilePicture: "" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error || "Failed to verify OTP");
        setIsLoading(false);
        return;
      }
      setMessage("Account created successfully! Redirecting to Sign In...");
      setIsLoading(false);
      setTimeout(() => {
        onClose(); // Close signup panel
        // Parent should show Sign In panel (auth state)
        if (onSuccess) onSuccess(data.user); // Pass user data up
      }, 2000);
    } catch (err) {
      setMessage("Network error. Please try again.");
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setFirstName("");
    setLastName("");
    setEmail("");
    setPhone("");
    setOtp("");
    setPassword("");
    setStep("form");
    setMessage("");
    setIsLoading(false);
  };

  const handleClose = () => {
    handleReset();
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
            {step === "form" ? "Create Account" : "Verify OTP"}
          </h2>
          <button className={styles.closeBtn} onClick={handleClose}>
            ✕
          </button>
        </div>

        <div className={styles.content}>
          {step === "form" ? (
            <>
            <div className={styles.nameField}>
              <div style={{ display:"flex", flexDirection:"row", gap: 10 }} >
              <div className={styles.inputGroup}>
                <label htmlFor="firstName" className={styles.label} > <div style={{display:'flex', flexDirection:'row', alignItems:'center'}}>First Name <span style={{color: '#ef4444', opacity: .75, fontSize: '1em', marginLeft: 2}}>*</span></div></label>
                <input
                  id="firstName"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Your first name"
                  className={styles.input}
                  disabled={isLoading}
                  required
                />
              </div>
              <div className={styles.inputGroup}>
                <label htmlFor="lastName" className={styles.label}> <div style={{display:'flex', flexDirection:'row', alignItems:'center'}}>Last Name <span style={{color: '#ef4444', opacity: .75, fontSize: '1em', marginLeft: 2}}>*</span></div></label>
                <input
                  id="lastName"
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Your last name"
                  className={styles.input}
                  disabled={isLoading}
                  required
                />
              </div>
              </div>
              </div>

              <div className={styles.inputGroup}>
                <label htmlFor="phone" className={styles.label}> <div style={{display:'flex', flexDirection:'row', alignItems:'center'}}>Phone Number <span style={{color: '#ef4444', opacity: .75, fontSize: '1em', marginLeft: 2}}>*</span></div></label>
                <PhoneInput
                  country={'in'}
                  value={phone}
                  onChange={phone => setPhone(phone)}
                  inputProps={{
                    name: 'phone',
                    required: true,
                    className: styles.input
                  }}
                  inputStyle={{ width: '100%', paddingLeft: 48 }}
                  containerStyle={{ width: '100%' }}
                  specialLabel={''}
                  enableSearch
                />
              </div>

              <div className={styles.inputGroup}>
                      <label htmlFor="email" className={styles.label}> <div style={{display:'flex', flexDirection:'row', alignItems:'center'}}>Email Address <span style={{color: '#ef4444', opacity: .75, fontSize: '1em', marginLeft: 2}}>*</span></div>
                      </label>
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

              <div className={styles.inputGroup}>
                <label htmlFor="password" className={styles.label}> <div style={{display:'flex', flexDirection:'row', alignItems:'center'}}>Password <span style={{color: '#ef4444', opacity: .75, fontSize: '1em', marginLeft: 2}}>*</span></div></label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className={styles.input}
                  disabled={isLoading}
                  required
                />
              </div>

              <button
                onClick={handleGetOTP}
                disabled={isLoading}
                className={`${styles.btn} ${styles.primaryBtn}`}
              >
                {isLoading ? "Sending OTP..." : "Get OTP"}
              </button>
            </>
          ) : (
            <>
              <div className={styles.otpInfo}>
                <p>We've sent a verification code to:</p>
                <strong>{email}</strong>
              </div>

              <div className={styles.inputGroup}>
                <label htmlFor="otp" className={styles.label}> <div style={{display:'flex', flexDirection:'row', alignItems:'center'}}>Enter OTP <span style={{color: '#ef4444', opacity: .75, fontSize: '1em', marginLeft: 2}}>*</span></div>
                </label>
                <input
                  id="otp"
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="Enter 4-6 digit code"
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
                  {isLoading ? "Verifying..." : "Verify OTP & Register"}
                </button>

                <button
                  onClick={() => setStep("form")}
                  disabled={isLoading}
                  className={`${styles.btn} ${styles.secondaryBtn}`}
                >
                  Back
                </button>
              </div>
            </>
          )}

          {message && (
            <div className={`${styles.message} ${
              message.includes("successfully") || message.includes("sent") 
                ? styles.successMessage 
                : styles.errorMessage
            }`}>
              {message}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}