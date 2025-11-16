import { inject } from "@vercel/analytics";
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

export function Analytics() {
  const location = useLocation();
  const [analyticsLoaded, setAnalyticsLoaded] = useState(false);

  useEffect(() => {
    // Ensure analytics is initialized
    inject();

    // Check if analytics is available
    const interval = setInterval(() => {
      if (window.va && typeof window.va.pageview === "function") {
        setAnalyticsLoaded(true);
        clearInterval(interval);
      }
    }, 500); // Check every 500ms

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Ensure analytics is loaded before calling pageview
    if (analyticsLoaded && window.va && typeof window.va.pageview === "function") {
      window.va.pageview(location.pathname);
    } else if (!analyticsLoaded) {
      // Still loading, don't warn yet
      return;
    }
    // If analyticsLoaded is true but window.va is not available, it's likely ad blockers
    // Don't spam console warnings in this case
  }, [location, analyticsLoaded]);

  return null;
}
