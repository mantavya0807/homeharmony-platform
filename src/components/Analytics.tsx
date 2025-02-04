// src/components/Analytics.tsx
import { inject } from '@vercel/analytics';
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export function Analytics() {
  const location = useLocation();

  useEffect(() => {
    // Initialize analytics
    inject();
  }, []);

  useEffect(() => {
    // Track page views on route change
    if (window.va) {
      window.va.pageview(location.pathname);
    }
  }, [location]);

  return null;
}