"use client"

import React, { useState, useEffect } from 'react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import AdminLoginPanel from '../Components/admin/AdminLoginPanel';
import AdminDashboard from '../Components/admin/AdminDashboard';

export default function AdminDashboardRoute() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check authentication status on component mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const response = await fetch('/api/admin/me');
      if (response.ok) {
        setIsLoggedIn(true);
      } else {
        setIsLoggedIn(false);
      }
    } catch (error) {
      setIsLoggedIn(false);
    } finally {
      setIsLoading(false);
    }
  };

  // This handler should be called by AdminLoginPanel on successful login
  function handleLoginSuccess() {
    setIsLoggedIn(true);
  }

  if (isLoading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        background: 'rgba(255,255,255,0.85)',
        backdropFilter: 'blur(4px)',
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        justifyContent: 'center',
        gap: '16px',
        position: 'absolute',
        inset: 0,
        zIndex: 10000,
      }}>
        <div style={{ width: '150px', height: '150px' }}>
          <DotLottieReact src="/loading.lottie" loop autoplay />
        </div>
        <p style={{ fontSize: '1.1rem', fontWeight: 500, color: '#1e293b', margin: 0 }}>Authenticating...</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'rgba(255,255,255,0.95)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {!isLoggedIn ? (
        <AdminLoginPanel
          isOpen={true}
          onClose={() => {}}
          onLoginSuccess={handleLoginSuccess}
        />
      ) : (
        <AdminDashboard />
      )}
    </div>
  );
} 