"use client";
import { useState, useEffect } from "react";
import AuthPopup from "./AuthPopup";
import SignUpPanel from "./SignUpPanel";
import DashboardPanel from "./DashboardPanel";
import { useRouter } from 'next/navigation';

type PanelState = "auth" | "signup" | "dashboard";

type AuthManagerProps = {
  isOpen: boolean;
  onClose: () => void;
  onUserChange?: (user: any) => void;
};

export default function AuthManager({ isOpen, onClose, onUserChange, panelType }: AuthManagerProps & { panelType?: 'auth' | 'profile' | null }) {
  const [panelState, setPanelState] = useState<PanelState>(panelType === 'profile' ? 'dashboard' : 'auth');
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  // Debug: log props
  console.log('AuthManager props:', { isOpen, panelType, panelState });

  // Sync panelState with panelType prop
  useEffect(() => {
    if (panelType === 'profile') setPanelState('dashboard');
    else if (panelType === 'auth') setPanelState('auth');
  }, [panelType]);

  if (!isOpen) return null;

  const handleAuthSignUp = () => {
    setPanelState("signup");
  };

  const handleAuthSignIn = (userData: any) => {
    // Normalize status/requestStatus for UI
    const status = userData.status ?
      userData.status.charAt(0).toUpperCase() + userData.status.slice(1).toLowerCase() : 'Active';
    let requestStatus = 'Pending';
    if (userData.requestStatus) {
      if (userData.requestStatus.toLowerCase() === 'in progress') {
        requestStatus = 'In Progress';
      } else {
        requestStatus = userData.requestStatus.charAt(0).toUpperCase() + userData.requestStatus.slice(1).toLowerCase();
      }
    }
    setUser({ ...userData, status, requestStatus });
    onUserChange?.({ ...userData, status, requestStatus });
    onClose();
    router.push('/user-dashboard');
  };

  const handleAuthGoogleSignIn = () => {
    setPanelState("dashboard");
  };

  const handleSignUpSuccess = (userData: any) => {
    // Normalize status/requestStatus for UI
    const status = userData.status ?
      userData.status.charAt(0).toUpperCase() + userData.status.slice(1).toLowerCase() : 'Active';
    let requestStatus = 'Pending';
    if (userData.requestStatus) {
      if (userData.requestStatus.toLowerCase() === 'in progress') {
        requestStatus = 'In Progress';
      } else {
        requestStatus = userData.requestStatus.charAt(0).toUpperCase() + userData.requestStatus.slice(1).toLowerCase();
      }
    }
    setUser({ ...userData, status, requestStatus });
    onUserChange?.({ ...userData, status, requestStatus });
    onClose();
    router.push('/user-dashboard');
  };

  const handleSignUpClose = () => {
    setPanelState("auth");
  };

  const handleDashboardLogout = () => {
    setPanelState("auth");
  };

  const handleDashboardClose = () => {
    onClose();
    // Reset to auth state for next time
    setPanelState("auth");
  };

  const handleAuthClose = () => {
    onClose();
    // Reset to auth state for next time
    setPanelState("auth");
  };

  return (
    <>
      {panelState === "auth" && (
        <AuthPopup
          isOpen={true}
          onClose={handleAuthClose}
          onSignUp={handleAuthSignUp}
          onSignIn={(userData: any) => handleAuthSignIn(userData)}
          onGoogleSignIn={handleAuthGoogleSignIn}
        />
      )}

      {panelState === "signup" && (
        <SignUpPanel
          isOpen={true}
          onClose={handleSignUpClose}
          onSuccess={(userData: any) => handleSignUpSuccess(userData)}
        />
      )}

      {panelState === "dashboard" && (
        <DashboardPanel
          isOpen={true}
          onClose={handleDashboardClose}
          onLogout={handleDashboardLogout}
          user={user}
        />
      )}
    </>
  );
}