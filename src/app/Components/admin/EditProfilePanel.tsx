"use client";
import { useState } from "react";
import styles from "./EditProfilePanel.module.css";

type EditProfilePanelProps = {
  isOpen: boolean;
  onClose: () => void;
  currentName: string;
  currentEmail: string;
};

export default function EditProfilePanel({ 
  isOpen, 
  onClose, 
  currentName, 
  currentEmail, 
  currentProfilePicture 
}: EditProfilePanelProps & { currentProfilePicture?: string }) {
  // Split currentName into first and last name
  const [firstName, setFirstName] = useState(currentName.split(' ')[0] || '');
  const [lastName, setLastName] = useState(currentName.split(' ').slice(1).join(' ') || '');
  const [email] = useState(currentEmail);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(currentProfilePicture || null);
  const [fileError, setFileError] = useState("");
  const [file, setFile] = useState<File | null>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError("");
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/jpg'].includes(file.type)) {
      setFileError("Only .jpg or .jpeg files are allowed.");
      return;
    }
    if (file.size < 5 * 1024 || file.size > 15 * 1024) {
      setFileError("Image must be between 5KB and 15KB.");
      return;
    }
    setFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setProfileImage(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setMessage("");
    setIsLoading(true);
    if (!firstName.trim() || !lastName.trim()) {
      setMessage("First and last name are required.");
      setIsLoading(false);
      return;
    }
    if (!profileImage) {
      setMessage("Profile picture is required.");
      setIsLoading(false);
      return;
    }
    if (fileError) {
      setMessage(fileError);
      setIsLoading(false);
      return;
    }
    // Combine names
    const fullName = `${firstName.trim()} ${lastName.trim()}`;
    // Send to backend (assume /api/user/update-profile exists)
    try {
      const res = await fetch('/api/user/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, email, profilePicture: profileImage }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error || "Failed to update profile");
        setIsLoading(false);
        return;
      }
      setMessage("Profile updated successfully!");
      setIsLoading(false);
      setTimeout(() => {
        onClose();
        setMessage("");
      }, 2000);
    } catch (err) {
      setMessage("Network error. Please try again.");
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setFirstName(currentName.split(' ')[0] || '');
    setLastName(currentName.split(' ').slice(1).join(' ') || '');
    setMessage("");
    setProfileImage(currentProfilePicture || null);
    setFile(null);
    setFileError("");
    onClose();
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2 className={styles.title}>Edit Profile</h2>
        </div>
        <div className={styles.content}>
          <div className={styles.profileIcon}>
            {profileImage ? (
              <img src={profileImage} alt="Profile" style={{ width: 70, height: 70, borderRadius: '50%', objectFit: 'cover' }} />
            ) : (
              <span style={{ fontSize: 32, color: '#aaa' }}>?</span>
            )}
          </div>
          <div className={styles.inputGroup}>
            <label className={styles.label}>First Name</label>
            <input
              type="text"
              value={firstName}
              onChange={e => setFirstName(e.target.value)}
              className={styles.input}
              disabled={isLoading}
            />
          </div>
          <div className={styles.inputGroup}>
            <label className={styles.label}>Last Name</label>
            <input
              type="text"
              value={lastName}
              onChange={e => setLastName(e.target.value)}
              className={styles.input}
              disabled={isLoading}
            />
          </div>
          <div className={styles.inputGroup}>
            <label className={styles.label}>Email</label>
            <input
              type="email"
              value={email}
              className={styles.input}
              disabled
            />
          </div>
          <div className={styles.inputGroup}>
            <label className={styles.label}>Profile Picture (.jpg/.jpeg, 5KB-15KB)</label>
            <input
              type="file"
              accept=".jpg,.jpeg,image/jpeg"
              onChange={handleFileChange}
              className={styles.input}
              disabled={isLoading}
            />
            {fileError && <div className={styles.errorMessage}>{fileError}</div>}
          </div>
          <div className={styles.buttonGroup}>
            <button className={styles.btn + ' ' + styles.saveBtn} onClick={handleSave} disabled={isLoading}>
              {isLoading ? "Saving..." : "Save"}
            </button>
            <button className={styles.btn + ' ' + styles.cancelBtn} onClick={handleCancel} disabled={isLoading}>
              Cancel
            </button>
          </div>
          {message && <div className={styles.message}>{message}</div>}
        </div>
      </div>
    </div>
  );
}