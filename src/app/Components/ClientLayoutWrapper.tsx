"use client";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export default function ClientLayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isPreloading, setIsPreloading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsPreloading(false);
    }, 2000); // Match preloader duration

    return () => clearTimeout(timer);
  }, []);

  const dashboardPaths = ['/delfadmin', '/delfbo', '/user-dashboard'];
  const hideWhatsApp = dashboardPaths.some(path => pathname?.startsWith(path));

  return (
    <>
      {children}
    </>
  );
}
