"use client";

import { useEffect } from "react";
import Lenis from "@studio-freight/lenis";

export default function SmoothScrollProvider({ children }) {
  useEffect(() => {
    const lenis = new Lenis();

    // Make Lenis instance globally available
    window.lenis = lenis;

    // Original Handle global pause/resume via custom events
    // const handleToggleNavMenu = (e) => {
    //   if (!window.lenis) return;
    //   if (e?.detail?.isOpen) {
    //     window.lenis.stop();
    //   } else {
    //     window.lenis.start();
    //   }
    // };
    // window.addEventListener("toggleNavMenu", handleToggleNavMenu);
    // Handle global pause/resume via custom events
    const handleToggleNavMenu = (e) => {
      if (!window.lenis) return;
      const isOpen = e?.detail?.isOpen;

      if (isOpen) {
        // stop smooth scroll
        window.lenis.stop();

        // preserve scroll position and prevent background jump
        const scrollY = window.scrollY;
        document.body.style.position = "fixed";
        document.body.style.top = `-${scrollY}px`;
        document.body.style.left = "0";
        document.body.style.right = "0";
        document.body.style.overflow = "hidden";
        document.body.dataset.scrollY = scrollY;

        // lock touch gestures
        document.body.style.touchAction = "none";
        document.documentElement.style.touchAction = "none";
      } else {
        // resume smooth scroll
        window.lenis.start();

        // restore scroll
        const scrollY = parseInt(document.body.dataset.scrollY || "0", 10);
        document.body.style.position = "";
        document.body.style.top = "";
        document.body.style.left = "";
        document.body.style.right = "";
        document.body.style.overflow = "";
        document.body.style.touchAction = "";
        document.documentElement.style.touchAction = "";

        // restore scroll position
        window.scrollTo(0, scrollY);
      }
    };

    // Listen for the custom event used by modals/menus to lock scrolling
    window.addEventListener("toggleNavMenu", handleToggleNavMenu);

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    // Cleanup function
    return () => {
      window.removeEventListener("toggleNavMenu", handleToggleNavMenu);
      if (window.lenis) {
        window.lenis.destroy();
        delete window.lenis;
      }
    };
  }, []);

  return <>{children}</>;
}
