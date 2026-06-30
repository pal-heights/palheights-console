"use client";

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

const Portal = ({ children }: { children: React.ReactNode }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!mounted) {
    return null;
  }

  const portalRoot = document.getElementById('portal');
  if (!portalRoot) {
    // This should not happen if the layout is set up correctly
    console.error("Portal root element not found.");
    return null;
  }

  return createPortal(children, portalRoot);
};

export default Portal;
